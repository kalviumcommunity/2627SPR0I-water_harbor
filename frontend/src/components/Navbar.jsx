import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, AlertCircle, Wrench, User, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../context/useApp';

/**
 * Global Navigation Bar matching the Figma reference:
 * - Brand logo & name on the left
 * - Central navigation links
 * - Staff session or Staff Login on the right
 * - Clean white background with subtle border
 * - Responsive mobile drawer
 */
export function Navbar() {
  const location = useLocation();
  const { isFallback } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check active staff session from sessionStorage
  const staffName = sessionStorage.getItem('staff_name') || '';
  const isStaffAuthenticated = Boolean(staffName && sessionStorage.getItem('staff_access_key'));

  const isActive = (path) => location.pathname === path;

  const handleSignOut = () => {
    sessionStorage.removeItem('staff_name');
    sessionStorage.removeItem('staff_access_key');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DFE6F0] transition-colors">
      {/* Offline Mode Banner if API unreachable */}
      {isFallback && (
        <div
          role="alert"
          className="bg-[#FEF7EA] border-b border-[#FCE7C5] px-4 py-2 text-xs font-medium text-[#D58A00] flex items-center justify-between gap-3 max-w-7xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D58A00]" />
            <span>Operating in cached offline mode. Showing local campus data.</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-[#D58A00]/10 text-[#D58A00] px-2 py-0.5 rounded font-mono font-semibold">
            Offline Mode
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="Water Harbour Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#102454] to-[#1A367E] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 text-[#D6A63C] fill-[#D6A63C]/30" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold text-[#102454] tracking-tight leading-tight">
                Water Harbour
              </span>
              <span className="text-[11px] font-medium text-[#71809B] tracking-normal leading-tight">
                Campus Hydration Board
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/')
                  ? 'bg-[#EDF2F9] text-[#102454]'
                  : 'text-[#71809B] hover:text-[#102454] hover:bg-[#F3F6FC]'
              }`}
            >
              Water Points
            </Link>

            <Link
              to="/report"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/report')
                  ? 'bg-[#EDF2F9] text-[#102454]'
                  : 'text-[#71809B] hover:text-[#102454] hover:bg-[#F3F6FC]'
              }`}
            >
              Report an Issue
            </Link>

            <Link
              to="/staff"
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/staff')
                  ? 'bg-[#EDF2F9] text-[#102454]'
                  : 'text-[#71809B] hover:text-[#102454] hover:bg-[#F3F6FC]'
              }`}
            >
              Facilities Staff
            </Link>
          </nav>

          {/* Right Action: Staff Login / Session Badge */}
          <div className="hidden md:flex items-center gap-3">
            {isStaffAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-[#DFE6F0]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F6FC] border border-[#DFE6F0]">
                  <User className="w-4 h-4 text-[#102454]" />
                  <span className="text-xs font-semibold text-[#102454]">{staffName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of staff session"
                  className="p-1.5 rounded-lg text-[#71809B] hover:text-[#D94B4B] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/staff"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#102454] bg-white border border-[#DFE6F0] rounded-lg hover:bg-[#F3F6FC] hover:border-[#CBD5E1] transition-all shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5 text-[#71809B]" />
                <span>Staff Portal</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#71809B] hover:text-[#102454] hover:bg-[#F3F6FC] transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#DFE6F0] space-y-1 animate-in fade-in duration-150">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                isActive('/')
                  ? 'bg-[#EDF2F9] text-[#102454]'
                  : 'text-[#71809B] hover:bg-[#F3F6FC]'
              }`}
            >
              Water Points
            </Link>

            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                isActive('/report')
                  ? 'bg-[#EDF2F9] text-[#102454]'
                  : 'text-[#71809B] hover:bg-[#F3F6FC]'
              }`}
            >
              Report an Issue
            </Link>

            <Link
              to="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                isActive('/staff')
                  ? 'bg-[#EDF2F9] text-[#102454]'
                  : 'text-[#71809B] hover:bg-[#F3F6FC]'
              }`}
            >
              Facilities Staff
            </Link>

            {isStaffAuthenticated && (
              <div className="pt-2 border-t border-[#DFE6F0] flex items-center justify-between px-3 text-xs font-semibold text-[#102454]">
                <span>Logged in as: {staffName}</span>
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-[#D94B4B] hover:underline"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
