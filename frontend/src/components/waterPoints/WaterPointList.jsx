import WaterPointCard from './WaterPointCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Alert from '../common/Alert';

export function WaterPointList({
  waterPoints,
  loading,
  error,
  onReportIssue,
  onRetry,
}) {
  if (loading) {
    return <LoadingSpinner message="Fetching campus water points from backend..." />;
  }

  if (error) {
    return (
      <div>
        <Alert type="error">{error}</Alert>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" onClick={onRetry} className="btn btn-secondary">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!waterPoints || waterPoints.length === 0) {
    return (
      <EmptyState
        title="No campus water points found"
        description="No water points matched your search or filter settings."
        action={
          <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm">
            Refresh Directory
          </button>
        }
      />
    );
  }

  return (
    <div className="card-grid">
      {waterPoints.map((wp) => (
        <WaterPointCard
          key={wp.id}
          waterPoint={wp}
          onReportIssue={onReportIssue}
        />
      ))}
    </div>
  );
}

export default WaterPointList;
