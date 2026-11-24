import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RotateCcw, X, ArrowDown, Wrench, Building2, Droplets } from 'lucide-react';
import { useApp } from '../context/useApp';
import WaterPointCard from '../components/WaterPointCard';
import StatusTile from '../components/StatusTile';
import BuildingCard from '../components/BuildingCard';

/**
 * DirectoryPage ("/")
 * Campus water point status directory redesigned according to the Figma specification:
 * 1. Global Navigation (in App.jsx)
 * 2. Dark Navy Hero Section
 * 3. Campus Overview / Statistics Summary Cards
 * 4. Campus Building Cards
 * 5. Water Point Discovery & Search/Filter Controls
 * 6. Responsive Water Points Grid
 * 7. Supporting Issue-Reporting CTA Section
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

  // Extract unique buildings and compute per-building statistics
  const buildingStats = useMemo(() => {
    const map = new Map();
    waterPoints.forEach((wp) => {
      const bldg = wp.building || 'General Campus';
      if (!map.has(bldg)) {
        map.set(bldg, {
          name: bldg,
          total: 0,
          available: 0,
          reported: 0,
          none: 0,
        });
      }
      const data = map.get(bldg);
      data.total += 1;
      if (activeReportsMap.has(wp.id)) {
        data.reported += 1;
      } else if (resolvedReportsMap.has(wp.id)) {
        data.available += 1;
      } else {
        data.none += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [waterPoints, activeReportsMap, resolvedReportsMap]);

  const buildingNames = useMemo(() => {
    return buildingStats.map((b) => b.name);
  }, [buildingStats]);

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

  const handleSelectBuildingCard = (bldgName) => {
    if (selectedBuilding === bldgName) {
      setSelectedBuilding('ALL');
    } else {
      setSelectedBuilding(bldgName);
      scrollToDiscovery();
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ── 1. Dark Navy Hero Section ───────────────────────────────────── */}
      <section className="relative wh-hero-gradient text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-[#0B1736]">
        <div className="max-w-7xl mx-auto text-center space-y-5">
          {/* Small uppercase introductory label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D6A63C]">
            <Droplets className="w-3.5 h-3.5" />
            <span>Campus Water Point Management</span>
          </div>

          {/* Large white heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-heading text-white max-w-4xl mx-auto leading-tight sm:leading-none tracking-tight">
            Thirsty? Check before you trek.
          </h1>

          {/* Short supporting description */}
          <p className="text-sm sm:text-base md:text-lg text-[#CBD5E1] max-w-2xl mx-auto font-normal leading-relaxed">
            Real status updates reported by campus students and confirmed by facilities operations.
            Find working hydration stations before walking across campus.
          </p>

          {/* Hero Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToDiscovery}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#D6A63C] hover:bg-[#C2952E] text-[#102454] font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Find a Water Point</span>
              <ArrowDown className="w-4 h-4" />
            </button>

            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-colors"
            >
              <Wrench className="w-4 h-4 text-[#D6A63C]" />
              <span>Report an Issue</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ── 2. Campus Overview / Statistics Section ───────────────────── */}
        <section aria-label="Campus Overview Statistics">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-bold font-heading text-[#102454]">
                Campus Overview
              </h2>
              <p className="text-xs sm:text-sm text-[#71809B]">
                Live summary of monitored hydration points across campus
              </p>
            </div>
            <div className="text-xs text-[#71809B] font-medium">
              Click any metric card to filter the directory
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatusTile
              id="filter-tile-all"
              label="Total Water Points"
              count={stats.total}
              type="all"
              description="Monitored across all buildings"
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <StatusTile
              id="filter-tile-resolved"
              label="Staff-Confirmed Resolved"
              count={stats.staffConfirmedResolved}
              type="resolved"
              description="Inspected and verified functional"
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
              description="No active reports in cycle"
              active={activeFilter === 'none'}
              onClick={() => setActiveFilter('none')}
            />
          </div>
        </section>

        {/* ── 3. Campus Building Cards Section ───────────────────────────── */}
        {buildingStats.length > 0 && (
          <section aria-label="Campus Buildings Overview">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-[#102454]">
                  Campus Buildings
                </h2>
                <p className="text-xs sm:text-sm text-[#71809B]">
                  Dispenser availability and health organized by facility
                </p>
              </div>

              {selectedBuilding !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedBuilding('ALL')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102454] hover:underline cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear building filter</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {buildingStats.map((b) => (
                <BuildingCard
                  key={b.name}
                  buildingName={b.name}
                  totalPoints={b.total}
                  availableCount={b.available}
                  reportedCount={b.reported}
                  noneCount={b.none}
                  isSelected={selectedBuilding === b.name}
                  onSelect={() => handleSelectBuildingCard(b.name)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── 4. Water Point Discovery & Filter Controls ────────────────── */}
        <section id="discovery-section" aria-label="Water Points Discovery" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold font-heading text-[#102454]">
                Water Points Directory
              </h2>
              <p className="text-xs sm:text-sm text-[#71809B]">
                Search individual stations, filter by status, and review recent maintenance
              </p>
            </div>

            {/* Quick Status Pill Tabs */}
            <div className="flex items-center flex-wrap gap-1.5 bg-white p-1 rounded-xl border border-[#DFE6F0] shadow-xs">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#102454] text-white shadow-xs'
                    : 'text-[#71809B] hover:text-[#102454]'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('reported')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilter === 'reported'
                    ? 'bg-[#D94B4B] text-white shadow-xs'
                    : 'text-[#71809B] hover:text-[#D94B4B]'
                }`}
              >
                Reported ({stats.reportedUnavailable})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilter === 'resolved'
                    ? 'bg-[#2F8A57] text-white shadow-xs'
                    : 'text-[#71809B] hover:text-[#2F8A57]'
                }`}
              >
                Resolved ({stats.staffConfirmedResolved})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('none')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFilter === 'none'
                    ? 'bg-[#71809B] text-white shadow-xs'
                    : 'text-[#71809B] hover:text-[#102454]'
                }`}
              >
                No Report ({stats.noRecentReport})
              </button>
            </div>
          </div>

          {/* Search Bar + Building Dropdown + Refresh */}
          <div className="bg-white rounded-xl border border-[#DFE6F0] shadow-xs p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by water point name, location, or floor..."
                aria-label="Search water points"
                className="w-full pl-10 pr-9 py-2.5 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs sm:text-sm focus:bg-white focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#94A3B8] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94A3B8] hover:text-[#102454] hover:bg-[#F1F5F9] cursor-pointer"
                >
                  <X className="w-4 h-4" />
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
                  <span className="hidden lg:inline-flex items-center gap-1 mr-2 text-xs font-semibold text-[#71809B]">
                    <Building2 className="w-3.5 h-3.5" />
                    Facility:
                  </span>
                  <select
                    id="building-select"
                    value={selectedBuilding}
                    onChange={(e) => setSelectedBuilding(e.target.value)}
                    className="w-full sm:w-auto py-2.5 px-3 bg-[#F8FAFC] text-[#102454] border border-[#DFE6F0] rounded-lg text-xs sm:text-sm font-semibold focus:bg-white focus:border-[#102454] focus:ring-1 focus:ring-[#102454] cursor-pointer"
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

            {/* Refresh Data Button */}
            <button
              type="button"
              onClick={refreshData}
              title="Refresh live status from API"
              aria-label="Refresh status data"
              className="p-2.5 bg-[#F8FAFC] hover:bg-[#EDF2F9] border border-[#DFE6F0] rounded-lg text-[#102454] transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Showing Count Summary & Reset Action */}
          {!loading && (
            <div className="flex items-center justify-between text-xs font-medium text-[#71809B] px-1">
              <span>
                Showing <strong className="text-[#102454] font-semibold">{filteredWaterPoints.length}</strong> of{' '}
                {waterPoints.length} water stations
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
                  <X className="w-3.5 h-3.5" />
                  <span>Reset all filters</span>
                </button>
              )}
            </div>
          )}

          {/* ── 5. Responsive Water Points Grid ─────────────────────────── */}
          {loading ? (
            /* Loading Skeleton Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#DFE6F0] rounded-xl p-6 shadow-xs animate-pulse space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-20 h-5 bg-[#F1F5F9] rounded-md" />
                    <div className="w-24 h-5 bg-[#F1F5F9] rounded-full" />
                  </div>
                  <div className="w-3/4 h-6 bg-[#F1F5F9] rounded-md" />
                  <div className="w-1/2 h-4 bg-[#F1F5F9] rounded-md" />
                  <div className="w-full h-12 bg-[#F1F5F9] rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredWaterPoints.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-white border border-[#DFE6F0] rounded-xl shadow-xs max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F3F6FC] border border-[#DFE6F0] flex items-center justify-center mx-auto text-[#71809B]">
                <Filter className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-heading text-[#102454]">
                No matching water points found
              </h3>
              <p className="text-xs sm:text-sm text-[#71809B] max-w-xs mx-auto">
                No dispensers match your current search query or active filter criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSelectedBuilding('ALL');
                  setSearchQuery('');
                }}
                className="mt-2 px-4 py-2 bg-[#102454] hover:bg-[#183375] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Water Point Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* ── 6. Supporting Information / Report Issue CTA ───────────────── */}
        <section aria-label="Issue Reporting Callout">
          <div className="bg-white rounded-2xl border border-[#DFE6F0] shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EDF2F9] border border-[#DFE6F0] flex items-center justify-center text-[#102454] shrink-0">
                <Wrench className="w-6 h-6 text-[#102454]" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading text-[#102454]">
                  Notice an issue with a campus water dispenser?
                </h3>
                <p className="text-xs sm:text-sm text-[#71809B] max-w-xl mt-1 leading-relaxed">
                  Help fellow students! Submit an anonymous report when a station is warm, leaking, low on pressure, or empty. Facilities operations prioritize repairs based on verified student notices.
                </p>
              </div>
            </div>

            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#102454] hover:bg-[#183375] text-white font-bold text-sm shadow-xs transition-colors shrink-0"
            >
              <Wrench className="w-4 h-4 text-[#D6A63C]" />
              <span>Submit Issue Report</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DirectoryPage;
