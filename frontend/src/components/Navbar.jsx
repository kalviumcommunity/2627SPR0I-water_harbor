import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, AlertCircle, Wrench, User, LogOut, Menu, X } from 'lucide-react';
import { useApp } from '../context/useApp';

/**
 * Premium Global Navigation Bar
 * Refined SaaS-grade header with clean typography, understated borders,
 * restrained active indicators, and responsive mobile menu.
 */
export function Navbar() {
  const location = useLocation();
  const { error, loading, isRefreshing, refreshData, staffSession, logoutStaff } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive staff authentication from AppContext session
  const isStaffAuthenticated = Boolean(staffSession?.authenticated);
  const staffName = staffSession?.staff?.display_name || '';

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await logoutStaff();
    } catch {
      // Ignore network errors on logout
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DFE6F0]">
      {/* Backend Connection Error Banner */}
      {error && (
        <div className="bg-[#FDF2F2] border-b border-[#F8C9C9]">
          <div
            role="alert"
            className="px-4 sm:px-6 lg:px-8 py-2 text-xs font-medium text-[#B91C1C] flex items-center justify-between gap-3 max-w-7xl mx-auto"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D94B4B]" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => refreshData({ silent: true, notifyOnError: true })}
              disabled={loading || isRefreshing}
              className="text-[11px] font-semibold bg-white text-[#B91C1C] hover:bg-[#FDF2F2] border border-[#F8C9C9] px-2.5 py-0.5 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {loading || isRefreshing ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Logo & Title */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="Water Harbour Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#102454] flex items-center justify-center text-[#D6A63C] shadow-xs group-hover:bg-[#162F6B] transition-colors">
              <Droplet className="w-4 h-4 fill-[#D6A63C]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-[#102454] text-base leading-tight tracking-tight group-hover:text-[#162F6B] transition-colors">
                Water Harbour
              </span>
              <span className="text-[10px] text-[#5A6B87] font-medium tracking-wide">
                Campus WaterPoint Desk
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/')
                  ? 'bg-[#F1F5F9] text-[#102454] font-semibold'
                  : 'text-[#5A6B87] hover:text-[#102454] hover:bg-[#F8FAFC]'
              }`}
            >
              Water Points
            </Link>

            <Link
              to="/report"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/report')
                  ? 'bg-[#102454] text-white font-semibold'
                  : 'text-[#102454] bg-[#EDF2F9] hover:bg-[#E2E8F0]'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#D94B4B]" />
              <span>Report Issue</span>
            </Link>

            <div className="h-4 w-px bg-[#DFE6F0] mx-1" aria-hidden="true" />

            <Link
              to="/staff"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive('/staff')
                  ? 'bg-[#102454] text-white font-semibold'
                  : 'text-[#5A6B87] hover:text-[#102454] hover:bg-[#F8FAFC]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Staff Desk</span>
            </Link>

            {/* Active Staff Session Indicator & Sign Out */}
            {isStaffAuthenticated && (
              <div className="flex items-center gap-2 pl-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EBF6EE] text-[#2F8A57] border border-[#D2EDD9]">
                  <User className="w-3 h-3 text-[#2F8A57]" />
                  <span>{staffName || 'Staff'}</span>
                </span>

                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of staff session"
                  className="p-1.5 rounded-lg text-[#5A6B87] hover:text-[#D94B4B] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#5A6B87] hover:text-[#102454] hover:bg-[#F8FAFC] transition-colors focus:outline-hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DFE6F0] bg-white px-4 pt-3 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/')
                ? 'bg-[#F1F5F9] text-[#102454] font-semibold'
                : 'text-[#5A6B87] hover:bg-[#F8FAFC]'
            }`}
          >
            Water Points Directory
          </Link>

          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/report')
                ? 'bg-[#102454] text-white font-semibold'
                : 'text-[#102454] bg-[#EDF2F9]'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-[#D94B4B]" />
            <span>Report Unavailable Point</span>
          </Link>

          <Link
            to="/staff"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/staff')
                ? 'bg-[#102454] text-white font-semibold'
                : 'text-[#5A6B87] hover:bg-[#F8FAFC]'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Facilities Staff Desk</span>
          </Link>

          {isStaffAuthenticated && (
            <div className="pt-2 border-t border-[#DFE6F0] flex items-center justify-between px-3 text-xs">
              <span className="text-[#5A6B87] font-medium">Signed in: {staffName}</span>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center gap-1 text-[#D94B4B] font-semibold hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
