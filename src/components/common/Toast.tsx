import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  type?: 'success' | 'error';
  /** مدة الظهور بالمللي ثانية */
  duration?: number;
}

/** رسالة ثابتة أعلى الشاشة (تظهر مهما كان موضع التمرير) وتختفي تلقائياً */
export const Toast: React.FC<ToastProps> = ({ message, onClose, type = 'success', duration = 5000 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;
  const ok = type === 'success';
  return (
    <div
      className="fixed inset-x-3 z-[85] flex justify-center pointer-events-none"
      style={{ top: 'calc(max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px)) + 10px)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto w-full max-w-md px-3.5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-start gap-2 border ${
          ok ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-rose-600 text-white border-rose-400'
        }`}
      >
        {ok ? <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />}
        <span className="flex-1 leading-relaxed">{message}</span>
        <button onClick={onClose} className="p-0.5 rounded-lg hover:bg-black/15 shrink-0" aria-label="إغلاق">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
