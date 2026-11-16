/**
 * Sticker-style Issue Chip.
 * Tactile sticker chips for common water point problems.
 */
export function Chip({ label, selected, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full border-ink-3 transition-all cursor-pointer ${
        selected
          ? 'bg-sun text-ink shadow-hard-sm translate-x-0.5 translate-y-0.5 ring-2 ring-ink'
          : 'bg-paper text-ink shadow-hard-sm hover:bg-sky/60 hover:-translate-x-0.5 hover:-translate-y-0.5'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="w-2 h-2 rounded-full border border-ink bg-current shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export default Chip;
