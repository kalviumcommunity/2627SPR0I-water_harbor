import { REPORT_STATUS, DISPLAY_STATUS } from '../../utils/constants';

export function StatusBadge({ status }) {
  if (status === REPORT_STATUS.REPORTED_UNAVAILABLE) {
    return (
      <span className="status-badge badge-unavailable" role="status">
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#dc2626' }} />
        {DISPLAY_STATUS.UNAVAILABLE}
      </span>
    );
  }

  if (status === REPORT_STATUS.STAFF_CONFIRMED_RESOLVED) {
    return (
      <span className="status-badge badge-resolved" role="status">
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
        {DISPLAY_STATUS.RESOLVED}
      </span>
    );
  }

  return (
    <span className="status-badge badge-unknown" role="status">
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }} />
      {DISPLAY_STATUS.UNKNOWN}
    </span>
  );
}

export default StatusBadge;
