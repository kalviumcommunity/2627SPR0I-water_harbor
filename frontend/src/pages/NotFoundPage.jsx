import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="py-24 px-4 text-center space-y-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
      <p className="text-sm text-slate-500">
        The requested water point page or route does not exist.
      </p>
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campus Board</span>
        </Link>
      </div>
    </div>
  );
}
