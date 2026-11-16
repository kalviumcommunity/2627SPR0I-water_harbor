import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertOctagon, Send, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/useApp';

const PRESET_ISSUES = [
  'No water dispensing from any tap',
  'Water pressure is extremely low / trickling',
  'Cooling unit broken - dispensing warm water',
  'Continuous water leaking / puddle forming on floor',
  'Unusual chlorine / metallic taste or cloudy water',
  'Tap push button jammed or valve handle broken',
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialWpId = searchParams.get('id') || searchParams.get('waterPointId') || '';

  const { waterPoints, reportUnavailable } = useApp();

  const [selectedId, setSelectedId] = useState(initialWpId);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedWaterPoint = useMemo(() => {
    if (!selectedId) return null;
    return waterPoints.find((wp) => wp.id === Number(selectedId));
  }, [waterPoints, selectedId]);

  const handleSelectPreset = (preset) => {
    setDescription((prev) => {
      if (!prev) return preset;
      if (prev.includes(preset)) return prev;
      return `${prev}. ${preset}`;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      setError('Please select a campus water point.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a brief description of the issue.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await reportUnavailable({
        waterPointId: Number(selectedId),
        description: description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      if (err.isDuplicate) {
        setIsDuplicate(true);
      }
      setError(err.message || 'Failed to submit issue report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Water Points Board</span>
      </Link>

      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 mb-2">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Student Issue Submission</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Report an Unavailable Water Dispenser
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            No login or account required. Your report alerts facilities staff and updates the campus availability board immediately.
          </p>
        </div>

        {/* Success confirmation */}
        {success ? (
          <div className="py-12 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 p-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Report Submitted Successfully!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              The status for <strong>{selectedWaterPoint?.name}</strong> has been updated to <strong>Reported Unavailable</strong>. Redirecting you back to the board...
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
              >
                Go to Public Board Now
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error / Duplicate alert */}
            {error && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                  isDuplicate
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-0.5">
                    {isDuplicate ? 'Duplicate Report Prevented' : 'Submission Error'}
                  </div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Select Water Point */}
            <div>
              <label htmlFor="water-point-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Choose Campus Water Point <span className="text-rose-500">*</span>
              </label>
              <select
                id="water-point-select"
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setIsDuplicate(false);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-900"
                required
              >
                <option value="">-- Select a water point location --</option>
                {waterPoints.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name} ({wp.building || wp.location}) - Status: {wp.status === 'reported_unavailable' ? 'Unavailable' : wp.status === 'staff_confirmed_resolved' ? 'Resolved' : 'No Recent Report'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected preview info */}
            {selectedWaterPoint && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div>
                  <span className="font-semibold text-slate-800">Location: </span>
                  {selectedWaterPoint.location}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Current Status: </span>
                  <span className="capitalize">{selectedWaterPoint.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            )}

            {/* Quick preset issues */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quick Select Issue Description
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ISSUES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 text-slate-700 transition-colors cursor-pointer text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="issue-description" className="block text-xs font-semibold text-slate-700">
                  Additional Details / Observations <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {description.length} / 500 characters
                </span>
              </div>
              <textarea
                id="issue-description"
                rows={4}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what is wrong with the dispenser so facilities staff can bring the right replacement parts..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anonymous student submission</span>
              </span>
              <button
                type="submit"
                disabled={submitting || !selectedId || !description.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
  );
}
