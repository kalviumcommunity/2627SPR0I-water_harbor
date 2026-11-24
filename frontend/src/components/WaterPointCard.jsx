import { Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle2, AlertTriangle, AlertCircle, Wrench } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatTime';

/**
 * WaterPointCard matching the Figma reference:
 * - Clean white card with subtle border and understated shadow
 * - Clear status badges (Reported unavailable, Staff-confirmed resolved, No recent report)
 * - Concise location details and report notes
 * - Direct action button to report issues
 */
export function WaterPointCard({ waterPoint, activeReport, recentResolvedReport }) {
  // Compute human-reported status
  let computedStatus = 'no_recent_report';
  let statusLabel = 'No recent report';
  let badgeStyle = 'bg-[#F8FAFC] text-[#71809B] border-[#E2E8F0]';
  let StatusIcon = Clock;

  if (activeReport) {
    computedStatus = 'reported_unavailable';
    statusLabel = 'Reported unavailable';
    badgeStyle = 'bg-[#FDF2F2] text-[#D94B4B] border-[#F9D3D3]';
    StatusIcon = AlertTriangle;
  } else if (recentResolvedReport) {
    computedStatus = 'staff_confirmed_resolved';
    statusLabel = 'Staff-confirmed resolved';
    badgeStyle = 'bg-[#EBF6EE] text-[#2F8A57] border-[#D2EDD9]';
    StatusIcon = CheckCircle2;
  }

  return (
    <article className="wh-card p-5 sm:p-6 flex flex-col justify-between group">
      <div>
        {/* Top Header: Building Badge + Status Pill */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {waterPoint.building ? (
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-[#71809B] bg-[#F1F5F9] border border-[#E2E8F0] rounded-md">
              {waterPoint.building}
            </span>
          ) : (
            <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold text-[#71809B] bg-[#F1F5F9] border border-[#E2E8F0] rounded-md">
              Campus Point
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeStyle}`}
          >
            <StatusIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{statusLabel}</span>
          </span>
        </div>

        {/* Water Point Name */}
        <h3 className="text-lg font-bold text-[#102454] font-heading leading-snug mb-1 group-hover:text-[#1A367E] transition-colors">
          {waterPoint.name}
        </h3>

        {/* Location detail */}
        <div className="flex items-start gap-1.5 text-xs sm:text-sm text-[#71809B] mb-4">
          <MapPin className="w-4 h-4 shrink-0 text-[#102454] mt-0.5" aria-hidden="true" />
          <span>{waterPoint.location}</span>
        </div>

        {/* Status Callout Box */}
        {computedStatus === 'reported_unavailable' && activeReport && (
          <div className="bg-[#FDF2F2] border border-[#F9D3D3] rounded-lg p-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#D94B4B] mb-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Reported Issue</span>
            </div>
            <p className="text-[#334155] italic mb-2 leading-relaxed">
              &ldquo;{activeReport.description}&rdquo;
            </p>
            <div className="flex items-center gap-1 text-[11px] text-[#71809B]">
              <Clock className="w-3 h-3" />
              <span>Reported {formatRelativeTime(activeReport.reported_at)}</span>
            </div>
          </div>
        )}

        {computedStatus === 'staff_confirmed_resolved' && recentResolvedReport && (
          <div className="bg-[#EBF6EE] border border-[#D2EDD9] rounded-lg p-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#2F8A57] mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Repaired by {recentResolvedReport.resolved_by || 'Facilities Staff'}</span>
            </div>
            {recentResolvedReport.resolution_notes && (
              <p className="text-[#334155] text-xs mb-2 leading-relaxed">
                <strong className="font-semibold text-[#102454]">Note:</strong> {recentResolvedReport.resolution_notes}
              </p>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[#71809B]">
              <Clock className="w-3 h-3" />
              <span>Resolved {formatRelativeTime(recentResolvedReport.resolved_at)}</span>
            </div>
          </div>
        )}

        {computedStatus === 'no_recent_report' && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 mb-4 text-xs text-[#71809B] flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <span>No reports submitted recently. Status based on campus routine.</span>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium text-[#94A3B8]">
          Point #{waterPoint.id}
        </span>

        <Link
          to={`/report?wp=${waterPoint.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#102454] bg-[#F3F6FC] hover:bg-[#EDF2F9] border border-[#DFE6F0] rounded-lg transition-colors"
        >
          <Wrench className="w-3.5 h-3.5 text-[#71809B]" />
          <span>Report Issue</span>
        </Link>
      </div>
    </article>
  );
}

export default WaterPointCard;
