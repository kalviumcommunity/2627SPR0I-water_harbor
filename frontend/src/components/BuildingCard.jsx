import { Building2, ChevronRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

/**
 * BuildingCard matching the Figma reference:
 * - Building name & icon
 * - Total water points in building
 * - Status counts (available, reported maintenance, pending)
 * - Interactive indicator to filter the list by building
 */
export function BuildingCard({
  buildingName,
  totalPoints,
  availableCount = 0,
  reportedCount = 0,
  noneCount = 0,
  isSelected,
  onSelect,
}) {
  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`group bg-white rounded-xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-[#102454] ring-2 ring-[#102454]/15 shadow-sm'
          : 'border-[#DFE6F0] hover:border-[#CBD5E1] shadow-xs hover:shadow-sm'
      }`}
    >
      <div>
        {/* Header: Icon + Name */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#F3F6FC] border border-[#DFE6F0] flex items-center justify-center text-[#102454] shrink-0 group-hover:bg-[#EDF2F9] transition-colors">
              <Building2 className="w-5 h-5 text-[#102454]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102454] font-heading leading-tight group-hover:text-[#1A367E] transition-colors">
                {buildingName}
              </h3>
              <span className="text-xs text-[#71809B] font-medium">
                {totalPoints} Water Point{totalPoints !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="text-[#94A3B8] group-hover:text-[#102454] transition-colors">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>

        {/* Status Distribution Pills */}
        <div className="grid grid-cols-3 gap-1.5 py-3 border-y border-[#F1F5F9] my-2 text-center">
          <div className="bg-[#EBF6EE] text-[#2F8A57] rounded-lg py-1 px-1.5">
            <span className="block text-xs font-bold leading-tight">{availableCount}</span>
            <span className="text-[10px] font-medium opacity-90">Resolved</span>
          </div>
          <div className="bg-[#FDF2F2] text-[#D94B4B] rounded-lg py-1 px-1.5">
            <span className="block text-xs font-bold leading-tight">{reportedCount}</span>
            <span className="text-[10px] font-medium opacity-90">Reported</span>
          </div>
          <div className="bg-[#F8FAFC] text-[#71809B] rounded-lg py-1 px-1.5 border border-[#E2E8F0]">
            <span className="block text-xs font-bold leading-tight">{noneCount}</span>
            <span className="text-[10px] font-medium opacity-90">Pending</span>
          </div>
        </div>
      </div>

      {/* Footer Indicator */}
      <div className="pt-2 flex items-center justify-between text-xs font-medium text-[#71809B]">
        <span>
          {reportedCount > 0 ? (
            <span className="text-[#D94B4B] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Needs Attention
            </span>
          ) : availableCount > 0 ? (
            <span className="text-[#2F8A57] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Points Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#71809B]">
              <Clock className="w-3.5 h-3.5" /> Status Normal
            </span>
          )}
        </span>
        <span className="text-xs font-semibold text-[#102454] group-hover:underline">
          {isSelected ? 'Selected' : 'Filter points →'}
        </span>
      </div>
    </div>
  );
}

export default BuildingCard;
