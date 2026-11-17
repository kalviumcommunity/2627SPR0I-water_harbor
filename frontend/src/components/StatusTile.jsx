/**
 * Interactive Status Filter Tile.
 * Shows status category name, live count in Bagel Fat One, and custom badge.
 */
export function StatusTile({ label, count, colorClass, active, onClick, id }) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex-1 min-w-[140px] sm:min-w-[160px] p-3 sm:p-4 text-left border-ink-3 rounded-2xl cursor-pointer transition-all ${
        active
          ? 'translate-x-1 translate-y-1 shadow-hard-sm ring-3 ring-cobalt'
          : 'shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5'
      } ${colorClass}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-ink/80 truncate">
          {label}
        </span>
        {active && (
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-ink shrink-0 animate-pulse" />
        )}
      </div>
      <div className="mt-2 text-2xl sm:text-3xl font-heading text-ink font-normal leading-none">
        {count}
      </div>
    </button>
  );
}

export default StatusTile;
