/**
 * Restrained Campus Overview Metric Card:
 * - Crisp white surface with 1px subtle border
 * - Status dot indicator (Green, Red, Amber, Navy)
 * - Tabular numerical figures
 * - Informative micro-copy without noisy decorative gradients
 */
export function StatusTile({
  label,
  count,
  type = 'all', // 'all' | 'reported' | 'resolved' | 'none'
  description,
  active,
  onClick,
  id,
}) {
  // Status indicator dot colors
  let dotColor = 'bg-[#102454]';
  let defaultDesc = 'Across all campus facilities';

  if (type === 'reported' || label.toLowerCase().includes('unavailable')) {
    dotColor = 'bg-[#D94B4B]';
    defaultDesc = 'Student reports awaiting repair';
  } else if (type === 'resolved' || label.toLowerCase().includes('resolved')) {
    dotColor = 'bg-[#2F8A57]';
    defaultDesc = 'Verified ready for use';
  } else if (type === 'none' || label.toLowerCase().includes('no recent')) {
    dotColor = 'bg-[#D58A00]';
    defaultDesc = 'Routine campus status active';
  }

  const descText = description || defaultDesc;

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-pressed={active}
      className={`group relative text-left w-full bg-white rounded-xl p-4 sm:p-5 border transition-all duration-150 cursor-pointer ${
        active
          ? 'border-[#102454] shadow-xs bg-[#FAFBFD]'
          : 'border-[#DFE6F0] hover:border-[#CBD5E1] shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
          <span className="text-[11px] font-semibold text-[#5A6B87] uppercase tracking-wider">
            {label}
          </span>
        </div>
        {active && (
          <span className="text-[10px] font-medium text-[#102454] bg-[#EDF2F9] px-2 py-0.5 rounded">
            Filtered
          </span>
        )}
      </div>

      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102454] tabular-nums font-heading">
        {count}
      </div>

      <p className="text-xs text-[#5A6B87] mt-1.5 leading-normal">
        {descText}
      </p>
    </button>
  );
}

export default StatusTile;
