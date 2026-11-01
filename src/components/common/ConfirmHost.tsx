import React, { useEffect, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { ConfirmOptions, registerConfirmHost } from '../../utils/confirmDialog';

interface Pending {
  opts: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

/** يعرض نافذة التأكيد. يوضع مرة واحدة في جذر التطبيق. */
export const ConfirmHost: React.FC = () => {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(
    () =>
      registerConfirmHost((opts, resolve) => {
        setPending(prev => {
          prev?.resolve(false); // طلب سابق غير مكتمل يُعتبر إلغاء
          return { opts, resolve };
        });
      }),
    []
  );

  if (!pending) return null;
  const { opts } = pending;
  const close = (ok: boolean) => {
    pending.resolve(ok);
    setPending(null);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={() => close(false)}
      dir="rtl"
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-right"
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {opts.danger ? <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" /> : <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />}
          <span>{opts.title || (opts.danger ? 'تأكيد الإجراء' : 'تأكيد')}</span>
        </div>
        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">{opts.message}</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => close(false)}
            className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            {opts.cancelText || 'إلغاء'}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={`py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition-colors ${
              opts.danger ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-700 hover:bg-blue-600'
            }`}
          >
            {opts.confirmText || 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
};
