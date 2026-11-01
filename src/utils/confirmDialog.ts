export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** أحمر للإجراءات الخطرة (حذف / تفريغ) */
  danger?: boolean;
}

type Opener = (opts: ConfirmOptions, resolve: (ok: boolean) => void) => void;
let opener: Opener | null = null;

/** يربط نافذة التأكيد الموجودة في التطبيق (يستدعيها ConfirmHost) */
export const registerConfirmHost = (fn: Opener): (() => void) => {
  opener = fn;
  return () => {
    if (opener === fn) opener = null;
  };
};

/**
 * نافذة تأكيد داخل التطبيق (بديل confirm الخاص بالمتصفح الذي قد يُحجب
 * داخل الصفحات المنشورة أو بعض المتصفحات المدمجة).
 */
export const askConfirm = (options: ConfirmOptions | string): Promise<boolean> =>
  new Promise(resolve => {
    const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
    if (opener) opener(opts, resolve);
    else resolve(window.confirm(opts.message));
  });
