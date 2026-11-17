import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { useApp } from '../context/useApp';
import WaterDrop from '../components/WaterDrop';
import Chip from '../components/Chip';

const ISSUE_PRESETS = [
  'No water dispensing',
  'Low water pressure',
  'Water leaking or puddle',
  'Warm / not cooling',
  'Strange taste or odor',
  'Filter warning light',
];

/**
 * ReportPage ("/report")
 * Anonymous reporting interface with water point selection,
 * sticker issue chips, live 500-character counter, and friendly duplicate handling.
 */
export function ReportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { waterPoints, activeReportsMap, addReport } = useApp();

  const prefilledWpId = searchParams.get('wp') || '';

  const [selectedWpId, setSelectedWpId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChip, setSelectedChip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'duplicate' | 'error', message: string }

  // Derive current effective water point ID
  const effectiveWpId =
    selectedWpId ||
    prefilledWpId ||
    (waterPoints.length > 0 ? String(waterPoints[0].id) : '');

  // Handle clicking sticker chips
  const handleChipClick = (preset) => {
    if (selectedChip === preset) {
      setSelectedChip('');
      if (description === preset) setDescription('');
    } else {
      setSelectedChip(preset);
      setDescription(preset);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!effectiveWpId) {
      setFeedback({
        type: 'error',
        message: 'Please select a water point.',
      });
      return;
    }

    if (!description.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please describe the problem you noticed.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await addReport(effectiveWpId, description);
      if (res?.duplicate) {
        setFeedback({
          type: 'duplicate',
          message: res.message || 'Someone already reported this water point. Our team is on it!',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Thank you! Your report has been noted on the campus board.',
        });
        setDescription('');
        setSelectedChip('');
      }
    } catch (err) {
      if (err.isDuplicate || err.response?.status === 409) {
        setFeedback({
          type: 'duplicate',
          message: err.response?.data?.detail || 'Someone already reported this water point. Our team is on it!',
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.response?.data?.detail || err.message || 'Could not submit report. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPoint = waterPoints.find((wp) => String(wp.id) === String(effectiveWpId));
  const hasActiveReport = effectiveWpId ? activeReportsMap.has(Number(effectiveWpId)) : false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-cobalt cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Campus Board</span>
        </button>
      </div>

      {/* Main Poster Form Container */}
      <div className="bg-paper border-ink-3 shadow-hard-lg rounded-2xl p-6 sm:p-8 text-ink relative">
        {/* Header with Sad Drop */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-block px-3 py-1 bg-coral/20 border-2 border-ink rounded-full text-xs font-bold uppercase tracking-wider mb-2 text-ink">
              Student Helpdesk
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading leading-tight">
              See a sad drop? Tell us.
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink/80">
              No account or login needed. Tell us what is wrong and we will flag it for repair.
            </p>
          </div>
          <WaterDrop status="reported_unavailable" size="lg" className="shrink-0" />
        </div>

        {/* Feedback Alerts */}
        {feedback && (
          <div
            role="alert"
            className={`p-4 rounded-xl border-ink-3 shadow-hard-sm mb-6 flex items-start gap-3 animate-in fade-in duration-150 ${
              feedback.type === 'success'
                ? 'bg-mint text-ink'
                : feedback.type === 'duplicate'
                ? 'bg-sun text-ink'
                : 'bg-coral text-white'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-ink mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm font-semibold">
              <p>{feedback.message}</p>
              {feedback.type === 'duplicate' && (
                <p className="mt-1 text-xs font-normal opacity-90">
                  Facilities staff have already received an active report for this station and are scheduling service.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Active report warning if user selects a point that already has a report */}
        {hasActiveReport && !feedback && (
          <div className="mb-6 p-3.5 bg-sun/40 border-2 border-ink rounded-xl shadow-hard-sm flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Already has an active report:</span>
              <span>
                &ldquo;{activeReportsMap.get(Number(effectiveWpId))?.description}&rdquo;
              </span>
            </div>
          </div>
        )}

        {/* Report Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Water Point Picker */}
          <div>
            <label
              htmlFor="waterpoint-select"
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
            >
              Which water point? <span className="text-coral">*</span>
            </label>
            <select
              id="waterpoint-select"
              required
              value={effectiveWpId}
              onChange={(e) => {
                setSelectedWpId(e.target.value);
                setFeedback(null);
              }}
              className="w-full py-2.5 px-3 bg-paper text-ink border-2 border-ink rounded-xl text-xs sm:text-sm font-semibold shadow-hard-sm focus:border-cobalt focus:ring-0 cursor-pointer"
            >
              <option value="" disabled>
                Select a campus water point...
              </option>
              {waterPoints.map((wp) => (
                <option key={wp.id} value={wp.id}>
                  {wp.name} — {wp.building ? `${wp.building} (${wp.location})` : wp.location}
                </option>
              ))}
            </select>
            {selectedPoint && (
              <p className="mt-1 text-[11px] text-ink/70">
                Location: {selectedPoint.location} {selectedPoint.building && `(${selectedPoint.building})`}
              </p>
            )}
          </div>

          {/* Preset Issue Sticker Chips */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider mb-2">
              Common issues (click to select):
            </span>
            <div className="flex flex-wrap gap-2">
              {ISSUE_PRESETS.map((preset) => (
                <Chip
                  key={preset}
                  label={preset}
                  selected={selectedChip === preset}
                  onClick={() => handleChipClick(preset)}
                />
              ))}
            </div>
          </div>

          {/* Description Textarea with Live Character Counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="issue-description"
                className="text-xs font-bold uppercase tracking-wider"
              >
                Describe what you noticed <span className="text-coral">*</span>
              </label>
              <span
                className={`text-xs font-mono font-bold ${
                  description.length >= 450 ? 'text-coral' : 'text-ink/60'
                }`}
              >
                {description.length} / 500
              </span>
            </div>
            <textarea
              id="issue-description"
              required
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water is trickling very slowly and tastes metallic, or the chiller is warm."
              className="w-full p-3 bg-paper text-ink border-2 border-ink rounded-xl text-xs sm:text-sm shadow-hard-sm focus:border-cobalt focus:ring-0 placeholder:text-ink/40"
            />
          </div>

          {/* Submit CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto text-center px-4 py-2 text-xs font-bold border-2 border-ink rounded-xl bg-paper text-ink hover:bg-sky/60 btn-tactile"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !effectiveWpId || !description.trim()}
              className="w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold border-2 border-ink rounded-xl bg-coral text-white shadow-hard hover:-translate-y-0.5 btn-tactile cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Issue Report'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportPage;
