import { useState, useMemo } from 'react';
import { Search, Filter, AlertOctagon, CheckCircle2, HelpCircle, Layers, Droplets, RefreshCw } from 'lucide-react';
import { useApp } from '../context/useApp';
import WaterPointCard from '../components/WaterPointCard';
import ReportModal from '../components/ReportModal';
import ResolveModal from '../components/ResolveModal';

export default function DirectoryPage() {
  const { waterPoints, loading, syncWithBackend } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');

  const [activeReportModal, setActiveReportModal] = useState(null);
  const [activeResolveModal, setActiveResolveModal] = useState(null);

  // Compute metrics
  const metrics = useMemo(() => {
    let unavailable = 0;
    let resolved = 0;
    let unknown = 0;

    waterPoints.forEach((wp) => {
      if (wp.status === 'reported_unavailable') unavailable++;
      else if (wp.status === 'staff_confirmed_resolved') resolved++;
      else unknown++;
    });

    return {
      total: waterPoints.length,
      unavailable,
      resolved,
      unknown,
    };
  }, [waterPoints]);

  // Extract unique buildings
  const buildings = useMemo(() => {
    const set = new Set();
    waterPoints.forEach((wp) => {
      if (wp.building) set.add(wp.building);
    });
    return Array.from(set);
  }, [waterPoints]);

  // Filtered list
  const filteredPoints = useMemo(() => {
    return waterPoints.filter((wp) => {
      // Status filter
      if (statusFilter !== 'all' && wp.status !== statusFilter) {
        return false;
      }
      // Building filter
      if (buildingFilter !== 'all' && wp.building !== buildingFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = wp.name.toLowerCase().includes(query);
        const matchLoc = wp.location.toLowerCase().includes(query);
        const matchBuilding = (wp.building || '').toLowerCase().includes(query);
        if (!matchName && !matchLoc && !matchBuilding) return false;
      }
      return true;
    });
  }, [waterPoints, statusFilter, buildingFilter, searchTerm]);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Problem Statement Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-semibold">
            <Droplets className="w-3.5 h-3.5" />
            <span>Campus WaterPoint Board • Sprint 2627SPR0I</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Check Campus Water Point Availability Before You Walk
          </h1>
          <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed">
            Students carrying bottles visit multiple dispensers before finding one that works.
            View the latest community-reported status, report broken taps without an account, or see facilities staff confirmations.
          </p>
        </div>
      </div>

      {/* KPI Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Tracked Dispensers</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Reported Unavailable */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-rose-600">Reported Unavailable</div>
            <div className="text-2xl font-bold text-rose-700 mt-1">{metrics.unavailable}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Staff Confirmed Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-emerald-600">Staff-Confirmed Resolved</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.resolved}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Unknown / No Recent Report */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">No Recent Report</div>
            <div className="text-2xl font-bold text-slate-700 mt-1">{metrics.unknown}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by dispenser name, room, or building..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={syncWithBackend}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            title="Sync with backend database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Pills for Status Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>

          {[
            { id: 'all', label: 'All' },
            { id: 'reported_unavailable', label: 'Reported Unavailable' },
            { id: 'staff_confirmed_resolved', label: 'Staff-Confirmed Resolved' },
            { id: 'no_recent_report', label: 'No Recent Report / Unknown' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusFilter(pill.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}

          {/* Building Select dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Building:</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Water Points Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Water Points Directory ({filteredPoints.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click "Report Unavailable" to log broken dispensers
          </span>
        </div>

        {filteredPoints.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Water Points Match Your Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keyword or clearing the status/building filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setBuildingFilter('all');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPoints.map((wp) => (
              <WaterPointCard
                key={wp.id}
                waterPoint={wp}
                onOpenReport={(point) => setActiveReportModal(point)}
                onOpenResolve={(point) => setActiveResolveModal(point)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeReportModal && (
        <ReportModal
          waterPoint={activeReportModal}
          onClose={() => setActiveReportModal(null)}
        />
      )}

      {activeResolveModal && (
        <ResolveModal
          waterPoint={activeResolveModal}
          onClose={() => setActiveResolveModal(null)}
        />
      )}
    </div>
  );
}
