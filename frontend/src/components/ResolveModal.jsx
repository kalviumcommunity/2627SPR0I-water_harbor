import { useState } from 'react';
import { X, CheckCircle2, Wrench } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function ResolveModal({ waterPoint, onClose }) {
  const { confirmResolution } = useApp();
  const [staffName, setStaffName] = useState('Staff - Facilities Team');
  const [notes, setNotes] = useState('Inspected dispenser, cleared blockage/replaced filter, and verified water dispensing.');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!waterPoint) return null;

  const handleResolve = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await confirmResolution({
        waterPointId: waterPoint.id,
        resolvedBy: staffName,
        notes,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Confirm Dispenser Resolution
              </h3>
              <p className="text-xs text-slate-500">Facilities Staff Verification</p>
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

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-semibold text-slate-900">
                Resolution Confirmed!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Status has been updated to <strong>Staff-Confirmed Resolved</strong>. The campus directory now shows this location as serviced.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResolve} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                  Water Point to Resolve
                </div>
                <div className="font-semibold text-slate-900">{waterPoint.name}</div>
                <div className="text-xs text-slate-500">{waterPoint.location}</div>
                {waterPoint.active_report && (
                  <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                    <span className="font-semibold">Reported Issue: </span>
                    {waterPoint.active_report.description}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Member / Technician Name
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Taken / Resolution Summary
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Confirming...' : 'Confirm Resolution'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
