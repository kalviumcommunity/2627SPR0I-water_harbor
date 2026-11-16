import StatusBadge from '../common/StatusBadge';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { REPORT_STATUS } from '../../utils/constants';

export function WaterPointCard({ waterPoint, onReportIssue }) {
  const isUnavailable = waterPoint.latestStatus === REPORT_STATUS.REPORTED_UNAVAILABLE;

  return (
    <div className="waterpoint-card">
      <div>
        <div className="card-header">
          <div style={{ flex: 1, paddingRight: 8 }}>
            <h3 className="card-title">{waterPoint.name}</h3>
            <div className="card-location">
              <span>📍</span>
              <span>{waterPoint.location}</span>
            </div>
          </div>
          <StatusBadge status={waterPoint.latestStatus} />
        </div>

        {isUnavailable && waterPoint.activeReport?.description && (
          <div
            style={{
              backgroundColor: 'var(--danger-50)',
              border: '1px solid var(--danger-100)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              fontSize: '0.8rem',
              color: 'var(--danger-800)',
              marginTop: 10,
            }}
          >
            <strong>Reported Issue:</strong> {waterPoint.activeReport.description}
          </div>
        )}
      </div>

      <div>
        <div className="card-meta">
          <span title={formatDateTime(waterPoint.lastUpdated)}>
            Updated: {formatRelativeTime(waterPoint.lastUpdated)}
          </span>
          {waterPoint.latestReport?.resolved_by && (
            <span>By: {waterPoint.latestReport.resolved_by}</span>
          )}
        </div>

        <div className="card-actions">
          {isUnavailable ? (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--danger-700)',
                fontWeight: 500,
                textAlign: 'center',
                padding: '6px 0',
              }}
            >
              ⚠️ Active report logged — Pending facilities review
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onReportIssue(waterPoint)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Report Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WaterPointCard;
