import { Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import WaterDrop from './WaterDrop';
import { formatRelativeTime } from '../utils/formatTime';

/**
 * Poster-style WaterPointCard with tactile border, offset shadow,
 * asymmetric corners, and dynamic WaterDrop face.
 */
export function WaterPointCard({ waterPoint, activeReport, recentResolvedReport, index = 0 }) {
  // Compute the human-reported status
  let computedStatus = 'no_recent_report';
  let statusLabel = 'No recent report';
  let badgeBg = 'bg-lilac';

  if (activeReport) {
    computedStatus = 'reported_unavailable';
    statusLabel = 'Reported unavailable';
    badgeBg = 'bg-coral text-white';
  } else if (recentResolvedReport) {
    computedStatus = 'staff_confirmed_resolved';
    statusLabel = 'Staff-confirmed resolved';
    badgeBg = 'bg-mint text-ink';
  }

  // Alternate tilt for poster feel
  const tiltClass = index % 2 === 0 ? '-rotate-[0.4deg]' : 'rotate-[0.4deg]';
  const asymmClass = index % 2 === 0 ? 'card-asymm-1' : 'card-asymm-2';

  return (
    <article
      className={`relative bg-paper text-ink border-ink-3 shadow-hard hover:shadow-hard-lg transition-all ${tiltClass} hover:rotate-0 ${asymmClass} p-5 sm:p-6 flex flex-col justify-between`}
    >
      <div>
        {/* Top Header: WaterDrop + Status Badge */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <WaterDrop status={computedStatus} size="md" />

          <div className="text-right">
            <span
              className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border-2 border-ink shadow-hard-sm ${badgeBg}`}
            >
              {statusLabel}
            </span>
            {waterPoint.building && (
              <div className="mt-1.5 text-xs font-medium text-ink/70">
                {waterPoint.building}
              </div>
            )}
          </div>
        </div>

        {/* Water Point Name */}
        <h3 className="text-lg sm:text-xl font-heading text-ink leading-tight mb-2">
          {waterPoint.name}
        </h3>

        {/* Location detail */}
        <div className="flex items-start gap-1.5 text-xs sm:text-sm text-ink/80 mb-4">
          <MapPin className="w-4 h-4 shrink-0 text-cobalt mt-0.5" aria-hidden="true" />
          <span>{waterPoint.location}</span>
        </div>

        {/* Status Specific Description Box */}
        {computedStatus === 'reported_unavailable' && activeReport && (
          <div className="bg-coral/10 border-2 border-coral/40 rounded-xl p-3 mb-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-coral mb-1">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reported issue</span>
            </div>
            <p className="text-ink italic mb-2">
              &ldquo;{activeReport.description}&rdquo;
            </p>
            <div className="flex items-center gap-1 text-[11px] text-ink/70">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>Reported {formatRelativeTime(activeReport.reported_at)}</span>
            </div>
          </div>
        )}

        {computedStatus === 'staff_confirmed_resolved' && recentResolvedReport && (
          <div className="bg-mint/15 border-2 border-mint/40 rounded-xl p-3 mb-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-mint" aria-hidden="true" />
              <span>
                Repaired by {recentResolvedReport.resolved_by || 'Staff'}
              </span>
            </div>
            {recentResolvedReport.resolution_notes && (
              <p className="text-ink/90 text-xs mb-2">
                Note: {recentResolvedReport.resolution_notes}
              </p>
            )}
            <div className="flex items-center gap-1 text-[11px] text-ink/70">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>Resolved {formatRelativeTime(recentResolvedReport.resolved_at)}</span>
            </div>
          </div>
        )}

        {computedStatus === 'no_recent_report' && (
          <div className="bg-lilac/20 border-2 border-lilac/50 rounded-xl p-3 mb-4 text-xs sm:text-sm text-ink/80">
            <p>No issues reported recently by students or staff.</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="pt-3 border-t-2 border-ink/10 flex items-center justify-between gap-3">
        {computedStatus === 'reported_unavailable' ? (
          <Link
            to={`/report?wp=${waterPoint.id}`}
            className="w-full text-center py-2 px-3 text-xs sm:text-sm font-bold bg-sun text-ink border-2 border-ink rounded-xl shadow-hard-sm hover:-translate-y-0.5 btn-tactile"
          >
            Report update
          </Link>
        ) : (
          <Link
            to={`/report?wp=${waterPoint.id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs sm:text-sm font-bold bg-sky text-ink border-2 border-ink rounded-xl shadow-hard-sm hover:-translate-y-0.5 btn-tactile"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tell us if it is down</span>
          </Link>
        )}
      </div>
    </article>
  );
}

export default WaterPointCard;
