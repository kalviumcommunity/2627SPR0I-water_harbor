import { useState } from 'react';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import { validateReportDescription } from '../../utils/validators';

export function IssueReportModal({
  isOpen,
  waterPoint,
  onClose,
  onSubmit,
}) {
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [conflictMessage, setConflictMessage] = useState(null);

  if (!waterPoint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setConflictMessage(null);

    const validationError = validateReportDescription(description);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmit({
        waterPointId: waterPoint.id,
        description,
      });

      if (res.success) {
        setDescription('');
        onClose();
      } else if (res.isConflict) {
        setConflictMessage(
          res.message ||
            'Notice: An active unresolved report already exists for this dispenser. Facilities staff have already been notified.'
        );
      } else {
        setErrorMessage(res.message || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setDescription('');
    setErrorMessage(null);
    setConflictMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Report Unavailable Water Point"
      footer={
        <>
          <button
            type="button"
            onClick={handleModalClose}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-danger"
            disabled={submitting || !description.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: 4 }}>
            Selected Water Point:
          </label>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--slate-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{waterPoint.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>📍 {waterPoint.location}</div>
          </div>
        </div>

        {conflictMessage && (
          <Alert type="warning" onClose={() => setConflictMessage(null)}>
            <strong>Duplicate Report Prevented:</strong>
            <p style={{ marginTop: 4 }}>{conflictMessage}</p>
          </Alert>
        )}

        {errorMessage && (
          <Alert type="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </Alert>
        )}

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="issue-description"
            style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: 6 }}
          >
            Describe the Issue <span style={{ color: 'var(--danger-600)' }}>*</span>
          </label>
          <textarea
            id="issue-description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dispenser not releasing water, water pressure too low, leak near tap, or power indicator off."
            maxLength={500}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-300)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            disabled={submitting}
            required
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--slate-400)',
              marginTop: 4,
            }}
          >
            <span>No account required to submit</span>
            <span>{description.length}/500 chars</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default IssueReportModal;
