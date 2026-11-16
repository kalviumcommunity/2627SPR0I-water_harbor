import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';

export function UnresolvedReportsTable({
  reports,
  waterPointsMap,
  onResolveClick,
}) {
  if (!reports || reports.length === 0) {
    return (
      <EmptyState
        title="All caught up!"
        description="There are currently no active unresolved issue reports submitted by students."
      />
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Report ID</th>
            <th>Water Point Location</th>
            <th>Reported Issue</th>
            <th>Reported At</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const wp = waterPointsMap[report.water_point_id];
            return (
              <tr key={report.id}>
                <td style={{ fontWeight: 600, color: 'var(--slate-500)' }}>
                  #{report.id}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                    {wp?.name || `Water Point #${report.water_point_id}`}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                    📍 {wp?.location || 'Campus location'}
                  </div>
                </td>
                <td style={{ maxWidth: 280 }}>
                  <span style={{ color: 'var(--slate-700)' }}>{report.description}</span>
                </td>
                <td>
                  <div title={formatDateTime(report.reported_at)}>
                    {formatRelativeTime(report.reported_at)}
                  </div>
                </td>
                <td>
                  <StatusBadge status={report.status} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => onResolveClick(report, wp)}
                    className="btn btn-success btn-sm"
                  >
                    Confirm Resolution
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default UnresolvedReportsTable;
