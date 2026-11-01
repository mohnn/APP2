import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { THEME_EVENT, getEffectiveTheme, toggleTheme } from '../../utils/theme';

/** زر التبديل بين الوضع الليلي ووضع النهار */
export const ThemeToggleButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setThemeState] = useState(getEffectiveTheme());

  useEffect(() => {
    const sync = () => setThemeState(getEffectiveTheme());
    window.addEventListener(THEME_EVENT, sync);
    return () => window.removeEventListener(THEME_EVENT, sync);
  }, []);

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 ${className}`}
      title={isDark ? 'التبديل إلى وضع النهار' : 'التبديل إلى الوضع الليلي'}
      aria-label={isDark ? 'وضع النهار' : 'الوضع الليلي'}
    >
      {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
    </button>
  );
};
