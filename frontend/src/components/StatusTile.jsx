import { Droplets, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * Clean Campus Overview Metric Card matching the Figma reference:
 * - White card with subtle border and understated shadow
 * - Clean icon badge with color-coded status indicator
 * - Prominent numerical metric in navy
 * - Muted descriptive label and supporting description
 * - Clickable to filter directory
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
  // Determine icon and color tokens based on status type
  let iconComponent = <Droplets className="w-5 h-5 text-[#102454]" />;
  let iconBg = 'bg-[#EDF2F9]';
  let defaultDesc = 'Across campus facilities';

  if (type === 'reported' || label.toLowerCase().includes('unavailable')) {
    iconComponent = <AlertTriangle className="w-5 h-5 text-[#D94B4B]" />;
    iconBg = 'bg-[#FDF2F2]';
    defaultDesc = 'Issues reported by students';
  } else if (type === 'resolved' || label.toLowerCase().includes('resolved')) {
    iconComponent = <CheckCircle2 className="w-5 h-5 text-[#2F8A57]" />;
    iconBg = 'bg-[#EBF6EE]';
    defaultDesc = 'Repaired & verified by staff';
  } else if (type === 'none' || label.toLowerCase().includes('no recent')) {
    iconComponent = <HelpCircle className="w-5 h-5 text-[#D58A00]" />;
    iconBg = 'bg-[#FEF7EA]';
    defaultDesc = 'Awaiting recent reports';
  }

  const descText = description || defaultDesc;

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-pressed={active}
      className={`group relative text-left w-full bg-white rounded-xl p-5 border transition-all duration-200 cursor-pointer ${
        active
          ? 'border-[#102454] ring-2 ring-[#102454]/15 shadow-sm'
          : 'border-[#DFE6F0] hover:border-[#CBD5E1] shadow-xs hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
          {iconComponent}
        </div>
        {active && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#102454] text-white">
            Active Filter
          </span>
        )}
      </div>

      <div className="space-y-1">
        <span className="block text-xs font-semibold text-[#71809B] uppercase tracking-wider">
          {label}
        </span>
        <div className="text-3xl font-extrabold text-[#102454] font-heading tracking-tight leading-none">
          {count}
        </div>
        <p className="text-xs text-[#71809B] leading-relaxed pt-1">
          {descText}
        </p>
      </div>
    </button>
  );
}

export default StatusTile;
