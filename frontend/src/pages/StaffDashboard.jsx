import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  KeyRound,
  User,
  LogOut,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldAlert,
  MapPin,
  RotateCcw,
  AlertCircle,
  UserCheck,
  Camera,
  ThumbsUp,
} from 'lucide-react';
import { useApp } from '../context/useApp';
import RepairDialog from '../components/RepairDialog';
import CampusLocationManager from '../components/staff/CampusLocationManager';
import WaterPointManager from '../components/staff/WaterPointManager';
import { formatRelativeTime, formatDateTime } from '../utils/formatTime';
import { STAFF_REFRESH_INTERVAL_MS, startDashboardPolling } from '../lib/reliability';
import { formatWaterPointType } from '../lib/locationFilters';
import { getReportPhotoUrl } from '../lib/api';

/**
 * StaffDashboard ("/staff")
 * Facilities operations portal:
 * - Access-key login gate (no demo credentials)
 * - Metric status tiles
 * - "Needs Attention" queue with atomic issue claiming, confirmation counts, and photo display
 * - Completed repairs ledger
 * - Staff-only Water Points & Campus Location management tab
 */
export function StaffDashboard() {
  const {
    waterPoints,
    activeWaterPoints,
    campusLocations,
    reports,
    loading,
    isRefreshing,
    error,
    lastUpdated,
    refreshData,
    claimReportAction,
    resolveReportAction,
    createCampusLocationAction,
    updateCampusLocationAction,
    createWaterPointAction,
    updateWaterPointAction,
    staffSession,
    staffAuthLoading,
    loginStaff,
    logoutStaff,
  } = useApp();

  // Automatically refresh issue, assignment, and inventory data every 30s
  useEffect(() => {
    return startDashboardPolling(() => {
      void refreshData({ silent: true });
    }, STAFF_REFRESH_INTERVAL_MS);
  }, [refreshData]);

  const handleManualRefresh = useCallback(() => {
    void refreshData({ silent: true, notifyOnError: true });
  }, [refreshData]);

  const isAuthenticated = Boolean(staffSession?.authenticated);
  const staffId = staffSession?.staff?.id;
  const staffName = staffSession?.staff?.display_name || '';

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'inventory'
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [claimingId, setClaimingId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const waterPointsMap = useMemo(() => {
    const map = new Map();
    waterPoints.forEach((wp) => map.set(wp.id, wp));
    return map;
  }, [waterPoints]);

  const unresolvedQueue = useMemo(() => {
    return reports
      .filter((r) => r.status === 'reported_unavailable')
      .sort((a, b) => new Date(a.reported_at).getTime() - new Date(b.reported_at).getTime());
  }, [reports]);

  const completedLog = useMemo(() => {
    return reports
      .filter((r) => (r.status === 'staff_confirmed_resolved' || r.status === 'resolved' || r.resolved_at) && r.resolved_at)
      .sort((a, b) => new Date(b.resolved_at).getTime() - new Date(a.resolved_at).getTime());
  }, [reports]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!inputKey.trim()) {
      setAuthError('Please enter your staff access key.');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');
    try {
      await loginStaff(inputKey.trim());
      setInputKey('');
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError('Invalid staff access key. Access keys are case-sensitive.');
      } else if (err.response?.status === 429) {
        setAuthError(err.response?.data?.detail || 'Too many login attempts. Please wait a minute before retrying.');
      } else {
        setAuthError('Unable to authenticate with facilities server. Please verify your connection.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutStaff();
    } catch {
      // logoutStaff retains session state and displays an error toast
    }
  };

  const handleClaim = async (reportId) => {
    setClaimingId(reportId);
    try {
      await claimReportAction(reportId);
    } catch {
      // claimReportAction refreshes state on 409 and shows error toast
    } finally {
      setClaimingId(null);
    }
  };

  const handleConfirmResolve = async (reportId, resolutionNotes) => {
    setIsResolving(true);
    try {
      await resolveReportAction(reportId, resolutionNotes);
      setSelectedReport(null);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      {/* ── Page Hero Section ───────────────────────────────────────────── */}
      <section className="wh-hero-gradient text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#0B1736]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-[#D6A63C]">
              <Wrench className="w-3.5 h-3.5" />
              <span>Facilities Operations</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight leading-tight">
              Facilities Staff Desk
            </h1>

            <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl font-normal leading-relaxed">
              Review real-time student issue notices, claim assignments, manage campus water points, and confirm repairs.
            </p>
          </div>

          {isAuthenticated && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between sm:justify-end gap-4 shrink-0 backdrop-blur-xs">
              <div className="text-left sm:text-right">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                  <User className="w-3.5 h-3.5 text-[#D6A63C]" />
                  <span>{staffName}</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">Authorized Staff Session</p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#CBD5E1] hover:text-white bg-white/10 hover:bg-[#D94B4B]/80 rounded-lg border border-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {!isAuthenticated ? (
          <section aria-label="Staff Authentication Gate" className="max-w-md mx-auto py-8">
            <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-xs p-6 sm:p-7 text-[#102454]">
              <div className="w-10 h-10 bg-[#EDF2F9] border border-[#DFE6F0] rounded-xl flex items-center justify-center mb-3 text-[#102454]">
                <KeyRound className="w-5 h-5 text-[#102454]" />
              </div>

              <h2 className="text-lg font-bold font-heading mb-1 text-[#102454]">
                Staff Authentication
              </h2>
              <p className="text-xs sm:text-sm text-[#5A6B87] mb-5">
                Enter your staff access key to verify your identity and authorize repair entries.
              </p>

              {authError && (
                <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F9D3D3] rounded-lg text-xs font-medium text-[#D94B4B] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="staff-key" className="block text-xs font-semibold text-[#102454] mb-1.5">
                    Staff Access Key
                  </label>
                  <input
                    id="staff-key"
                    type="password"
                    required
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter facilities passkey"
                    disabled={isLoggingIn || staffAuthLoading}
                    className="w-full px-3.5 py-2.5 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs sm:text-sm focus:border-[#102454] focus:ring-1 focus:ring-[#102454] outline-hidden placeholder:text-[#94A3B8] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || staffAuthLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#102454] hover:bg-[#183375] text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoggingIn ? 'Verifying...' : 'Sign In to Staff Desk'}
                </button>
              </form>
            </div>
          </section>
        ) : (
          <>
            {/* Refresh Status & Staff Section Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex items-center p-1 bg-[#F1F5F9] border border-[#DFE6F0] rounded-lg text-xs self-start">
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'queue'
                      ? 'bg-white text-[#102454] font-semibold shadow-xs'
                      : 'text-[#5A6B87] hover:text-[#102454]'
                  }`}
                >
                  Issue Queue ({unresolvedQueue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-white text-[#102454] font-semibold shadow-xs'
                      : 'text-[#5A6B87] hover:text-[#102454]'
                  }`}
                >
                  Water Points &amp; Locations ({waterPoints.length})
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#5A6B87]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#8C9CB3] shrink-0" />
                  <span>
                    Auto-refreshes every 30s
                    {lastUpdated && !error ? ` \u2022 Updated ${formatDateTime(lastUpdated)}` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={loading || isRefreshing}
                  aria-label="Refresh staff dashboard data"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#DFE6F0] rounded-lg text-xs font-medium text-[#102454] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 bg-[#FDF2F2] border border-[#F8C9C9] rounded-xl text-xs font-medium text-[#B91C1C] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#D94B4B]" />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={loading || isRefreshing}
                  className="px-2.5 py-1 bg-white hover:bg-[#FDF2F2] border border-[#F8C9C9] rounded-md font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {loading || isRefreshing ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            )}

            {/* Metric Status Tiles */}
            <section aria-label="Operational Metrics">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#5A6B87]">Needs Attention</span>
                    <span className="w-2 h-2 rounded-full bg-[#D94B4B]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#102454] font-heading">
                    {unresolvedQueue.length}
                  </div>
                  <p className="text-[11px] text-[#5A6B87] mt-1">
                    Unresolved issue {unresolvedQueue.length === 1 ? 'ticket' : 'tickets'}
                  </p>
                </div>

                <div className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#5A6B87]">Completed Repairs</span>
                    <span className="w-2 h-2 rounded-full bg-[#2F8A57]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#102454] font-heading">
                    {completedLog.length}
                  </div>
                  <p className="text-[11px] text-[#5A6B87] mt-1">Confirmed resolved repairs</p>
                </div>

                <div className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#5A6B87]">Monitored Stations</span>
                    <span className="w-2 h-2 rounded-full bg-[#102454]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#102454] font-heading">
                    {activeWaterPoints.length}
                  </div>
                  <p className="text-[11px] text-[#5A6B87] mt-1">Active campus dispensers</p>
                </div>
              </div>
            </section>

            {activeTab === 'inventory' ? (
              <div className="space-y-10">
                <WaterPointManager
                  waterPoints={waterPoints}
                  campusLocations={campusLocations}
                  onCreateWaterPoint={createWaterPointAction}
                  onUpdateWaterPoint={updateWaterPointAction}
                />
                <CampusLocationManager
                  campusLocations={campusLocations}
                  onCreateLocation={createCampusLocationAction}
                  onUpdateLocation={updateCampusLocationAction}
                />
              </div>
            ) : (
              <>
                {/* ── Unresolved Reports Queue ───────────────────────────── */}
                <section aria-label="Unresolved Reports Queue" className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-[#DFE6F0] pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454]">
                        Needs Attention
                      </h2>
                      <p className="text-xs text-[#5A6B87]">
                        Sorted by oldest notice first &bull; Claim an issue before dispatching or confirm repair
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FDF2F2] text-[#D94B4B] border border-[#F9D3D3]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D94B4B]" />
                      {unresolvedQueue.length} Pending
                    </span>
                  </div>

                  {unresolvedQueue.length === 0 ? (
                    <div className="bg-white border border-[#DFE6F0] rounded-xl p-8 sm:p-12 text-center shadow-xs">
                      <div className="w-12 h-12 bg-[#EBF6EE] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#2F8A57]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-[#102454] font-heading mb-1">
                        All campus dispensers operational
                      </h3>
                      <p className="text-xs text-[#5A6B87] max-w-sm mx-auto">
                        Zero open notices reported by students or technicians. Good work!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {unresolvedQueue.map((report) => {
                        const wp = waterPointsMap.get(report.water_point_id);
                        const assignedName = report.assigned_staff?.display_name;
                        const isAssignedToMe =
                          Boolean(report.assigned_staff_id) &&
                          report.assigned_staff_id === staffId;
                        const isAssignedToOther =
                          Boolean(report.assigned_staff_id) && !isAssignedToMe;
                        const photoUrl = report.has_photo
                          ? getReportPhotoUrl(report.photo_url)
                          : null;

                        return (
                          <div
                            key={report.id}
                            className="bg-white border border-[#DFE6F0] hover:border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDF2F2] text-[#D94B4B] border border-[#F9D3D3]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D94B4B]" />
                                  Reported Unavailable
                                </span>
                                {isAssignedToMe && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF2F9] text-[#102454] border border-[#CBD5E1]">
                                    <UserCheck className="w-3 h-3 text-[#2F8A57]" />
                                    Assigned to you
                                  </span>
                                )}
                                {isAssignedToOther && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF7EA] text-[#B45309] border border-[#FCE1B5]">
                                    <UserCheck className="w-3 h-3" />
                                    Assigned to {assignedName || 'another staff member'}
                                  </span>
                                )}
                                {wp?.building && (
                                  <span className="text-[11px] font-medium text-[#5A6B87] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                    {wp.building}
                                  </span>
                                )}
                                {wp?.type && (
                                  <span className="text-[11px] font-medium text-[#5A6B87] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                    {formatWaterPointType(wp.type)}
                                  </span>
                                )}
                                {report.confirmation_count > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#102454] bg-[#EDF2F9] px-2 py-0.5 rounded border border-[#DFE6F0]">
                                    <ThumbsUp className="w-3 h-3" />
                                    {report.confirmation_count} confirmed
                                  </span>
                                )}
                              </div>

                              <div>
                                <h3 className="text-sm sm:text-base font-bold text-[#102454] font-heading leading-snug">
                                  {wp?.name || `Water Point #${report.water_point_id}`}
                                </h3>
                                {wp?.location && (
                                  <div className="flex items-center gap-1.5 text-xs text-[#5A6B87] mt-0.5">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#102454]" />
                                    <span>{wp.location}</span>
                                  </div>
                                )}
                              </div>

                              <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#334155] space-y-2">
                                <span className="font-semibold text-[#102454] block text-[11px] uppercase tracking-wider">
                                  Reported Problem
                                </span>
                                <p className="italic leading-relaxed">&ldquo;{report.description}&rdquo;</p>
                                {photoUrl && (
                                  <a
                                    href={photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 p-1.5 bg-white border border-[#DFE6F0] rounded-lg hover:border-[#102454]"
                                  >
                                    <img
                                      src={photoUrl}
                                      alt={`Attached issue photo for ${wp?.name || 'water point'}`}
                                      className="w-14 h-14 object-cover rounded"
                                    />
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#102454] pr-1">
                                      <Camera className="w-3.5 h-3.5" />
                                      View photo
                                    </span>
                                  </a>
                                )}
                                <div className="flex items-center gap-1 text-[11px] text-[#8C9CB3] pt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>Reported {formatRelativeTime(report.reported_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Action CTAs */}
                            <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#DFE6F0] flex md:flex-col items-stretch md:items-end gap-2">
                              {!report.assigned_staff_id && (
                                <button
                                  type="button"
                                  onClick={() => handleClaim(report.id)}
                                  disabled={claimingId === report.id}
                                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#102454] hover:bg-[#183375] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-[#D6A63C]" />
                                  <span>{claimingId === report.id ? 'Claiming...' : 'Claim Issue'}</span>
                                </button>
                              )}

                              {isAssignedToMe && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReport(report)}
                                  className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2F8A57] hover:bg-[#277449] text-white shadow-xs transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm Repair</span>
                                </button>
                              )}

                              {isAssignedToOther && (
                                <span className="text-[11px] font-medium text-[#B45309]">
                                  Locked by {assignedName || 'assigned staff'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* ── Completed Repairs Log ──────────────────────────────── */}
                <section aria-label="Completed Repairs Log" className="space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-[#DFE6F0] pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454]">
                        Completed Repairs
                      </h2>
                      <p className="text-xs text-[#5A6B87]">
                        Audit ledger of confirmed repairs &bull; Sorted newest first
                      </p>
                    </div>

                    <span className="text-xs font-medium text-[#5A6B87]">
                      {completedLog.length} {completedLog.length === 1 ? 'record' : 'records'}
                    </span>
                  </div>

                  {completedLog.length === 0 ? (
                    <div className="bg-white border border-[#DFE6F0] rounded-xl p-8 text-center text-[#5A6B87] text-xs shadow-xs">
                      No repair resolutions logged yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {completedLog.map((rep) => {
                        const wp = waterPointsMap.get(rep.water_point_id);
                        return (
                          <div
                            key={rep.id}
                            className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF6EE] text-[#2F8A57] border border-[#D2EDD9]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2F8A57]" />
                                Resolved
                              </span>
                              {rep.resolved_at && (
                                <span className="text-[11px] text-[#5A6B87]">
                                  {formatRelativeTime(rep.resolved_at)}
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="text-sm font-bold text-[#102454] font-heading leading-tight">
                                {wp?.name || `Water Point #${rep.water_point_id}`}
                              </h3>
                              {wp?.location && (
                                <div className="flex items-center gap-1.5 text-xs text-[#5A6B87] mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#102454] shrink-0" />
                                  <span>{wp.location} {wp.building ? `(${wp.building})` : ''}</span>
                                </div>
                              )}
                            </div>

                            <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-lg p-2.5 text-xs space-y-1.5">
                              <div className="text-[#5A6B87]">
                                <strong className="text-[#334155] font-semibold">Issue:</strong> &ldquo;{rep.description}&rdquo;
                              </div>
                              {rep.resolution_notes && (
                                <div className="text-[#102454] pt-1.5 border-t border-[#E2E8F0]">
                                  <strong className="text-[#334155] font-semibold">Resolution:</strong> {rep.resolution_notes}
                                </div>
                              )}
                            </div>

                            <div className="pt-0.5 flex items-center justify-between text-[11px] text-[#5A6B87]">
                              <span>Repaired by <strong className="text-[#102454] font-medium">{rep.resolved_by || 'Staff'}</strong></span>
                              {rep.resolved_at && (
                                <span className="text-[#94A3B8]">{formatDateTime(rep.resolved_at)}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      {/* Repair Resolution Modal Dialog */}
      <RepairDialog
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        onResolve={handleConfirmResolve}
        report={selectedReport}
        waterPointName={selectedReport ? waterPointsMap.get(selectedReport.water_point_id)?.name : ''}
        isSubmitting={isResolving}
        staffName={staffName}
      />
    </div>
  );
}

export default StaffDashboard;
