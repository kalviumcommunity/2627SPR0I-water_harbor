import { useState } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { useAuth } from '../../hooks/useAuth';

export function ResolveModal({
  isOpen,
  report,
  waterPoint,
  onClose,
  onConfirm,
}) {
  const { user } = useAuth();
  const [resolvedBy, setResolvedBy] = useState(user?.name || 'Facilities Officer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!report) return null;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await onConfirm(report.id, resolvedBy.trim() || 'facilities_staff');
      if (res.success) {
        onClose();
      } else {
        setError(res.message || 'Failed to record resolution.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Issue Resolution"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Confirm Resolved'}
          </button>
        </>
      }
    >
      <div>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', marginBottom: 16 }}>
          Confirming this action will update the report to <strong>Staff-Confirmed Resolved</strong> and reflect on the public student board.
        </p>

        {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

        <div
          style={{
            backgroundColor: 'var(--slate-50)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--slate-200)',
            marginBottom: 16,
            fontSize: '0.85rem',
          }}
        >
          <div>
            <strong>Water Point:</strong> {waterPoint?.name || `ID #${report.water_point_id}`}
          </div>
          {waterPoint?.location && (
            <div style={{ color: 'var(--slate-500)', marginTop: 2 }}>
              <strong>Location:</strong> {waterPoint.location}
            </div>
          )}
          <div style={{ marginTop: 6, color: 'var(--danger-700)' }}>
            <strong>Student Issue:</strong> {report.description}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="resolved-by"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 4 }}
          >
            Confirmed By (Staff Name / ID)
          </label>
          <input
            id="resolved-by"
            type="text"
            value={resolvedBy}
            onChange={(e) => setResolvedBy(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              fontSize: '0.875rem',
            }}
            disabled={submitting}
          />
        </div>
      </div>
    </Modal>
  );
}

export default ResolveModal;
