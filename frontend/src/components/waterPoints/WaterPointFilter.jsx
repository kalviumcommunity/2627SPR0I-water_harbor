export function WaterPointFilter({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  totalCount,
  filteredCount,
}) {
  return (
    <div className="filter-bar">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by water point name, block, or floor..."
          className="search-input"
          aria-label="Search campus water points"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Showing {filteredCount} of {totalCount}
        </span>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="filter-select"
          aria-label="Filter by reported status"
        >
          <option value="all">All Statuses ({totalCount})</option>
          <option value="reported_unavailable">Reported Unavailable</option>
          <option value="staff_confirmed_resolved">Staff-Confirmed Resolved</option>
          <option value="unknown">No Recent Report / Unknown</option>
        </select>

        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="btn btn-secondary btn-sm"
          >
            Clear Search
          </button>
        )}
      </div>
    </div>
  );
}

export default WaterPointFilter;
