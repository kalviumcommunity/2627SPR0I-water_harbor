import { Link } from 'react-router-dom';
import { MapPin, Clock, Wrench } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatTime';

/**
 * Refined WaterPointCard Component:
 * - High scannability and clean visual hierarchy
 * - Precise status indicators with live colored dot badges
 * - Subtle report notes and quiet borders
 * - Understated action CTA
 */
export function WaterPointCard({ waterPoint, activeReport, recentResolvedReport }) {
  // Compute human-reported status
  let computedStatus = 'no_recent_report';
  let statusLabel = 'No recent report';
  let badgeStyle = 'bg-[#F8FAFC] text-[#475569] border-[#DFE6F0]';
  let dotColor = 'bg-[#8C9CB3]';

  if (activeReport) {
    computedStatus = 'reported_unavailable';
    statusLabel = 'Reported unavailable';
    badgeStyle = 'bg-[#FDF2F2] text-[#B91C1C] border-[#F8C9C9]';
    dotColor = 'bg-[#D94B4B]';
  } else if (recentResolvedReport) {
    computedStatus = 'staff_confirmed_resolved';
    statusLabel = 'Staff-confirmed resolved';
    badgeStyle = 'bg-[#EBF6EE] text-[#15803D] border-[#C6E7CF]';
    dotColor = 'bg-[#2F8A57]';
  }

  return (
    <article className="wh-card p-4 sm:p-5 flex flex-col justify-between group">
      <div>
        {/* Header: Facility Pill + Status Dot Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-block px-2 py-0.5 text-[11px] font-medium text-[#5A6B87] bg-[#F1F5F9] border border-[#E2E8F0] rounded">
            {waterPoint.building || 'Campus Facility'}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${badgeStyle}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
            <span>{statusLabel}</span>
          </span>
        </div>

        {/* Station Name */}
        <h3 className="text-base font-semibold text-[#102454] leading-snug tracking-tight mb-1 group-hover:text-[#162F6B] transition-colors">
          {waterPoint.name}
        </h3>

        {/* Location string */}
        <div className="flex items-center gap-1.5 text-xs text-[#5A6B87] mb-3.5">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#8C9CB3]" aria-hidden="true" />
          <span className="truncate">{waterPoint.location}</span>
        </div>

        {/* Status Callout Box */}
        {computedStatus === 'reported_unavailable' && activeReport && (
          <div className="bg-[#FDF2F2]/60 border border-[#F8C9C9] rounded-lg p-3 mb-3.5 text-xs space-y-1">
            <span className="font-semibold text-[#B91C1C] block text-[11px] uppercase tracking-wider">
              Reported Issue
            </span>
            <p className="text-[#334155] italic leading-relaxed">
              &ldquo;{activeReport.description}&rdquo;
            </p>
            <div className="flex items-center gap-1 text-[11px] text-[#8C9CB3] pt-0.5">
              <Clock className="w-3 h-3" />
              <span>Reported {formatRelativeTime(activeReport.reported_at)}</span>
            </div>
          </div>
        )}

        {computedStatus === 'staff_confirmed_resolved' && recentResolvedReport && (
          <div className="bg-[#EBF6EE]/60 border border-[#C6E7CF] rounded-lg p-3 mb-3.5 text-xs space-y-1">
            <span className="font-semibold text-[#15803D] block text-[11px] uppercase tracking-wider">
              Repaired &bull; {recentResolvedReport.resolved_by || 'Staff'}
            </span>
            {recentResolvedReport.resolution_notes && (
              <p className="text-[#334155] leading-relaxed">
                {recentResolvedReport.resolution_notes}
              </p>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[#8C9CB3] pt-0.5">
              <Clock className="w-3 h-3" />
              <span>Resolved {formatRelativeTime(recentResolvedReport.resolved_at)}</span>
            </div>
          </div>
        )}

        {computedStatus === 'no_recent_report' && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 mb-3.5 text-[11px] text-[#5A6B87] flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#8C9CB3] shrink-0" />
            <span>No reports submitted recently. Standard schedule.</span>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3 text-xs">
        <span className="text-[11px] font-mono text-[#8C9CB3]">
          ID #{waterPoint.id}
        </span>

        <Link
          to={`/report?wp=${waterPoint.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#102454] bg-[#F8FAFC] hover:bg-[#EDF2F9] border border-[#DFE6F0] transition-colors"
        >
          <Wrench className="w-3 h-3 text-[#5A6B87]" />
          <span>Report Issue</span>
        </Link>
      </div>
    </article>
  );
}

export default WaterPointCard;
