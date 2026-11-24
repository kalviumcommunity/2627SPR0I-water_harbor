import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';

/**
 * Restrained Minimal Footer:
 * - Brand emblem and product scope
 * - Clean navigation links
 * - Truth note regarding human-reported statuses
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#DFE6F0] bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#102454] flex items-center justify-center text-white">
            <Droplet className="w-3.5 h-3.5 text-[#D6A63C] fill-[#D6A63C]/30" />
          </div>
          <span className="font-heading font-semibold text-[#102454]">
            Water Harbour
          </span>
          <span className="text-[#8C9CB3]">&bull;</span>
          <span className="text-[#5A6B87]">
            Campus Hydration Management
          </span>
        </div>

        {/* Footer Navigation */}
        <nav aria-label="Footer Navigation" className="flex items-center gap-5 text-[#5A6B87]">
          <Link to="/" className="hover:text-[#102454] transition-colors">
            Water Points Directory
          </Link>
          <Link to="/report" className="hover:text-[#102454] transition-colors">
            Report an Issue
          </Link>
          <Link to="/staff" className="hover:text-[#102454] transition-colors">
            Facilities Portal
          </Link>
        </nav>

        {/* Product Truth Notice */}
        <div className="text-center md:text-right text-[11px] text-[#8C9CB3]">
          Human-reported by campus students &bull; Verified by facilities staff
        </div>
      </div>
    </footer>
  );
}

export default Footer;
