import { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, X } from 'lucide-react';
import { useApp } from '../context/useApp';
import WaterPointCard from '../components/WaterPointCard';
import StatusTile from '../components/StatusTile';
import WaterDrop from '../components/WaterDrop';

/**
 * DirectoryPage ("/")
 * Campus water point status directory with interactive filters,
 * tactile search, building selection, and responsive grid.
 */
export function DirectoryPage() {
  const {
    waterPoints,
    activeReportsMap,
    resolvedReportsMap,
    stats,
    loading,
    refreshData,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reported' | 'resolved' | 'none'
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique buildings for filter dropdown
  const buildings = useMemo(() => {
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
      if (selectedBuilding !== 'ALL' && wp.building !== selectedBuilding) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = wp.name.toLowerCase().includes(q);
        const matchLoc = wp.location.toLowerCase().includes(q);
        const matchBldg = wp.building?.toLowerCase().includes(q) || false;
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative text-center px-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sun/40 border-2 border-ink rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-hard-sm">
          <span>Campus Hydration Monitor</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-heading text-ink max-w-3xl mx-auto leading-tight sm:leading-none">
          Thirsty? Check before you trek.
        </h1>

        <p className="mt-4 text-sm sm:text-base text-ink/80 max-w-xl mx-auto leading-relaxed">
          Real status updates reported by campus students and verified by facilities staff.
          Never walk across campus to a broken tap again.
        </p>

        {/* Tactile Wave Divider */}
        <div className="w-full max-w-4xl mx-auto mt-6 overflow-hidden">
          <svg
            className="w-full h-8 text-cobalt stroke-ink"
            viewBox="0 0 1200 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 20 Q 150 0, 300 20 T 600 20 T 900 20 T 1200 20"
              stroke="#10132b"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        </div>
      </section>

      {/* Interactive Status Tiles */}
      <section aria-label="Status Filters" className="px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
          <StatusTile
            id="filter-tile-all"
            label="All Points"
            count={stats.total}
            colorClass="bg-sky/60"
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          <StatusTile
            id="filter-tile-reported"
            label="Reported unavailable"
            count={stats.reportedUnavailable}
            colorClass="bg-coral/20"
            active={activeFilter === 'reported'}
            onClick={() => setActiveFilter('reported')}
          />
          <StatusTile
            id="filter-tile-resolved"
            label="Staff-confirmed resolved"
            count={stats.staffConfirmedResolved}
            colorClass="bg-mint/30"
            active={activeFilter === 'resolved'}
            onClick={() => setActiveFilter('resolved')}
          />
          <StatusTile
            id="filter-tile-none"
            label="No recent report"
            count={stats.noRecentReport}
            colorClass="bg-lilac/30"
            active={activeFilter === 'none'}
            onClick={() => setActiveFilter('none')}
          />
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section aria-label="Filter Controls" className="px-4">
        <div className="max-w-5xl mx-auto bg-paper border-ink-3 shadow-hard rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or room..."
              aria-label="Search water points"
              className="w-full pl-10 pr-9 py-2.5 bg-paper text-ink border-2 border-ink rounded-xl text-xs sm:text-sm shadow-hard-sm focus:border-cobalt focus:ring-0 placeholder:text-ink/40 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-ink/60 hover:text-ink hover:bg-ink/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Building Select */}
          {buildings.length > 0 && (
            <div className="relative shrink-0">
              <label htmlFor="building-filter" className="sr-only">
                Filter by building
              </label>
              <div className="flex items-center">
                <span className="hidden sm:inline-block mr-2 text-xs font-bold uppercase tracking-wider text-ink/70">
                  <Filter className="w-3.5 h-3.5 inline mr-1" />
                  Building:
                </span>
                <select
                  id="building-filter"
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full sm:w-auto py-2.5 px-3 bg-paper text-ink border-2 border-ink rounded-xl text-xs sm:text-sm font-semibold shadow-hard-sm focus:border-cobalt focus:ring-0 cursor-pointer"
                >
                  <option value="ALL">All Buildings</option>
                  {buildings.map((bldg) => (
                    <option key={bldg} value={bldg}>
                      {bldg}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={refreshData}
            title="Refresh live status"
            aria-label="Refresh status data"
            className="p-2.5 bg-paper hover:bg-sun border-2 border-ink rounded-xl shadow-hard-sm btn-tactile cursor-pointer flex items-center justify-center shrink-0"
          >
            <RotateCcw className="w-4 h-4 text-ink" />
          </button>
        </div>
      </section>

      {/* Grid of Water Points */}
      <section aria-label="Water Points Directory" className="px-4">
        <div className="max-w-5xl mx-auto">
          {/* Active Filter & Count Summary */}
          {!loading && (
            <div className="flex items-center justify-between text-xs font-semibold text-ink/75 mb-4 px-1">
              <span>
                Showing <strong className="text-ink font-bold">{filteredWaterPoints.length}</strong> of{' '}
                {waterPoints.length} water points
              </span>
              {(activeFilter !== 'all' || selectedBuilding !== 'ALL' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('all');
                    setSelectedBuilding('ALL');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-coral hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          )}

          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-paper border-ink-3 rounded-2xl p-6 shadow-hard animate-pulse space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-14 bg-ink/10 rounded-full" />
                    <div className="w-24 h-6 bg-ink/10 rounded-full" />
                  </div>
                  <div className="w-3/4 h-6 bg-ink/10 rounded-md" />
                  <div className="w-1/2 h-4 bg-ink/10 rounded-md" />
                  <div className="w-full h-10 bg-ink/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredWaterPoints.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-paper border-ink-3 rounded-2xl shadow-hard max-w-md mx-auto">
              <WaterDrop status="no_recent_report" size="lg" className="mx-auto mb-4" />
              <h2 className="text-xl font-heading text-ink mb-2">No water points match</h2>
              <p className="text-xs sm:text-sm text-ink/70 mb-6">
                Try adjusting your search query, building filter, or status selection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedBuilding('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-sun text-ink font-bold text-xs sm:text-sm border-2 border-ink rounded-xl shadow-hard-sm btn-tactile cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Water Point Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWaterPoints.map((wp, idx) => (
                <WaterPointCard
                  key={wp.id}
                  waterPoint={wp}
                  activeReport={activeReportsMap.get(wp.id)}
                  recentResolvedReport={resolvedReportsMap.get(wp.id)}
                  index={idx}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DirectoryPage;
