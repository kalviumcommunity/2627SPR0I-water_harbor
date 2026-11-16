import { Link } from 'react-router-dom';
import WaterDrop from '../components/WaterDrop';

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <div className="bg-paper border-ink-3 shadow-hard-lg rounded-2xl p-8">
        <WaterDrop status="reported_unavailable" size="xl" className="mx-auto mb-4" />
        <h1 className="text-3xl font-heading text-ink mb-2">404: Lost on Campus?</h1>
        <p className="text-xs sm:text-sm text-ink/80 mb-6">
          This path leads nowhere with water. Let&apos;s get you back to the campus hydration board!
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-sun text-ink font-bold text-xs sm:text-sm border-2 border-ink rounded-xl shadow-hard-sm btn-tactile"
        >
          Return to Board
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
