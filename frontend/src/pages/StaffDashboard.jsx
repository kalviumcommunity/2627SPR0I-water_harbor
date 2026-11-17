import { useState, useMemo } from 'react';
import { KeyRound, User, LogOut, CheckCircle2, Clock, Wrench, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/useApp';
import WaterDrop from '../components/WaterDrop';
import RepairDialog from '../components/RepairDialog';
import { formatRelativeTime, formatDateTime } from '../utils/formatTime';

/**
 * StaffDashboard ("/staff")
 * Facilities staff operations portal with simple passkey gate,
 * "N to fix" queue (oldest first), repair logging, and completed repairs ledger.
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

  // Gate input form state
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
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-8">
      {/* Header Banner */}
      <div className="bg-paper border-ink-3 shadow-hard-lg rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-mint/40 border-2 border-ink rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Wrench className="w-3.5 h-3.5 text-ink" />
            <span>Facilities Operations</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading leading-tight">
            Facilities Staff Desk
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-ink/80 max-w-lg">
            Review active issues reported by campus community members and record completed maintenance.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="bg-paper border-ink-3 shadow-hard-sm rounded-2xl p-4 shrink-0 text-right">
            <div className="flex items-center gap-2 justify-end text-sm font-bold text-ink mb-1">
              <User className="w-4 h-4 text-cobalt" />
              <span>{staffName}</span>
            </div>
            <p className="text-xs text-ink/70 mb-3 font-medium">Active Staff Session</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-coral bg-coral/10 hover:bg-coral hover:text-white rounded-xl border-2 border-coral transition-colors btn-tactile cursor-pointer shadow-hard-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <div className="shrink-0">
            <WaterDrop status="staff_confirmed_resolved" size="lg" />
          </div>
        )}
      </div>

      {/* Staff Authentication Gate if not signed in */}
      {!isAuthenticated ? (
        <section aria-label="Staff Passkey Gate" className="max-w-md mx-auto">
          <div className="bg-paper border-ink-3 shadow-hard-xl rounded-2xl p-6 sm:p-8 text-ink">
            <div className="w-12 h-12 bg-sun border-2 border-ink rounded-2xl flex items-center justify-center shadow-hard-sm mb-4">
              <KeyRound className="w-6 h-6 text-ink" />
            </div>

            <h2 className="text-xl font-heading mb-1">Staff Access Gate</h2>
            <p className="text-xs text-ink/80 mb-6">
              Enter your staff name and shared access key to authorize repair entries.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-coral/15 border-2 border-coral rounded-xl text-xs font-semibold text-coral flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="staff-name" className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  id="staff-name"
                  type="text"
                  required
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Dave Miller (Plumbing)"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-paper text-ink border-2 border-ink rounded-xl shadow-hard-sm focus:border-cobalt focus:ring-0 font-medium placeholder:text-ink/40"
                />
              </div>

              <div>
                <label htmlFor="staff-key" className="block text-xs font-bold uppercase tracking-wider mb-1">
                  Staff Access Key
                </label>
                <input
                  id="staff-key"
                  type="password"
                  required
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter shared staff key..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-paper text-ink border-2 border-ink rounded-xl shadow-hard-sm focus:border-cobalt focus:ring-0 font-mono placeholder:text-ink/40"
                />
                <p className="mt-1 text-[11px] text-ink/60">
                  Shared campus key (default: <code>campus-staff-key-2026</code>)
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold border-2 border-ink rounded-xl bg-sun text-ink shadow-hard hover:-translate-y-0.5 btn-tactile cursor-pointer mt-2"
              >
                Enter Facilities Portal
              </button>
            </form>
          </div>
        </section>
      ) : (
        /* Authenticated Portal Content */
        <div className="space-y-10">
          {/* "N to fix" Queue */}
          <section aria-labelledby="queue-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 id="queue-heading" className="text-xl sm:text-2xl font-heading text-ink">
                  Needs Attention
                </h2>
                <span className="px-2.5 py-0.5 bg-coral text-white font-bold text-xs rounded-full border-2 border-ink shadow-hard-sm">
                  {unresolvedQueue.length} to fix
                </span>
              </div>
              <span className="text-xs font-semibold text-ink/70">
                Sorted oldest first
              </span>
            </div>

            {unresolvedQueue.length === 0 ? (
              <div className="bg-paper border-ink-3 shadow-hard rounded-2xl p-8 text-center max-w-lg mx-auto">
                <WaterDrop status="staff_confirmed_resolved" size="lg" className="mx-auto mb-3" />
                <h3 className="text-lg font-heading text-ink mb-1">All clear!</h3>
                <p className="text-xs sm:text-sm text-ink/80">
                  No open issue reports currently pending repair. Excellent work!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unresolvedQueue.map((rep) => {
                  const wp = waterPointsMap.get(rep.water_point_id);
                  return (
                    <div
                      key={rep.id}
                      className="bg-paper border-ink-3 shadow-hard rounded-2xl p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-coral/20 border border-coral text-coral font-bold text-[11px] rounded-md uppercase mb-1">
                              Reported unavailable
                            </span>
                            <h3 className="font-heading text-base sm:text-lg text-ink leading-snug">
                              {wp?.name || `Water Point #${rep.water_point_id}`}
                            </h3>
                            <p className="text-xs text-ink/70">
                              {wp?.building ? `${wp.building} • ` : ''}{wp?.location || 'Unknown location'}
                            </p>
                          </div>
                          <WaterDrop status="reported_unavailable" size="sm" />
                        </div>

                        {/* Issue description box */}
                        <div className="bg-coral/10 border-2 border-coral/30 rounded-xl p-3 my-3 text-xs">
                          <span className="font-bold text-coral block mb-0.5">Problem:</span>
                          <p className="italic text-ink">&ldquo;{rep.description}&rdquo;</p>
                          <div className="mt-2 flex items-center gap-1 text-[11px] text-ink/60">
                            <Clock className="w-3 h-3" />
                            <span>Reported {formatRelativeTime(rep.reported_at)} ({formatDateTime(rep.reported_at)})</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReport(rep)}
                          className="w-full py-2 px-3 text-xs sm:text-sm font-bold bg-mint text-ink border-2 border-ink rounded-xl shadow-hard-sm hover:-translate-y-0.5 btn-tactile cursor-pointer inline-flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Repair &amp; Resolve</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Completed Repairs Log */}
          <section aria-labelledby="log-heading" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <h2 id="log-heading" className="text-xl sm:text-2xl font-heading text-ink">
                Completed Repairs Log
              </h2>
              <span className="px-2.5 py-0.5 bg-mint text-ink font-bold text-xs rounded-full border-2 border-ink shadow-hard-sm">
                {completedLog.length} resolved
              </span>
            </div>

            {completedLog.length === 0 ? (
              <p className="text-xs text-ink/60">No completed repairs logged yet.</p>
            ) : (
              <div className="bg-paper border-ink-3 shadow-hard rounded-2xl overflow-hidden">
                <div className="divide-y-2 divide-ink/10">
                  {completedLog.map((rep) => {
                    const wp = waterPointsMap.get(rep.water_point_id);
                    return (
                      <div
                        key={rep.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm hover:bg-sky/20 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink text-sm sm:text-base">
                              {wp?.name || `Point #${rep.water_point_id}`}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-mint/30 border border-mint text-ink text-[11px] font-bold rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-mint" />
                              Resolved
                            </span>
                          </div>
                          <p className="text-xs text-ink/70">
                            {wp?.location} {wp?.building && `(${wp.building})`}
                          </p>
                          <p className="text-xs italic text-ink/80">
                            Original issue: &ldquo;{rep.description}&rdquo;
                          </p>
                          {rep.resolution_notes && (
                            <div className="mt-2 text-xs bg-paper border border-ink/30 rounded-lg p-2.5 font-medium text-ink">
                              <span className="font-bold text-cobalt">Resolution Notes: </span>
                              {rep.resolution_notes}
                            </div>
                          )}
                        </div>

                        <div className="sm:text-right shrink-0 space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-ink/10">
                          <div className="font-bold text-ink">
                            Fixed by {rep.resolved_by || 'Staff'}
                          </div>
                          <div className="text-[11px] text-ink/60">
                            {formatDateTime(rep.resolved_at)} ({formatRelativeTime(rep.resolved_at)})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

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
