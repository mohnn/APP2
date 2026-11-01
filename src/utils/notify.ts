export type NotifyType = 'success' | 'error';
type Listener = (message: string, type: NotifyType) => void;
let listener: Listener | null = null;

export const registerNotifyHost = (fn: Listener): (() => void) => {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
};

/**
 * رسالة داخل التطبيق (بديل alert الذي قد يُحجب في الصفحات المنشورة).
 * النوع يُستنتج تلقائياً من النص إن لم يُحدد (تم / ✅ / نجاح => أخضر، وإلا أحمر).
 */
export const notify = (message: string, type?: NotifyType): void => {
  const t: NotifyType = type ?? (/✅|🎉|بنجاح|(^|\s)تم(ت)?\s/.test(message) ? 'success' : 'error');
  if (listener) listener(message, t);
  else window.alert(message);
};
