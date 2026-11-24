import { useState, useMemo } from 'react';
import { KeyRound, User, LogOut, CheckCircle2, Clock, Wrench, ShieldAlert, AlertTriangle, Building2, MapPin } from 'lucide-react';
import { useApp } from '../context/useApp';
import RepairDialog from '../components/RepairDialog';
import { formatRelativeTime, formatDateTime } from '../utils/formatTime';

/**
 * StaffDashboard ("/staff")
 * Facilities operations portal redesigned to strictly match the Water Harbour design system:
 * - Page-specific navy hero
 * - Clean authentication card
 * - Summary metric cards
 * - Unresolved issue queue (sorted oldest first)
 * - Modal dialog for logging resolution notes
 * - Completed repairs ledger (sorted newest first)
 */
export function StaffDashboard() {
  const {
    waterPoints,
    reports,
    resolveReportAction,
  } = useApp();

  // Session storage staff authentication state
  const [staffName, setStaffName] = useState(() => sessionStorage.getItem('staff_name') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(sessionStorage.getItem('staff_name') && sessionStorage.getItem('staff_access_key'));
  });

  // Authentication form state
  const [inputName, setInputName] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState('');

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
  const handleSignIn = (e) => {
    e.preventDefault();
    if (!inputName.trim() || !inputKey.trim()) {
      setAuthError('Please enter both your staff name and access key.');
      return;
    }

    sessionStorage.setItem('staff_name', inputName.trim());
    sessionStorage.setItem('staff_access_key', inputKey.trim());
    setStaffName(inputName.trim());
    setIsAuthenticated(true);
    setAuthError('');
  };

  // Sign out handler
  const handleSignOut = () => {
    sessionStorage.removeItem('staff_name');
    sessionStorage.removeItem('staff_access_key');
    setStaffName('');
    setIsAuthenticated(false);
  };

  // Confirm repair resolution
  const handleConfirmResolve = async (reportId, resolvedBy, resolutionNotes) => {
    setIsResolving(true);
    try {
      await resolveReportAction(reportId, resolvedBy, resolutionNotes);
      setSelectedReport(null);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Hero Section ───────────────────────────────────────────── */}
      <section className="wh-hero-gradient text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0B1736]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D6A63C]">
              <Wrench className="w-3.5 h-3.5" />
              <span>Facilities Operations</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              Facilities Staff Desk
            </h1>

            <p className="text-sm sm:text-base text-[#CBD5E1] max-w-xl font-normal leading-relaxed">
              Review real-time student issue notices, dispatch technicians, and confirm repairs to keep campus water points available.
            </p>
          </div>

          {/* Session Info Bar */}
          {isAuthenticated && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-center justify-between sm:justify-end gap-4 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end text-sm font-bold text-white">
                  <User className="w-4 h-4 text-[#D6A63C]" />
                  <span>{staffName}</span>
                </div>
                <p className="text-xs text-[#CBD5E1]">Authorized Staff Session</p>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-[#D94B4B] rounded-lg border border-white/20 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Authentication Gate (if not signed in) ───────────────────────── */}
        {!isAuthenticated ? (
          <section aria-label="Staff Authentication Gate" className="max-w-md mx-auto py-8">
            <div className="bg-white border border-[#DFE6F0] rounded-2xl shadow-xs p-6 sm:p-8 text-[#102454]">
              <div className="w-12 h-12 bg-[#EDF2F9] border border-[#DFE6F0] rounded-xl flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6 text-[#102454]" />
              </div>

              <h2 className="text-xl font-bold font-heading mb-1 text-[#102454]">
                Staff Authentication
              </h2>
              <p className="text-xs sm:text-sm text-[#71809B] mb-6">
                Enter your staff member name and access key to authorize repair entries.
              </p>

              {authError && (
                <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F9D3D3] rounded-xl text-xs font-semibold text-[#D94B4B] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="staff-name" className="block text-xs font-semibold text-[#102454] uppercase tracking-wider mb-1.5">
                    Staff Member Name
                  </label>
                  <input
                    id="staff-name"
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g. Dave Miller"
                    className="w-full px-3.5 py-2.5 bg-white text-[#102454] border border-[#DFE6F0] rounded-xl text-sm focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#94A3B8]"
                  />
                </div>

                <div>
                  <label htmlFor="staff-key" className="block text-xs font-semibold text-[#102454] uppercase tracking-wider mb-1.5">
                    Staff Access Key
                  </label>
                  <input
                    id="staff-key"
                    type="password"
                    required
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter facilities passkey"
                    className="w-full px-3.5 py-2.5 bg-white text-[#102454] border border-[#DFE6F0] rounded-xl text-sm focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#94A3B8]"
                  />
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    Demo key: <code className="bg-[#F1F5F9] px-1 py-0.5 rounded font-mono text-[#102454]">campus-staff-key-2026</code>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#102454] hover:bg-[#183375] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                >
                  Sign In to Staff Desk
                </button>
              </form>
            </div>
          </section>
        ) : (
          /* ── Authenticated Staff Operations ─────────────────────────────── */
          <>
            {/* Summary Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#DFE6F0] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#71809B] uppercase tracking-wider">
                    Unresolved Queue
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-[#D94B4B]" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#D94B4B] font-heading">
                  {unresolvedQueue.length}
                </div>
                <p className="text-xs text-[#71809B] mt-1">
                  Active dispenser issues awaiting repair
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#DFE6F0] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#71809B] uppercase tracking-wider">
                    Completed Repairs
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#EBF6EE] flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8A57]" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#2F8A57] font-heading">
                  {completedLog.length}
                </div>
                <p className="text-xs text-[#71809B] mt-1">
                  Total logged resolutions on record
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-[#DFE6F0] shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#71809B] uppercase tracking-wider">
                    Total Monitored
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#EDF2F9] flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#102454]" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-[#102454] font-heading">
                  {waterPoints.length}
                </div>
                <p className="text-xs text-[#71809B] mt-1">
                  Water dispensers across campus
                </p>
              </div>
            </div>

            {/* Unresolved Issues Queue */}
            <section aria-label="Unresolved Reports Queue" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-heading text-[#102454]">
                    Needs Attention ({unresolvedQueue.length})
                  </h2>
                  <p className="text-xs sm:text-sm text-[#71809B]">
                    Dispenser issues sorted oldest first to prioritize aging student notices
                  </p>
                </div>
              </div>

              {unresolvedQueue.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white border border-[#DFE6F0] rounded-xl shadow-xs">
                  <CheckCircle2 className="w-10 h-10 text-[#2F8A57] mx-auto mb-3" />
                  <h3 className="text-base font-bold font-heading text-[#102454]">
                    All Campus Water Points Clear
                  </h3>
                  <p className="text-xs text-[#71809B] mt-1">
                    No active unresolved issue notices at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unresolvedQueue.map((report) => {
                    const wp = waterPointsMap.get(report.water_point_id);
                    return (
                      <div
                        key={report.id}
                        className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FDF2F2] text-[#D94B4B] border border-[#F9D3D3]">
                              Reported Unavailable
                            </span>
                            {wp?.building && (
                              <span className="text-xs font-semibold text-[#71809B] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                                {wp.building}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-[#102454] font-heading leading-tight">
                            {wp?.name || `Water Point #${report.water_point_id}`}
                          </h3>

                          {wp?.location && (
                            <div className="flex items-center gap-1.5 text-xs text-[#71809B]">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#102454]" />
                              <span>{wp.location}</span>
                            </div>
                          )}

                          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs">
                            <span className="font-bold text-[#D94B4B] block mb-0.5">Reported Problem:</span>
                            <p className="italic text-[#334155]">&ldquo;{report.description}&rdquo;</p>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#71809B]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Reported {formatRelativeTime(report.reported_at)} ({formatDateTime(report.reported_at)})</span>
                          </div>
                        </div>

                        <div className="shrink-0 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2F8A57] hover:bg-[#277449] rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Resolved</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Completed Repairs History */}
            <section aria-label="Completed Repairs Log" className="space-y-4 pt-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-[#102454]">
                  Completed Repairs Log ({completedLog.length})
                </h2>
                <p className="text-xs sm:text-sm text-[#71809B]">
                  Historical ledger of maintenance completed by the campus facilities team
                </p>
              </div>

              {completedLog.length === 0 ? (
                <div className="text-center py-8 px-4 bg-white border border-[#DFE6F0] rounded-xl shadow-xs text-xs text-[#71809B]">
                  No completed repairs recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedLog.map((rep) => {
                    const wp = waterPointsMap.get(rep.water_point_id);
                    return (
                      <div
                        key={rep.id}
                        className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#EBF6EE] text-[#2F8A57] border border-[#D2EDD9]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolved
                          </span>
                          {rep.resolved_at && (
                            <span className="text-[11px] text-[#94A3B8]">
                              {formatRelativeTime(rep.resolved_at)}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-[#102454] font-heading leading-tight">
                          {wp?.name || `Water Point #${rep.water_point_id}`}
                        </h3>

                        {wp?.location && (
                          <div className="flex items-center gap-1.5 text-xs text-[#71809B]">
                            <MapPin className="w-3.5 h-3.5 text-[#102454] shrink-0" />
                            <span>{wp.location} {wp.building ? `(${wp.building})` : ''}</span>
                          </div>
                        )}

                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 text-xs space-y-1">
                          <div className="text-[#71809B]">
                            <strong>Original Issue:</strong> &ldquo;{rep.description}&rdquo;
                          </div>
                          {rep.resolution_notes && (
                            <div className="text-[#102454] pt-1 border-t border-[#E2E8F0]">
                              <strong>Resolution Notes:</strong> {rep.resolution_notes}
                            </div>
                          )}
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px] text-[#71809B]">
                          <span>Repaired by <strong>{rep.resolved_by || 'Staff'}</strong></span>
                          {rep.resolved_at && (
                            <span>{formatDateTime(rep.resolved_at)}</span>
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

      {/* Repair Confirmation Dialog */}
      {selectedReport && (
        <RepairDialog
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          onResolve={handleConfirmResolve}
          report={selectedReport}
          waterPointName={waterPointsMap.get(selectedReport.water_point_id)?.name}
          isSubmitting={isResolving}
        />
      )}
    </div>
  );
}

export default StaffDashboard;
