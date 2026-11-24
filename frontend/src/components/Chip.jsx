/**
 * Refined Issue Preset Pill:
 * - Clean tactile button with restrained 1px border
 * - Deep navy active fill with subtle gold accent
 * - Smooth transition without cartoonish bouncing
 */
export function Chip({ label, selected, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 cursor-pointer ${
        selected
          ? 'bg-[#102454] text-white border-[#102454] shadow-xs'
          : 'bg-white text-[#5A6B87] border-[#DFE6F0] hover:text-[#102454] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          selected ? 'bg-[#D6A63C]' : 'bg-[#CBD5E1]'
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

export default Chip;
