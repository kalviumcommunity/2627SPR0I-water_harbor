import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, Wrench } from 'lucide-react';
import WaterDrop from './WaterDrop';
import { useApp } from '../context/useApp';

/**
 * Sticky Pill Navbar with hand-made aesthetic, 3px ink borders,
 * tactile buttons, and honest offline/fallback banner.
 */
export function Navbar() {
  const location = useLocation();
  const { isFallback } = useApp();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-6 mb-6">
      {/* Fallback Banner if API unreachable */}
      {isFallback && (
        <div
          role="alert"
          className="max-w-5xl mx-auto mb-3 px-4 py-2 bg-sun border-ink-3 rounded-xl shadow-hard-sm flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-ink"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-coral" />
            <span>Showing sample data. The live service is unreachable.</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider bg-ink text-sun px-2 py-0.5 rounded-md font-mono">
            Offline Mode
          </span>
        </div>
      )}

      {/* Main Pill Navbar */}
      <nav
        aria-label="Main Navigation"
        className="max-w-5xl mx-auto bg-paper border-ink-3 shadow-hard rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4"
      >
        {/* Brand Link */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group hover:-translate-y-0.5 transition-transform"
        >
          <WaterDrop status="staff_confirmed_resolved" size="sm" />
          <div className="flex flex-col">
            <span className="font-heading text-lg sm:text-xl text-ink leading-tight">
              WaterPoint
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-cobalt tracking-tight">
              Campus Hydration
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full border-2 border-ink transition-all ${
              isActive('/')
                ? 'bg-sun text-ink shadow-hard-sm'
                : 'bg-paper text-ink hover:bg-sky/60'
            }`}
          >
            Board
          </Link>

          <Link
            to="/report"
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full border-2 border-ink transition-all ${
              isActive('/report')
                ? 'bg-coral text-white shadow-hard-sm'
                : 'bg-paper text-ink hover:bg-coral/20'
            }`}
          >
            Report Issue
          </Link>

          <Link
            to="/staff"
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-full border-2 border-ink transition-all inline-flex items-center gap-1.5 ${
              isActive('/staff')
                ? 'bg-mint text-ink shadow-hard-sm'
                : 'bg-paper text-ink hover:bg-mint/30'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Staff</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
