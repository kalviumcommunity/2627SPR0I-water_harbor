import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowLeft, Send, AlertTriangle, Info, Clock, Building2 } from 'lucide-react';
import { useApp } from '../context/useApp';
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
 * Anonymous student reporting interface redesigned with the Water Harbour design system:
 * - Page-specific navy hero
 * - Clean white form card with subtle borders & soft elevation
 * - Clear form sections (Point selection, Issue chips, Description textarea)
 * - Friendly duplicate handling (409) & optimistic feedback
 * - Supporting guidance panel
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

  // Handle clicking issue presets chips
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
        message: 'Please select a water point location.',
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
          message: res.message || 'Someone already reported this water point. Our facilities team is on it!',
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Thank you! Your issue report has been logged and published on the campus directory.',
        });
        setDescription('');
        setSelectedChip('');
      }
    } catch (err) {
      if (err.isDuplicate || err.response?.status === 409) {
        setFeedback({
          type: 'duplicate',
          message: err.response?.data?.detail || 'Someone already reported this water point. Our facilities team is on it!',
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
    <div className="space-y-8 pb-16">
      {/* ── Page Hero Section ───────────────────────────────────────────── */}
      <section className="wh-hero-gradient text-white pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0B1736]">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider text-[#D6A63C]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Student Helpdesk</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Report a Water Point Issue
          </h1>

          <p className="text-sm sm:text-base text-[#CBD5E1] max-w-xl font-normal leading-relaxed">
            Spotted a broken, leaking, or warm dispenser? Submit a quick notice. No student account or sign-in required.
          </p>
        </div>
      </section>

      {/* ── Main Reporting Container ───────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Back Link */}
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71809B] hover:text-[#102454] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Water Points Directory</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#DFE6F0] rounded-2xl shadow-xs p-6 sm:p-8 space-y-6">
          {/* Feedback Alerts */}
          {feedback && (
            <div
              role="alert"
              className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-[#EBF6EE] border-[#D2EDD9] text-[#2F8A57]'
                  : feedback.type === 'duplicate'
                  ? 'bg-[#FEF7EA] border-[#FCE7C5] text-[#D58A00]'
                  : 'bg-[#FDF2F2] border-[#F9D3D3] text-[#D94B4B]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2F8A57] mt-0.5" />
              ) : feedback.type === 'duplicate' ? (
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#D58A00] mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-[#D94B4B] mt-0.5" />
              )}
              <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
                {feedback.message}
                {feedback.type === 'success' && (
                  <div className="mt-2">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#102454] hover:underline"
                    >
                      <span>Return to Directory →</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Water Point */}
            <div className="space-y-2">
              <label
                htmlFor="waterpoint-select"
                className="block text-xs font-bold uppercase tracking-wider text-[#102454]"
              >
                1. Select Campus Water Point <span className="text-[#D94B4B]">*</span>
              </label>

              <select
                id="waterpoint-select"
                value={effectiveWpId}
                onChange={(e) => {
                  setSelectedWpId(e.target.value);
                  setFeedback(null);
                }}
                className="w-full px-3.5 py-2.5 bg-white text-[#102454] border border-[#DFE6F0] rounded-xl text-xs sm:text-sm font-semibold focus:border-[#102454] focus:ring-1 focus:ring-[#102454] cursor-pointer"
                disabled={isSubmitting}
              >
                {waterPoints.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.name} — {wp.building ? `${wp.building} (${wp.location})` : wp.location}
                  </option>
                ))}
              </select>

              {/* Selected Point Context Card */}
              {selectedPoint && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#71809B] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#102454] shrink-0" />
                    <span>
                      <strong>{selectedPoint.name}</strong> &bull; {selectedPoint.location}
                    </span>
                  </div>

                  {hasActiveReport && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF2F2] text-[#D94B4B] border border-[#F9D3D3] shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      Active Report Exists
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Common Issue Chips */}
            <div className="space-y-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#102454]">
                2. Quick Select Problem (Optional)
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {ISSUE_PRESETS.map((preset) => (
                  <Chip
                    key={preset}
                    label={preset}
                    selected={selectedChip === preset}
                    onClick={() => handleChipClick(preset)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

            {/* Step 3: Issue Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="issue-description"
                  className="block text-xs font-bold uppercase tracking-wider text-[#102454]"
                >
                  3. Description <span className="text-[#D94B4B]">*</span>
                </label>
                <span className="text-[11px] text-[#94A3B8]">
                  {description.length}/500
                </span>
              </div>

              <textarea
                id="issue-description"
                rows={4}
                maxLength={500}
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (selectedChip && e.target.value !== selectedChip) {
                    setSelectedChip('');
                  }
                }}
                placeholder="Describe the issue in detail (e.g. Dispenser tap leaking continuously, pressure button stuck, or filter warning light blinking)."
                className="w-full px-3.5 py-2.5 bg-white text-[#102454] border border-[#DFE6F0] rounded-xl text-xs sm:text-sm focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#94A3B8] resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 text-xs text-[#71809B]">
                <Clock className="w-3.5 h-3.5" />
                <span>Notice takes effect immediately upon submission</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#102454] hover:bg-[#183375] text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-[#D6A63C]" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Issue Report'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Supporting Guidance Section */}
        <div className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-xs flex items-start gap-3 text-xs text-[#71809B] leading-relaxed">
          <Info className="w-5 h-5 text-[#102454] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[#102454] block">How your report helps campus:</span>
            <p>
              When an issue is submitted, the water point immediately updates to &ldquo;Reported unavailable&rdquo; on the student directory. Facilities staff are notified to dispatch maintenance and record completion notes once tested.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPage;
