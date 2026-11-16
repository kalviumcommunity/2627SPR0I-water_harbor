import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const norm = (status || '').toLowerCase().replace(/[-\s]/g, '_');

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
    lg: 'text-base px-3.5 py-1.5 gap-2.5',
  }[size] || 'text-sm px-3 py-1 gap-2';

  if (norm === 'reported_unavailable' || norm === 'unavailable') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-sm ${sizeClasses}`}
      >
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
        <span>Reported Unavailable</span>
      </span>
    );
  }

  if (norm === 'staff_confirmed_resolved' || norm === 'resolved') {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm ${sizeClasses}`}
      >
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
        <span>Staff-Confirmed Resolved</span>
      </span>
    );
  }

  // Default: Unknown / No Recent Report - MUST NOT be displayed as "Working" per PRD Section 4
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
    >
      <HelpCircle className="w-4 h-4 shrink-0 text-slate-500" />
      <span>No Recent Report / Unknown</span>
    </span>
  );
}
