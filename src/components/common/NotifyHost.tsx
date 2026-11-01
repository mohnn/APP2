import React, { useEffect, useState } from 'react';
import { Toast } from './Toast';
import { NotifyType, registerNotifyHost } from '../../utils/notify';

/** يعرض رسائل notify() وأخطاء التخزين. يوضع مرة واحدة في جذر التطبيق. */
export const NotifyHost: React.FC = () => {
  const [msg, setMsg] = useState<{ text: string; type: NotifyType } | null>(null);

  useEffect(() => registerNotifyHost((text, type) => setMsg({ text, type })), []);

  // فشل حفظ البيانات (غالباً مساحة التخزين ممتلئة)
  useEffect(() => {
    let last = 0;
    const onError = () => {
      if (Date.now() - last < 8000) return;
      last = Date.now();
      setMsg({ text: '⚠️ تعذر حفظ آخر تغيير: مساحة التخزين على الجهاز ممتلئة. احذف بعض الصور أو الملفات الكبيرة ثم حاول مجدداً.', type: 'error' });
    };
    window.addEventListener('mbk-storage-error', onError);
    return () => window.removeEventListener('mbk-storage-error', onError);
  }, []);

  return <Toast message={msg?.text ?? null} type={msg?.type ?? 'success'} onClose={() => setMsg(null)} duration={6000} />;
};
