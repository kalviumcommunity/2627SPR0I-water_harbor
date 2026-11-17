import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Modal dialog for staff members to record repair details and resolve a report.
 */
export function RepairDialog({ isOpen, onClose, onResolve, report, waterPointName, isSubmitting }) {
  const [resolvedBy, setResolvedBy] = useState(() => sessionStorage.getItem('staff_name') || '');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolvedBy.trim()) {
      setErrorMessage('Please enter your staff name or identifier.');
      return;
    }

    try {
      setErrorMessage('');
      await onResolve(report.id, resolvedBy.trim(), resolutionNotes.trim());
      setResolutionNotes('');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage('Authentication failed: Missing or invalid Staff Access Key.');
      } else {
        setErrorMessage(err.response?.data?.detail || err.message || 'Failed to resolve report.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repair-dialog-title"
    >
      <div className="relative w-full max-w-lg bg-paper border-ink-3 shadow-hard-xl rounded-2xl p-6 text-ink animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1 rounded-lg border-2 border-ink bg-paper text-ink hover:bg-coral hover:text-white btn-tactile cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-mint border-2 border-ink flex items-center justify-center shadow-hard-sm">
            <CheckCircle2 className="w-6 h-6 text-ink" />
          </div>
          <div>
            <h2 id="repair-dialog-title" className="text-xl font-heading leading-tight">
              Confirm Water Point Repair
            </h2>
            <p className="text-xs text-ink/70">
              {waterPointName || `Water Point #${report.water_point_id}`}
            </p>
          </div>
        </div>

        {/* Existing report context */}
        <div className="bg-coral/10 border-2 border-coral/40 rounded-xl p-3 mb-4 text-xs">
          <span className="font-bold text-coral block mb-0.5">Reported Issue:</span>
          <p className="italic text-ink">&ldquo;{report.description}&rdquo;</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-coral/15 border-2 border-coral rounded-xl text-xs font-semibold text-coral flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-name-input" className="block text-xs font-bold uppercase tracking-wider mb-1">
              Staff Member Name <span className="text-coral">*</span>
            </label>
            <input
              id="staff-name-input"
              type="text"
              required
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              placeholder="e.g. Dave Miller (Plumbing)"
              className="w-full px-3 py-2 text-sm bg-paper text-ink border-2 border-ink rounded-xl shadow-hard-sm focus:border-cobalt focus:ring-0 placeholder:text-ink/40"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="resolution-notes-input" className="text-xs font-bold uppercase tracking-wider">
                Resolution Notes (optional)
              </label>
              <span className="text-[11px] text-ink/60 font-mono">
                {resolutionNotes.length}/300
              </span>
            </div>
            <textarea
              id="resolution-notes-input"
              maxLength={300}
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced internal filter cartridge, unclogged drain nozzle, verified clean flow."
              className="w-full px-3 py-2 text-sm bg-paper text-ink border-2 border-ink rounded-xl shadow-hard-sm focus:border-cobalt focus:ring-0 placeholder:text-ink/40"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold border-2 border-ink rounded-xl bg-paper text-ink hover:bg-sky btn-tactile cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold border-2 border-ink rounded-xl bg-mint text-ink shadow-hard-sm hover:-translate-y-0.5 btn-tactile cursor-pointer inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Confirm Resolved'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RepairDialog;
