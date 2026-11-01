export type Theme = 'light' | 'dark';

const THEME_KEY = 'mbk_theme_v1';
export const THEME_EVENT = 'mbk-theme-change';

const getStoredTheme = (): Theme | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
};

const systemPrefersDark = (): boolean => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

/** الوضع الحالي: اختيار المستخدم المحفوظ، وإن لم يوجد فوضع الجهاز */
export const getEffectiveTheme = (): Theme => getStoredTheme() ?? (systemPrefersDark() ? 'dark' : 'light');

const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
};

export const setTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_EVENT));
};

export const toggleTheme = (): void => {
  setTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
};

/** يُستدعى مرة واحدة عند تشغيل التطبيق */
export const initTheme = (): void => {
  applyTheme(getEffectiveTheme());
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      // نتبع وضع الجهاز فقط إذا لم يختر المستخدم وضعاً بنفسه
      if (!getStoredTheme()) {
        applyTheme(getEffectiveTheme());
        window.dispatchEvent(new Event(THEME_EVENT));
      }
    });
  } catch {
    /* ignore */
  }
};
