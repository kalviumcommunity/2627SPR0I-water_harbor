import { useState, useMemo, useEffect, useCallback } from 'react';
import { KeyRound, User, LogOut, CheckCircle2, Clock, Wrench, ShieldAlert, MapPin, RotateCcw, AlertCircle } from 'lucide-react';
import { useApp } from '../context/useApp';
import RepairDialog from '../components/RepairDialog';
import { formatRelativeTime, formatDateTime } from '../utils/formatTime';
import { STAFF_REFRESH_INTERVAL_MS, startDashboardPolling } from '../lib/reliability';

/**
 * StaffDashboard ("/staff")
 * Facilities operations portal designed with SaaS-grade restraint:
 * - Compact dark navy hero with operational badge & session bar
 * - Clean, focused authentication card (access key only)
 * - Metric status tiles (Unresolved, Completed, Monitored)
 * - "Needs Attention" queue sorted oldest first
 * - Sleek repair modal dialog for resolution logging
 * - Completed repairs ledger sorted newest first
 */
export function StaffDashboard() {
  const {
    waterPoints,
    reports,
    loading,
    isRefreshing,
    error,
    lastUpdated,
    refreshData,
    resolveReportAction,
    staffSession,
    staffAuthLoading,
    loginStaff,
    logoutStaff,
  } = useApp();

  // Automatically refresh issue and resolution data every 30s while dashboard is open
  useEffect(() => {
    return startDashboardPolling(() => {
      void refreshData({ silent: true });
    }, STAFF_REFRESH_INTERVAL_MS);
  }, [refreshData]);

  const handleManualRefresh = useCallback(() => {
    void refreshData({ silent: true, notifyOnError: true });
  }, [refreshData]);

  // Derived staff authentication state from AppContext HttpOnly session
  const isAuthenticated = Boolean(staffSession?.authenticated);
  const staffName = staffSession?.staff?.display_name || '';

  // Authentication form state
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dialog state for resolving
  const [selectedReport, setSelectedReport] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  // Map of water points by ID
  const waterPointsMap = useMemo(() => {
    const map = new Map();
    waterPoints.forEach((wp) => map.set(wp.id, wp));
    return map;
  }, [waterPoints]);

  // "N to fix" queue: unresolved reports sorted oldest first
  const unresolvedQueue = useMemo(() => {
    return reports
      .filter((r) => r.status === 'reported_unavailable')
      .sort((a, b) => new Date(a.reported_at).getTime() - new Date(b.reported_at).getTime());
  }, [reports]);

  // Completed repairs log: resolved reports sorted newest first
  const completedLog = useMemo(() => {
    return reports
      .filter((r) => (r.status === 'staff_confirmed_resolved' || r.status === 'resolved' || r.resolved_at) && r.resolved_at)
      .sort((a, b) => new Date(b.resolved_at).getTime() - new Date(a.resolved_at).getTime());
  }, [reports]);

  // Sign in handler
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

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logoutStaff();
    } catch {
      // logoutStaff retains session state and displays an error toast
    }
  };

  // Confirm repair resolution
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
              Review real-time student issue notices, dispatch technicians, and confirm repairs to keep campus water points available.
            </p>
          </div>

          {/* Session Info Bar */}
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
        {/* ── Authentication Gate (if not signed in) ───────────────────────── */}
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
                  <div className="flex items-center justify-between text-xs text-[#5A6B87] mt-2">
                    <span>
                      Demo passkey: <code className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[11px] font-mono text-[#102454] border border-[#E2E8F0]">campus-staff-key-2026</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => setInputKey('campus-staff-key-2026')}
                      className="text-[11px] font-semibold text-[#102454] hover:text-[#D6A63C] underline cursor-pointer"
                    >
                      Fill Demo Key
                    </button>
                  </div>
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
          /* ── Authenticated Staff Operations ─────────────────────────────── */
          <>
            {/* Refresh Status & Manual Refresh Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5A6B87]">
              <div className="flex items-center gap-2">
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F8FAFC] border border-[#DFE6F0] rounded-lg text-xs font-medium text-[#102454] shadow-xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
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
                {/* Needs Attention */}
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

                {/* Completed Repairs */}
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

                {/* Total Points Monitored */}
                <div className="bg-white border border-[#DFE6F0] rounded-xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#5A6B87]">Monitored Stations</span>
                    <span className="w-2 h-2 rounded-full bg-[#102454]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#102454] font-heading">
                    {waterPoints.length}
                  </div>
                  <p className="text-[11px] text-[#5A6B87] mt-1">Active campus dispensers</p>
                </div>
              </div>
            </section>

            {/* ── Unresolved Reports Queue ───────────────────────────────────── */}
            <section aria-label="Unresolved Reports Queue" className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-[#DFE6F0] pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454]">
                    Needs Attention
                  </h2>
                  <p className="text-xs text-[#5A6B87]">
                    Sorted by oldest notice first &bull; Requires physical verification & repair
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
                            {wp?.building && (
                              <span className="text-[11px] font-medium text-[#5A6B87] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                {wp.building}
                              </span>
                            )}
                            {wp?.type && (
                              <span className="text-[11px] font-medium text-[#5A6B87] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                {wp.type}
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

                          <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-lg p-3 text-xs text-[#334155] space-y-1">
                            <span className="font-semibold text-[#102454] block text-[11px] uppercase tracking-wider">
                              Reported Problem
                            </span>
                            <p className="italic leading-relaxed">&ldquo;{report.description}&rdquo;</p>
                            <div className="flex items-center gap-1 text-[11px] text-[#8C9CB3] pt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>Reported {formatRelativeTime(report.reported_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action CTA */}
                        <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#DFE6F0] flex md:flex-col items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#2F8A57] hover:bg-[#277449] text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm Repair</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ── Completed Repairs Log ──────────────────────────────────────── */}
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
