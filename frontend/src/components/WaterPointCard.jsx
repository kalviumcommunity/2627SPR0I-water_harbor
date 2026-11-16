import { useState } from 'react';
import { MapPin, Clock, AlertOctagon, CheckCircle2, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useApp } from '../context/useApp';
import { formatTimeAgo } from '../utils/formatTime';

export default function WaterPointCard({ waterPoint, onOpenReport, onOpenResolve }) {
  const [expanded, setExpanded] = useState(false);
  const { isStaffLoggedIn } = useApp();

  const isUnavailable = waterPoint.status === 'reported_unavailable';
  const isResolved = waterPoint.status === 'staff_confirmed_resolved';

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-white flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
        isUnavailable
          ? 'border-rose-200/90 ring-1 ring-rose-100'
          : isResolved
          ? 'border-emerald-200/80 ring-1 ring-emerald-50'
          : 'border-slate-200'
      }`}
    >
      <div className="p-5">
        {/* Header with building & status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200/70">
              {waterPoint.building || 'Campus'}
            </span>
            {waterPoint.floor && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {waterPoint.floor}
              </span>
            )}
          </div>
          <StatusBadge status={waterPoint.status} size="sm" />
        </div>

        {/* Water Point Title */}
        <h3 className="text-lg font-semibold text-slate-900 tracking-tight leading-snug mb-1">
          {waterPoint.name}
        </h3>

        {/* Location descriptor */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="line-clamp-1">{waterPoint.location}</span>
        </div>

        {/* Status Callout Banner */}
        {isUnavailable && waterPoint.active_report && (
          <div className="mb-4 rounded-xl bg-rose-50/80 border border-rose-200 p-3 text-xs text-rose-900">
            <div className="flex items-center gap-1.5 font-semibold text-rose-700 mb-1">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Reported Issue:</span>
            </div>
            <p className="line-clamp-2 text-slate-700 font-normal">
              "{waterPoint.active_report.description}"
            </p>
          </div>
        )}

        {isResolved && waterPoint.resolved_info && (
          <div className="mb-4 rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 mb-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Resolved by: {waterPoint.resolved_info.resolved_by}</span>
            </div>
            {waterPoint.resolved_info.notes && (
              <p className="line-clamp-2 text-slate-600 font-normal">
                "{waterPoint.resolved_info.notes}"
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {waterPoint.last_updated
              ? `Updated ${formatTimeAgo(waterPoint.last_updated)} (${new Date(
                  waterPoint.last_updated
                ).toLocaleDateString()})`
              : 'No recent reports logged'}
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          {expanded ? (
            <>
              Less info <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              More info <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Staff resolution button if unavailable */}
          {isStaffLoggedIn && isUnavailable && (
            <button
              type="button"
              onClick={() => onOpenResolve(waterPoint)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Confirm Resolution</span>
            </button>
          )}

          {/* Student Report CTA */}
          <button
            type="button"
            onClick={() => onOpenReport(waterPoint)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm ${
              isUnavailable
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>{isUnavailable ? 'View Active Report' : 'Report Unavailable'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Accordion Details */}
      {expanded && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-2">
          <div>
            <span className="font-semibold text-slate-700">Full Location: </span>
            {waterPoint.location}
          </div>
          <div>
            <span className="font-semibold text-slate-700">Status Rule: </span>
            {isUnavailable
              ? 'A student reported this dispenser unavailable; awaiting facilities staff resolution.'
              : isResolved
              ? 'Facilities staff inspected and verified this dispenser as resolved.'
              : 'No recent reports have been submitted. Not verified by sensors.'}
          </div>
          <div className="text-[11px] text-slate-400 italic">
            Campus WaterPoint Board uses human reports and staff actions. It does not use IoT sensors.
          </div>
        </div>
      )}
    </div>
  );
}
