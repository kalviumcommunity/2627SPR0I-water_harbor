import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Clean Floating Toast Notification:
 * - Crisp white card with subtle border and soft elevation shadow
 * - Color-coded status icons
 * - Accessible dismiss button
 */
export function Toast({ message, type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const typeConfig = {
    success: {
      border: 'border-[#D2EDD9]',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2F8A57]" />,
      badge: 'bg-[#EBF6EE] text-[#2F8A57]',
    },
    error: {
      border: 'border-[#F9D3D3]',
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-[#D94B4B]" />,
      badge: 'bg-[#FDF2F2] text-[#D94B4B]',
    },
    info: {
      border: 'border-[#DFE6F0]',
      icon: <Info className="w-5 h-5 shrink-0 text-[#102454]" />,
      badge: 'bg-[#EDF2F9] text-[#102454]',
    },
    duplicate: {
      border: 'border-[#FCE7C5]',
      icon: <Info className="w-5 h-5 shrink-0 text-[#D58A00]" />,
      badge: 'bg-[#FEF7EA] text-[#D58A00]',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-200"
    >
      <div
        className={`flex items-start gap-3 p-4 bg-white rounded-xl border ${config.border} shadow-lg text-[#102454]`}
      >
        <div className="shrink-0 pt-0.5">{config.icon}</div>
        <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[#71809B] hover:text-[#102454] hover:bg-[#F3F6FC] transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
