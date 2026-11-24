import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Premium Modal Dialog for Facilities Staff to confirm a repair.
 * Clean SaaS modal with refined typography, quiet borders, and distinct action states.
 */
export function RepairDialog({ isOpen, onClose, onResolve, report, waterPointName, isSubmitting }) {
  const [resolvedBy, setResolvedBy] = useState(() => sessionStorage.getItem('staff_name') || '');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !report) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolvedBy.trim()) {
      setErrorMessage('Please enter your staff member name.');
      return;
    }

    try {
      setErrorMessage('');
      await onResolve(report.id, resolvedBy.trim(), resolutionNotes.trim());
      setResolutionNotes('');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrorMessage('Authentication failed: Missing or invalid Staff Access Key in current session.');
      } else {
        setErrorMessage(err.response?.data?.detail || err.message || 'Failed to record resolution.');
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09132D]/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repair-dialog-title"
    >
      <div className="relative w-full max-w-lg bg-white border border-[#DFE6F0] shadow-xl rounded-2xl p-6 text-[#102454] animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8C9CB3] hover:text-[#102454] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#EBF6EE] border border-[#C6E7CF] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#2F8A57]" />
          </div>
          <div>
            <h2 id="repair-dialog-title" className="text-base font-bold font-heading text-[#102454] leading-tight">
              Confirm Water Point Repair
            </h2>
            <p className="text-xs text-[#5A6B87]">
              {waterPointName || `Water Point #${report.water_point_id}`}
            </p>
          </div>
        </div>

        {/* Reported Issue Context */}
        <div className="bg-[#FDF2F2]/60 border border-[#F8C9C9] rounded-xl p-3 mb-4 text-xs">
          <span className="font-semibold text-[#B91C1C] block mb-0.5 text-[11px] uppercase tracking-wider">
            Reported Issue
          </span>
          <p className="italic text-[#334155] leading-relaxed">&ldquo;{report.description}&rdquo;</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F8C9C9] rounded-xl text-xs font-medium text-[#D94B4B] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="staff-name-input" className="block text-xs font-semibold text-[#102454] uppercase tracking-wider mb-1.5">
              Staff Member Name <span className="text-[#D94B4B]">*</span>
            </label>
            <input
              id="staff-name-input"
              type="text"
              required
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              placeholder="e.g. Dave Miller (Plumbing Lead)"
              className="w-full px-3 py-2 text-sm bg-white text-[#102454] border border-[#DFE6F0] rounded-lg focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#8C9CB3]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="resolution-notes-input" className="text-xs font-semibold text-[#102454] uppercase tracking-wider">
                Resolution Notes (Optional)
              </label>
              <span className="text-[11px] text-[#8C9CB3]">
                {resolutionNotes.length}/300
              </span>
            </div>
            <textarea
              id="resolution-notes-input"
              rows={3}
              maxLength={300}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced internal filter cartridge, unclogged nozzle, verified clean pressure flow."
              className="w-full px-3 py-2 text-sm bg-white text-[#102454] border border-[#DFE6F0] rounded-lg focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#8C9CB3] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-[#5A6B87] hover:text-[#102454] bg-white border border-[#DFE6F0] hover:bg-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2F8A57] hover:bg-[#277449] rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Confirming...' : 'Confirm Resolved'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RepairDialog;
