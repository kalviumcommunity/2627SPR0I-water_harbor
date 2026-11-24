/**
 * Clean Issue Selection Pill Chip matching the Figma reference:
 * - Clean subtle border and pill geometry
 * - Navy active fill with white text
 * - Subtle hover state
 */
export function Chip({ label, selected, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all cursor-pointer ${
        selected
          ? 'bg-[#102454] text-white border-[#102454] shadow-xs'
          : 'bg-white text-[#71809B] border-[#DFE6F0] hover:text-[#102454] hover:bg-[#F3F6FC] hover:border-[#CBD5E1]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          selected ? 'bg-[#D6A63C]' : 'bg-[#CBD5E1]'
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

export default Chip;
