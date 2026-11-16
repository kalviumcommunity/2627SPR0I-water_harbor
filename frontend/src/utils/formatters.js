import { REPORT_STATUS, DISPLAY_STATUS } from './constants';

/**
 * Format an ISO timestamp to human-friendly local string.
 * e.g. "16 Nov 2026, 03:05 PM"
 */
export function formatDateTime(isoString) {
  if (!isoString) return 'Not available';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format relative time (e.g. "5 minutes ago", "2 hours ago", "yesterday")
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return 'No recorded updates';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return formatDateTime(isoString);
  } catch {
    return formatDateTime(isoString);
  }
}

/**
 * Return display-safe status text. Water points without active or resolved reports
 * must display "No Recent Report / Unknown", NEVER "Working" (PRD Section 4 Rule).
 */
export function resolveDisplayStatus(status) {
  if (!status) return DISPLAY_STATUS.UNKNOWN;
  if (status === REPORT_STATUS.REPORTED_UNAVAILABLE) return DISPLAY_STATUS.UNAVAILABLE;
  if (status === REPORT_STATUS.STAFF_CONFIRMED_RESOLVED) return DISPLAY_STATUS.RESOLVED;
  return DISPLAY_STATUS.UNKNOWN;
}
