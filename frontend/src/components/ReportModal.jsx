import { useState } from 'react';
import { X, AlertTriangle, AlertOctagon, Send, CheckCircle2, Info } from 'lucide-react';
import { useApp } from '../context/useApp';

const PRESET_ISSUES = [
  'No water dispensing from any tap',
  'Water pressure is extremely low',
  'Cooling unit not working (dispensing warm water)',
  'Continuous water leakage / drip tray overflowing',
  'Unusual taste or murky water quality',
  'Push button or lever physically damaged/stuck',
];

export default function ReportModal({ waterPoint, onClose }) {
  const { reportUnavailable } = useApp();
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(
    waterPoint?.status === 'reported_unavailable'
  );
  const [success, setSuccess] = useState(false);

  if (!waterPoint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a brief description of the issue.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await reportUnavailable({
        waterPointId: waterPoint.id,
        description: description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      if (err.isDuplicate) {
        setIsDuplicate(true);
      }
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setDescription((prev) => {
      if (!prev) return preset;
      if (prev.includes(preset)) return prev;
      return `${prev}. ${preset}`;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Report Unavailable Dispenser
              </h3>
              <p className="text-xs text-slate-500">
                No account required • Campus community report
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Target water point badge */}
          <div className="mb-4 p-3 rounded-xl bg-slate-100 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Selected Water Point
            </div>
            <div className="font-semibold text-slate-900">{waterPoint.name}</div>
            <div className="text-xs text-slate-500">{waterPoint.location}</div>
          </div>

          {/* Success State */}
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-semibold text-slate-900">
                Report Logged Successfully!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Status has been updated to <strong>Reported Unavailable</strong>. Facilities staff have been alerted to review the issue.
              </p>
            </div>
          ) : isDuplicate ? (
            /* Duplicate Active Issue Callout */
            <div className="py-2 space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">
                      Active Issue Already Reported
                    </h4>
                    <p className="text-xs text-amber-800 mt-1">
                      A report has already been logged for this dispenser and is awaiting facilities resolution. Duplicate reports are automatically merged to keep records clear.
                    </p>
                    {waterPoint.active_report && (
                      <div className="mt-2.5 p-2.5 bg-white/80 rounded-lg border border-amber-200 text-xs text-slate-700">
                        <span className="font-semibold text-slate-800">Existing Note: </span>
                        "{waterPoint.active_report.description}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close & View Board
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Preset Tags */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Common Issues (tap to insert)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ISSUES.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 border border-slate-200 text-slate-600 transition-colors cursor-pointer text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="report-desc"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Describe the Problem <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {description.length} / 500
                  </span>
                </div>
                <textarea
                  id="report-desc"
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Water is not dispensing from cold tap, button feels broken..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-[11px] text-sky-800 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-sky-600 mt-0.5" />
                <span>
                  Reports update this water point's status to <strong>Reported Unavailable</strong> on the campus board until facilities staff confirm resolution.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
