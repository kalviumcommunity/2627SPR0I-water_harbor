import { Link } from 'react-router-dom';
import { Droplet, ArrowLeft } from 'lucide-react';

/**
 * NotFoundPage ("*")
 * Minimal, clean 404 page matching the Water Harbour design system.
 */
export function NotFoundPage() {
  return (
    <div className="max-w-lg mx-auto py-20 px-4 text-center">
      <div className="bg-white border border-[#DFE6F0] rounded-2xl p-8 sm:p-10 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#EDF2F9] border border-[#DFE6F0] flex items-center justify-center mx-auto text-[#102454]">
          <Droplet className="w-8 h-8 text-[#D6A63C]" />
        </div>

        <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#71809B] border border-[#E2E8F0]">
          404 Error
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#102454] tracking-tight">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-[#71809B] max-w-sm mx-auto leading-relaxed">
          The water point or page you requested does not exist or has been relocated on campus.
        </p>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#102454] hover:bg-[#183375] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#D6A63C]" />
            <span>Return to Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
