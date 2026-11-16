import WaterDrop from './WaterDrop';

/**
 * Hand-made Footer reinforcing human-reported product truth.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t-3 border-ink bg-paper py-8 px-4 text-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <WaterDrop status="no_recent_report" size="sm" />
          <span className="font-heading text-ink text-base">
            Campus WaterPoint Board
          </span>
        </div>
        <p className="text-xs sm:text-sm text-ink/80 max-w-lg leading-relaxed">
          Statuses are human-reported by fellow students and confirmed by facilities staff.
          We never guess or show real-time sensor claims.
        </p>
        <p className="text-[11px] text-ink/60 font-mono mt-1">
          Designed with tactile poster aesthetics &bull; React &bull; Tailwind CSS &bull; FastAPI
        </p>
      </div>
    </footer>
  );
}

export default Footer;
