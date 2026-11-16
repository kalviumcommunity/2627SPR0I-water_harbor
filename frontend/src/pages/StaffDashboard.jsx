import { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Lock,
  LogOut,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../context/useApp';
import StatusBadge from '../components/StatusBadge';
import ResolveModal from '../components/ResolveModal';
import { formatTimeAgo } from '../utils/formatTime';

export default function StaffDashboard() {
  const {
    waterPoints,
    isStaffLoggedIn,
    loginStaff,
    logoutStaff,
    syncWithBackend,
  } = useApp();

  const [activeTab, setActiveTab] = useState('unresolved'); // 'unresolved' | 'resolved'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeResolvePoint, setActiveResolvePoint] = useState(null);

  // Staff login form state
  const [loginEmail, setLoginEmail] = useState('facilities.staff@campus.edu');
  const [loginPassword, setLoginPassword] = useState('staffpass2026');

  // Unresolved water points
  const unresolvedPoints = waterPoints.filter(
    (wp) => wp.status === 'reported_unavailable'
  );

  // Resolved water points
  const resolvedPoints = waterPoints.filter(
    (wp) => wp.status === 'staff_confirmed_resolved'
  );

  const currentList = activeTab === 'unresolved' ? unresolvedPoints : resolvedPoints;

  const filteredList = currentList.filter((wp) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      wp.name.toLowerCase().includes(q) ||
      wp.location.toLowerCase().includes(q) ||
      (wp.building || '').toLowerCase().includes(q)
    );
  });

  const handleStaffLogin = (e) => {
    e.preventDefault();
    loginStaff();
  };

  // If not logged in, show clean Staff Authentication Gate
  if (!isStaffLoggedIn) {
    return (
      <div className="py-12 px-4 max-w-md mx-auto space-y-6">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-md p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">
              Facilities Staff Portal
            </h1>
            <p className="text-xs text-slate-500">
              Authorized staff login to review and confirm water dispenser resolutions
            </p>
          </div>

          <form onSubmit={handleStaffLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff Email / ID
              </label>
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              Sign In to Facilities Dashboard
            </button>
          </form>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Students do not require an account to browse or report issues. Only facilities staff who resolve physical dispensers sign in here.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Staff Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/20">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Facilities Staff Dashboard
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Authorized Staff
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Campus CHR Facilities Team • Investigate & Confirm Issue Resolutions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={syncWithBackend}
            className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer"
          >
            Sync Database
          </button>
          <button
            type="button"
            onClick={logoutStaff}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented control tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('unresolved')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'unresolved'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unresolved Queue ({unresolvedPoints.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resolution History ({resolvedPoints.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter list..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* List content */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">
              {activeTab === 'unresolved'
                ? 'No Pending Issues!'
                : 'No Resolved Records Found'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'unresolved'
                ? 'All reported dispensers have been investigated and resolved.'
                : 'No historical resolved records match current criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredList.map((wp) => (
              <div
                key={wp.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100">
                      {wp.building || 'Campus'}
                    </span>
                    <StatusBadge status={wp.status} size="sm" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{wp.name}</h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{wp.location}</span>
                  </div>

                  {/* Active Report student details */}
                  {wp.active_report && (
                    <div className="mt-2 text-xs bg-rose-50/70 p-3 rounded-xl border border-rose-200/80 text-rose-950">
                      <div className="font-semibold text-rose-800 flex items-center gap-1 mb-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Reported Problem:</span>
                      </div>
                      <p className="text-slate-700">"{wp.active_report.description}"</p>
                      <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          Reported: {new Date(wp.active_report.reported_at).toLocaleString()} (
                          {formatTimeAgo(wp.active_report.reported_at)})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Resolved info */}
                  {wp.resolved_info && (
                    <div className="mt-2 text-xs bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 text-emerald-950">
                      <div className="font-semibold text-emerald-800 flex items-center gap-1 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolution Details:</span>
                      </div>
                      <p className="text-slate-700">
                        "{wp.resolved_info.notes || 'Verified dispenser working and restored flow.'}"
                      </p>
                      <div className="mt-1 text-[11px] text-slate-500">
                        Confirmed by: <strong>{wp.resolved_info.resolved_by}</strong> on{' '}
                        {new Date(wp.resolved_info.resolved_at).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Staff Actions */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                  {wp.status === 'reported_unavailable' && (
                    <button
                      type="button"
                      onClick={() => setActiveResolvePoint(wp)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Confirm Resolution</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeResolvePoint && (
        <ResolveModal
          waterPoint={activeResolvePoint}
          onClose={() => setActiveResolvePoint(null)}
        />
      )}
    </div>
  );
}
