import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowLeft, Send, AlertTriangle, Info, Clock, Building2, Camera, X } from 'lucide-react';
import { useApp } from '../context/useApp';
import Chip from '../components/Chip';
import { formatBackendError } from '../lib/reliability';

const ISSUE_PRESETS = [
  'No water dispensing',
  'Low water pressure',
  'Water leaking or puddle',
  'Warm / not cooling',
  'Strange taste or odor',
  'Filter warning light',
];

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * ReportPage ("/report")
 * Anonymous student issue submission with optional photo upload.
 */
export function ReportPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeWaterPoints, activeReportsMap, addReport, error, loading } = useApp();

  const prefilledWpId = searchParams.get('wp') || '';

  const [selectedWpId, setSelectedWpId] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChip, setSelectedChip] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  const effectiveWpId =
    selectedWpId ||
    prefilledWpId ||
    (activeWaterPoints.length > 0 ? String(activeWaterPoints[0].id) : '');

  const handleChipClick = (preset) => {
    if (selectedChip === preset) {
      setSelectedChip('');
      if (description === preset) setDescription('');
    } else {
      setSelectedChip(preset);
      setDescription(preset);
    }
  };

  const clearPhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      clearPhoto();
      return;
    }
    if (!ALLOWED_PHOTO_MIME.has(file.type)) {
      setFeedback({
        type: 'error',
        message: 'Unsupported image format. Please choose a JPEG, PNG, or WebP photo.',
      });
      clearPhoto();
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFeedback({
        type: 'error',
        message: 'Photo exceeds the 5 MB size limit.',
      });
      clearPhoto();
      return;
    }
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setFeedback(null);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
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
      const res = await addReport(effectiveWpId, description, photoFile);
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
        clearPhoto();
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
          message: formatBackendError(err, 'submit'),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPoint = activeWaterPoints.find((wp) => String(wp.id) === String(effectiveWpId));
  const hasActiveReport = effectiveWpId ? activeReportsMap.has(Number(effectiveWpId)) : false;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* ── Page Hero ───────────────────────────────────────────────────── */}
      <section className="wh-hero-gradient text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#0B1736]">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-[#D6A63C]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Student Helpdesk</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white tracking-tight">
            Report a Water Point Issue
          </h1>

          <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl leading-relaxed">
            Spotted a broken, leaking, or empty dispenser? Submit a notice. No account or sign-in required.
          </p>
        </div>
      </section>

      {/* ── Form Container ──────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6B87] hover:text-[#102454] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Water Points Directory</span>
          </button>
        </div>

        <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-xs p-5 sm:p-7 space-y-5">
          {error && !loading && activeWaterPoints.length === 0 && (
            <div
              role="alert"
              className="p-3.5 rounded-lg border bg-[#FDF2F2] border-[#F8C9C9] text-[#B91C1C] flex items-start gap-2.5 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D94B4B] mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {error}
              </div>
            </div>
          )}

          {feedback && (
            <div
              role="alert"
              className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-[#EBF6EE] border-[#C6E7CF] text-[#15803D]'
                  : feedback.type === 'duplicate'
                  ? 'bg-[#FEF7EA] border-[#FCE1B5] text-[#D58A00]'
                  : 'bg-[#FDF2F2] border-[#F8C9C9] text-[#B91C1C]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F8A57] mt-0.5" />
              ) : feedback.type === 'duplicate' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#D58A00] mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D94B4B] mt-0.5" />
              )}
              <div className="flex-1 font-medium leading-relaxed">
                {feedback.message}
                {feedback.type === 'success' && (
                  <div className="mt-1.5">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1 font-semibold text-[#102454] hover:underline"
                    >
                      <span>Return to Directory →</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Select Water Point */}
            <div className="space-y-1.5">
              <label
                htmlFor="waterpoint-select"
                className="block text-xs font-semibold uppercase tracking-wider text-[#102454]"
              >
                1. Select Water Point <span className="text-[#D94B4B]">*</span>
              </label>

              <select
                id="waterpoint-select"
                value={effectiveWpId}
                onChange={(e) => {
                  setSelectedWpId(e.target.value);
                  setFeedback(null);
                }}
                className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs sm:text-sm font-medium focus:border-[#102454] focus:ring-1 focus:ring-[#102454] cursor-pointer"
                disabled={isSubmitting}
              >
                {activeWaterPoints.length === 0 ? (
                  <option value="">No active water points available</option>
                ) : (
                  activeWaterPoints.map((wp) => (
                    <option key={wp.id} value={wp.id}>
                      {wp.name} — {wp.building ? `${wp.building} (${wp.location})` : wp.location}
                    </option>
                  ))
                )}
              </select>

              {selectedPoint && (
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#5A6B87] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#102454] shrink-0" />
                    <span>
                      <strong>{selectedPoint.name}</strong> &bull; {selectedPoint.location}
                    </span>
                  </div>

                  {hasActiveReport && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDF2F2] text-[#D94B4B] border border-[#F8C9C9] shrink-0">
                      Active Notice Exists
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Common Issue Chips */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#102454]">
                2. Common Issue (Optional)
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="issue-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#102454]"
                >
                  3. Description <span className="text-[#D94B4B]">*</span>
                </label>
                <span className="text-[11px] text-[#8C9CB3]">
                  {description.length}/500
                </span>
              </div>

              <textarea
                id="issue-description"
                rows={3}
                maxLength={500}
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (selectedChip && e.target.value !== selectedChip) {
                    setSelectedChip('');
                  }
                }}
                placeholder="Describe what you observed (e.g. Dispenser tap leaking continuously, pressure button jammed, or filter warning light blinking)."
                className="w-full px-3 py-2 bg-white text-[#102454] border border-[#DFE6F0] rounded-lg text-xs sm:text-sm focus:border-[#102454] focus:ring-1 focus:ring-[#102454] placeholder:text-[#8C9CB3] resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Step 4: Optional Photo Upload */}
            <div className="space-y-2">
              <label
                htmlFor="issue-photo"
                className="block text-xs font-semibold uppercase tracking-wider text-[#102454]"
              >
                4. Attach Photo (Optional)
              </label>

              {!photoPreviewUrl ? (
                <label
                  htmlFor="issue-photo"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#CBD5E1] hover:border-[#102454] bg-[#F8FAFC] hover:bg-[#EDF2F9] rounded-lg text-xs text-[#5A6B87] cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4 text-[#102454]" />
                  <span>Upload a JPEG, PNG, or WebP image (max 5 MB)</span>
                </label>
              ) : (
                <div className="relative rounded-lg border border-[#DFE6F0] overflow-hidden bg-[#F8FAFC]">
                  <img
                    src={photoPreviewUrl}
                    alt="Selected issue preview"
                    className="w-full max-h-56 object-contain bg-white"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={isSubmitting}
                    aria-label="Remove attached photo"
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/95 hover:bg-[#FDF2F2] text-[#B91C1C] border border-[#F8C9C9] text-[11px] font-semibold shadow-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="issue-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={isSubmitting}
                className="sr-only"
              />
              <p className="text-[11px] text-[#5A6B87] leading-relaxed">
                Optional: only authenticated facilities staff can view submitted photos (they are not shown publicly). Location/EXIF metadata is stripped automatically &mdash; please avoid including faces or personal information.
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1 text-[#8C9CB3]">
                <Clock className="w-3.5 h-3.5" />
                <span>Notice publishes immediately to the campus directory</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !effectiveWpId || !description.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-lg bg-[#102454] hover:bg-[#162F6B] text-white font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#D6A63C]" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Issue Report'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-[#DFE6F0] rounded-xl p-4 shadow-xs flex items-start gap-2.5 text-xs text-[#5A6B87] leading-relaxed">
          <Info className="w-4 h-4 text-[#102454] shrink-0 mt-0.5" />
          <p>
            When submitted, the water point immediately updates to &ldquo;Reported unavailable&rdquo; on the student board. Facilities staff are notified to dispatch maintenance and record completion notes once tested.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReportPage;
