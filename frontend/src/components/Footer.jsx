import { Link } from 'react-router-dom';
import { Droplet } from 'lucide-react';

/**
 * Global Minimal Footer matching the Figma reference:
 * - Brand identity & campus hydration motto
 * - Navigation links
 * - Subtle divider & human-reported status disclaimer
 */
export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#DFE6F0] bg-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#102454] flex items-center justify-center text-white">
            <Droplet className="w-4 h-4 text-[#D6A63C] fill-[#D6A63C]/30" />
          </div>
          <div>
            <span className="font-heading text-sm font-bold text-[#102454] block leading-tight">
              Water Harbour
            </span>
            <span className="text-xs text-[#71809B]">
              University Campus Hydration Management
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#71809B]">
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
        <div className="text-center md:text-right">
          <p className="text-xs text-[#71809B] max-w-sm">
            Status updates are human-reported by campus students and confirmed by facilities operations.
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            &copy; {new Date().getFullYear()} Water Harbour &bull; All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
