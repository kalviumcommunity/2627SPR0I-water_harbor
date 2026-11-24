import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Premium Floating Toast:
 * - Subtle elevation shadow
 * - Clean status icon
 * - Unobtrusive dismiss action
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
      border: 'border-[#C6E7CF]',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F8A57]" />,
      badge: 'bg-[#EBF6EE]',
    },
    error: {
      border: 'border-[#F8C9C9]',
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-[#D94B4B]" />,
      badge: 'bg-[#FDF2F2]',
    },
    info: {
      border: 'border-[#DFE6F0]',
      icon: <Info className="w-4 h-4 shrink-0 text-[#102454]" />,
      badge: 'bg-[#EDF2F9]',
    },
    duplicate: {
      border: 'border-[#FCE1B5]',
      icon: <AlertCircle className="w-4 h-4 shrink-0 text-[#D58A00]" />,
      badge: 'bg-[#FEF7EA]',
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-3 fade-in duration-150"
    >
      <div
        className={`flex items-start gap-3 p-3.5 bg-white rounded-xl border ${config.border} shadow-md text-[#102454]`}
      >
        <div className="shrink-0 pt-0.5">{config.icon}</div>
        <div className="flex-1 text-xs font-medium leading-snug">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-[#8C9CB3] hover:text-[#102454] hover:bg-[#F8FAFC] transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
