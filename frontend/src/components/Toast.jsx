import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function Toast() {
  const { toast, showToast } = useApp();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce-short">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border ${
          isSuccess
            ? 'bg-emerald-900 text-white border-emerald-700'
            : isError
            ? 'bg-rose-900 text-white border-rose-700'
            : 'bg-slate-900 text-white border-slate-700'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed flex-1 font-medium">{toast.message}</div>
        <button
          type="button"
          onClick={() => showToast(null)}
          className="text-white/60 hover:text-white p-0.5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
