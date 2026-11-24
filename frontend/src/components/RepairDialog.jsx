import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Modal dialog for facilities staff to record repair details and resolve an issue.
 * Matches the clean Figma design system with clear typography, input styling, and state feedback.
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1736]/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repair-dialog-title"
    >
      <div className="relative w-full max-w-lg bg-white border border-[#DFE6F0] shadow-xl rounded-2xl p-6 sm:p-7 text-[#102454] animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#71809B] hover:text-[#102454] hover:bg-[#F3F6FC] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#EBF6EE] border border-[#D2EDD9] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#2F8A57]" />
          </div>
          <div>
            <h2 id="repair-dialog-title" className="text-lg font-bold font-heading text-[#102454] leading-tight">
              Confirm Water Point Repair
            </h2>
            <p className="text-xs text-[#71809B]">
              {waterPointName || `Water Point #${report.water_point_id}`}
            </p>
          </div>
        </div>

        {/* Reported Issue Context */}
        <div className="bg-[#FDF2F2] border border-[#F9D3D3] rounded-xl p-3.5 mb-5 text-xs">
          <span className="font-bold text-[#D94B4B] block mb-1">Reported Issue:</span>
          <p className="italic text-[#334155] leading-relaxed">&ldquo;{report.description}&rdquo;</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FDF2F2] border border-[#F9D3D3] rounded-xl text-xs font-semibold text-[#D94B4B] flex items-center gap-2">
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
              className="w-full px-3.5 py-2.5 text-sm bg-white text-[#102454] border border-[#DFE6F0] rounded-xl focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#94A3B8]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="resolution-notes-input" className="text-xs font-semibold text-[#102454] uppercase tracking-wider">
                Resolution Notes (Optional)
              </label>
              <span className="text-[11px] text-[#94A3B8]">
                {resolutionNotes.length}/300
              </span>
            </div>
            <textarea
              id="resolution-notes-input"
              rows={3}
              maxLength={300}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Replaced internal filter cartridge, cleared nozzle blockage, verified clean pressure flow."
              className="w-full px-3.5 py-2.5 text-sm bg-white text-[#102454] border border-[#DFE6F0] rounded-xl focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#94A3B8] resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#71809B] hover:text-[#102454] bg-white border border-[#DFE6F0] hover:bg-[#F3F6FC] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2F8A57] hover:bg-[#277449] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming...' : 'Confirm Resolved'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RepairDialog;
