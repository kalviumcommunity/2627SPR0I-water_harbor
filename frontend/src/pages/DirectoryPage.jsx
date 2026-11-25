import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RotateCcw, X, ArrowDown, Wrench, Building2, Droplets, AlertCircle } from 'lucide-react';
import { useApp } from '../context/useApp';
import WaterPointCard from '../components/WaterPointCard';
import StatusTile from '../components/StatusTile';

/**
 * Premium DirectoryPage ("/")
 * Designed with SaaS-grade restraint, clear visual hierarchy, and immediate interactivity:
 * 1. Dark Navy Hero Section (compact & purposeful)
 * 2. Campus Overview Metrics (clean tabular status tiles)
 * 3. Water Points Directory (segmented filters, search toolbar, scannable cards)
 * 4. Supporting Issue-Reporting CTA Section
 */
export function DirectoryPage() {
  const {
    waterPoints,
    activeReportsMap,
    resolvedReportsMap,
    stats,
    loading,
    isRefreshing,
    error,
    refreshData,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reported' | 'resolved' | 'none'
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique building names for the directory filter dropdown
  const buildingNames = useMemo(() => {
    const set = new Set();
    waterPoints.forEach((wp) => {
      if (wp.building) set.add(wp.building);
    });
    return Array.from(set).sort();
  }, [waterPoints]);

  // Filtered water points
  const filteredWaterPoints = useMemo(() => {
    return waterPoints.filter((wp) => {
      const hasActive = activeReportsMap.has(wp.id);
      const hasResolved = resolvedReportsMap.has(wp.id);

      // Status filter
      if (activeFilter === 'reported' && !hasActive) return false;
      if (activeFilter === 'resolved' && (hasActive || !hasResolved)) return false;
      if (activeFilter === 'none' && (hasActive || hasResolved)) return false;

      // Building filter
      if (selectedBuilding !== 'ALL') {
        const wpBldg = wp.building || 'General Campus';
        if (wpBldg !== selectedBuilding) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = wp.name.toLowerCase().includes(q);
        const matchLoc = wp.location.toLowerCase().includes(q);
        const matchBldg = (wp.building || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchBldg) return false;
      }

      return true;
    });
  }, [
    waterPoints,
    activeReportsMap,
    resolvedReportsMap,
    activeFilter,
    selectedBuilding,
    searchQuery,
  ]);

  const scrollToDiscovery = () => {
    document.getElementById('discovery-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-16">
      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <section className="relative wh-hero-gradient text-white pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#0B1736]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-[#D6A63C]">
            <Droplets className="w-3.5 h-3.5" />
            <span>Campus Water Point Management</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading text-white tracking-tight leading-tight">
            Thirsty? Check before you trek.
          </h1>

          <p className="text-sm sm:text-base text-[#CBD5E1] max-w-xl mx-auto font-normal leading-relaxed">
            Real status updates reported by students and confirmed by campus facilities. Find working hydration stations across campus.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToDiscovery}
              className="wh-btn-primary px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Find a Water Point</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-[#D6A63C]" />
              <span>Report an Issue</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* ── 2. Campus Overview / Statistics Section ───────────────────── */}
        <section aria-label="Campus Overview Statistics">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454]">
                Campus Overview
              </h2>
              <p className="text-xs text-[#5A6B87]">
                Live availability status across campus facilities
              </p>
            </div>
            <div className="text-[11px] text-[#8C9CB3] font-medium hidden sm:block">
              Click any metric to filter the directory
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatusTile
              id="filter-tile-all"
              label="Total Water Points"
              count={stats.total}
              type="all"
              description="Monitored across campus"
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <StatusTile
              id="filter-tile-resolved"
              label="Staff Resolved"
              count={stats.staffConfirmedResolved}
              type="resolved"
              description="Inspected and functional"
              active={activeFilter === 'resolved'}
              onClick={() => setActiveFilter('resolved')}
            />
            <StatusTile
              id="filter-tile-reported"
              label="Reported Unavailable"
              count={stats.reportedUnavailable}
              type="reported"
              description="Student reports pending repair"
              active={activeFilter === 'reported'}
              onClick={() => setActiveFilter('reported')}
            />
            <StatusTile
              id="filter-tile-none"
              label="No Recent Report"
              count={stats.noRecentReport}
              type="none"
              description="Standard campus routine"
              active={activeFilter === 'none'}
              onClick={() => setActiveFilter('none')}
            />
          </div>
        </section>

        {/* ── 3. Water Points Directory (Directly following Campus Overview) ── */}
        <section id="discovery-section" aria-label="Water Points Directory" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-heading text-[#102454]">
                  Water Points Directory
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EDF2F9] text-[#102454]">
                  {waterPoints.length}
                </span>
              </div>
              <p className="text-xs text-[#5A6B87]">
                Search individual stations, filter by status, and review recent maintenance
              </p>
            </div>

            {/* Segmented Status Pill Control */}
            <div className="inline-flex items-center p-1 bg-[#F1F5F9] border border-[#DFE6F0] rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-[#102454] font-semibold shadow-xs'
                    : 'text-[#5A6B87] hover:text-[#102454]'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('reported')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'reported'
                    ? 'bg-white text-[#D94B4B] font-semibold shadow-xs'
                    : 'text-[#5A6B87] hover:text-[#D94B4B]'
                }`}
              >
                Reported ({stats.reportedUnavailable})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('resolved')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'resolved'
                    ? 'bg-white text-[#2F8A57] font-semibold shadow-xs'
                    : 'text-[#5A6B87] hover:text-[#2F8A57]'
                }`}
              >
                Resolved ({stats.staffConfirmedResolved})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('none')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  activeFilter === 'none'
                    ? 'bg-white text-[#102454] font-semibold shadow-xs'
                    : 'text-[#5A6B87] hover:text-[#102454]'
                }`}
              >
                No Report ({stats.noRecentReport})
              </button>
            </div>
          </div>

          {/* Integrated Control Toolbar */}
          <div className="bg-white rounded-xl border border-[#DFE6F0] p-2.5 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9CB3] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by dispenser name, room, or building..."
                aria-label="Search water points"
                className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs sm:text-sm focus:bg-white focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#8C9CB3] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#8C9CB3] hover:text-[#102454] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Building Dropdown Filter */}
            {buildingNames.length > 0 && (
              <div className="relative shrink-0 flex items-center">
                <label htmlFor="building-select" className="sr-only">
                  Filter by building
                </label>
                <div className="flex items-center w-full sm:w-auto">
                  <span className="hidden lg:inline-flex items-center gap-1 mr-2 text-xs font-medium text-[#5A6B87]">
                    <Building2 className="w-3.5 h-3.5" />
                    Facility:
                  </span>
                  <select
                    id="building-select"
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    className="w-full sm:w-auto py-2 px-3 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs font-medium focus:bg-white focus:border-[#102454] focus:ring-1 focus:ring-[#102454] cursor-pointer"
                  >
                    <option value="ALL">All Buildings</option>
                    {buildingNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refreshData()}
              disabled={loading || isRefreshing}
              title="Refresh live status from API"
              aria-label="Refresh status data"
              className="p-2 bg-[#F8FAFC] hover:bg-[#EDF2F9] border border-[#DFE6F0] rounded-lg text-[#102454] transition-colors cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Showing Count Summary & Reset Link */}
          {!loading && (
            <div className="flex items-center justify-between text-xs text-[#5A6B87] px-1">
              <span>
                Showing <strong className="text-[#102454] font-semibold">{filteredWaterPoints.length}</strong> of{' '}
                {waterPoints.length} stations
                {selectedBuilding !== 'ALL' && ` in ${selectedBuilding}`}
              </span>

              {(activeFilter !== 'all' || selectedBuilding !== 'ALL' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSelectedBuilding('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#D94B4B] hover:underline cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          )}

          {/* Water Points Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-xs animate-pulse space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-16 h-4 bg-[#F1F5F9] rounded" />
                    <div className="w-20 h-4 bg-[#F1F5F9] rounded-full" />
                  </div>
                  <div className="w-3/4 h-5 bg-[#F1F5F9] rounded" />
                  <div className="w-1/2 h-3.5 bg-[#F1F5F9] rounded" />
                  <div className="w-full h-10 bg-[#F1F5F9] rounded-lg" />
                </div>
              ))}
            </div>
          ) : error && waterPoints.length === 0 ? (
            <div
              role="alert"
              className="text-center py-14 px-4 bg-white border border-[#F8C9C9] rounded-xl shadow-xs max-w-md mx-auto space-y-2.5"
            >
              <div className="w-10 h-10 rounded-full bg-[#FDF2F2] border border-[#F8C9C9] flex items-center justify-center mx-auto text-[#D94B4B]">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-heading text-[#102454]">
                Backend Unavailable
              </h3>
              <p className="text-xs text-[#5A6B87]">
                {error}
              </p>
              <button
                type="button"
                onClick={() => refreshData()}
                className="mt-1 px-3.5 py-1.5 bg-[#102454] hover:bg-[#162F6B] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : waterPoints.length === 0 ? (
            <div className="text-center py-14 px-4 bg-white border border-[#DFE6F0] rounded-xl shadow-xs max-w-sm mx-auto space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#F3F6FC] border border-[#DFE6F0] flex items-center justify-center mx-auto text-[#5A6B87]">
                <Droplets className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-heading text-[#102454]">
                No water points registered
              </h3>
              <p className="text-xs text-[#5A6B87]">
                No campus water points have been added to the database yet.
              </p>
            </div>
          ) : filteredWaterPoints.length === 0 ? (
            <div className="text-center py-14 px-4 bg-white border border-[#DFE6F0] rounded-xl shadow-xs max-w-sm mx-auto space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#F3F6FC] border border-[#DFE6F0] flex items-center justify-center mx-auto text-[#5A6B87]">
                <Filter className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold font-heading text-[#102454]">
                No matching water points
              </h3>
              <p className="text-xs text-[#5A6B87]">
                No stations match your current search query or active filter settings.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedBuilding('ALL');
                  setSearchQuery('');
                }}
                className="mt-1 px-3.5 py-1.5 bg-[#102454] hover:bg-[#162F6B] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredWaterPoints.map((wp) => (
                <WaterPointCard
                  key={wp.id}
                  waterPoint={wp}
                  activeReport={activeReportsMap.get(wp.id)}
                  recentResolvedReport={resolvedReportsMap.get(wp.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 4. Supporting Information / Report Issue Callout ───────────── */}
        <section aria-label="Issue Reporting Callout">
          <div className="bg-white rounded-xl border border-[#DFE6F0] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-heading text-[#102454]">
                Notice an issue with a campus water dispenser?
              </h3>
              <p className="text-xs text-[#5A6B87] max-w-xl leading-relaxed">
                Submit an anonymous report when a station is warm, leaking, or empty. Facilities operations prioritize maintenance based on verified notices.
              </p>
            </div>

            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#102454] hover:bg-[#162F6B] text-white font-medium text-xs shadow-xs transition-colors shrink-0"
            >
              <Wrench className="w-3.5 h-3.5 text-[#D6A63C]" />
              <span>Submit Issue Report</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DirectoryPage;
