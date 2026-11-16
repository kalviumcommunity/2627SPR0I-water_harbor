import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * Tactile sticker-style Toast notification.
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
      bg: 'bg-mint text-ink',
      icon: <CheckCircle2 className="w-5 h-5 shrink-0 text-ink" />,
    },
    error: {
      bg: 'bg-coral text-white',
      icon: <AlertCircle className="w-5 h-5 shrink-0 text-white" />,
    },
    info: {
      bg: 'bg-sky text-ink',
      icon: <Info className="w-5 h-5 shrink-0 text-ink" />,
    },
    duplicate: {
      bg: 'bg-sun text-ink',
      icon: <Info className="w-5 h-5 shrink-0 text-ink" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border-ink-3 shadow-hard-lg ${config.bg}`}
      >
        {config.icon}
        <div className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
          {message}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md border border-ink/40 hover:bg-ink/10 cursor-pointer"
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
