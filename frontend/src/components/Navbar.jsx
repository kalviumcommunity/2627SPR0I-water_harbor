import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplets, AlertOctagon, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { backendOnline, isStaffLoggedIn, logoutStaff } = useApp();

  const navLinks = [
    { name: 'Water Points Board', path: '/' },
    { name: 'Report Unavailable', path: '/report' },
    { name: 'Staff Dashboard', path: '/staff' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  WaterPoint Board
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Campus CHR
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Availability & Issue Tracking • Squad 62
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sky-50 text-sky-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Status & Action */}
          <div className="hidden md:flex items-center gap-3">
            {/* Backend connectivity indicator */}
            <div
              title={
                backendOnline
                  ? 'Connected to FastAPI backend'
                  : 'Operating in local demo mode'
              }
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                backendOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {backendOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">API Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Demo Mode</span>
                </>
              )}
            </div>

            {/* Quick Report CTA */}
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </Link>

            {isStaffLoggedIn && (
              <button
                type="button"
                onClick={logoutStaff}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 underline px-2 cursor-pointer"
              >
                Logout Staff
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === link.path
                  ? 'bg-sky-50 text-sky-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Status: {backendOnline ? 'API Live' : 'Demo Mode'}
            </span>
            {isStaffLoggedIn && (
              <button
                type="button"
                onClick={logoutStaff}
                className="text-xs text-rose-600 font-medium"
              >
                Logout Staff
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
