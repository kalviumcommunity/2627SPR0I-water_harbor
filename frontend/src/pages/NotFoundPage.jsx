import { Link } from 'react-router-dom';
import { Droplet, ArrowLeft } from 'lucide-react';

/**
 * NotFoundPage ("*")
 * Minimal, clean 404 page matching the Water Harbour design system.
 */
export function NotFoundPage() {
  return (
    <div className="max-w-lg mx-auto py-16 sm:py-20 px-4 text-center">
      <div className="bg-white border border-[#DFE6F0] rounded-xl p-8 sm:p-10 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-[#EDF2F9] border border-[#DFE6F0] flex items-center justify-center mx-auto text-[#102454]">
          <Droplet className="w-6 h-6 text-[#D6A63C]" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#5A6B87] border border-[#E2E8F0]">
          404 Not Found
        </div>

        <h1 className="text-2xl font-bold font-heading text-[#102454] tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-[#5A6B87] max-w-sm mx-auto leading-relaxed">
          The water point or page you requested does not exist or has been relocated on campus.
        </p>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#102454] hover:bg-[#183375] text-white font-medium text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D6A63C]" />
            <span>Return to Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;