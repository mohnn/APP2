/**
 * ============================================================
 *  الاسم السري لفتح دخول الإدارة
 * ============================================================
 *  - أول مرة يفتح فيها أي جهاز التطبيق تظهر شاشة تطلب "الاسم".
 *  - إذا كُتب الاسم أدناه تماماً  => يصبح الجهاز "جهاز إدارة" ويظهر له دخول الإدارة فقط.
 *  - أي اسم آخر                  => يصبح الجهاز "جهاز ولي أمر" ولا يظهر له أي أثر للإدارة.
 *
 *  ⚠️ غيّر القيمة التالية إلى اسم خاص بك قبل بناء التطبيق، واحفظه في مكان آمن.
 *  (لا يهم حالة الأحرف الإنجليزية ولا المسافات الزائدة)
 */
export const ADMIN_ACCESS_NAME = 'Nihel';

/**
 * زر مؤقت على شاشة الدخول يرجّع الجهاز لشاشة الاسم (للتجربة فقط).
 * لإخفائه نهائياً قبل النشر: غيّر القيمة إلى false.
 */
export const SHOW_TEMP_DEVICE_RESET = false;

export type DeviceRole = 'admin' | 'parent';

const DEVICE_ROLE_KEY = 'mbk_device_role_v1';

const normalizeName = (s: string): string =>
  s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const isAdminAccessName = (input: string): boolean =>
  normalizeName(input) === normalizeName(ADMIN_ACCESS_NAME);

export const getDeviceRole = (): DeviceRole | null => {
  try {
    const v = localStorage.getItem(DEVICE_ROLE_KEY);
    return v === 'admin' || v === 'parent' ? v : null;
  } catch {
    return null;
  }
};

export const setDeviceRole = (role: DeviceRole): void => {
  try {
    localStorage.setItem(DEVICE_ROLE_KEY, role);
  } catch {
    /* ignore */
  }
};

export const clearDeviceRole = (): void => {
  try {
    localStorage.removeItem(DEVICE_ROLE_KEY);
  } catch {
    /* ignore */
  }
};
