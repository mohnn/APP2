import { NotificationBell } from '../notifications/NotificationBell';
import { RECIPIENT_ADMIN } from '../../services/notifications';
import { NOTIFICATIONS_ENABLED } from '../../config/features';
import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  QrCode, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import { User } from '../../types/nursery';
import { NurseryStorageService } from '../../services/storage';
import { MONTH_NAMES_AR, currentPeriod } from '../../utils/dateUtils';

interface TopAppBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  currentUser: User;
  onOpenSearch: () => void;
  onOpenQrScanner: () => void;
  onLogout?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  showBack,
  onBack,
  currentUser,
  onOpenSearch,
  onOpenQrScanner,
  onLogout,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // تنبيهات حقيقية محسوبة من بيانات الحضانة (وليست أمثلة ثابتة)
  const storage = NurseryStorageService.getInstance();
  const notifications: { id: string; title: string; desc: string; time: string }[] = [];
  {
    const { month } = currentPeriod();
    const unpaid = storage.getMonthFees().filter(f => f.remainingAmount > 0);
    if (unpaid.length > 0) {
      const total = unpaid.reduce((n, f) => n + f.remainingAmount, 0);
      notifications.push({
        id: 'arrears',
        title: `متأخرات مصروفات شهر ${MONTH_NAMES_AR[month - 1]}`,
        desc: `يوجد ${unpaid.length} ${unpaid.length === 1 ? 'طفل' : 'أطفال'} لم يسددوا رسوم الشهر بعد (إجمالي ${total.toLocaleString()} ج.م).`,
        time: 'الآن',
      });
    }

    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const birthdays = storage.children.filter(c => c.status === 'active' && (c.birthDate || '').slice(5) === md);
    if (birthdays.length > 0) {
      notifications.push({
        id: 'birthdays',
        title: 'عيد ميلاد اليوم 🎉',
        desc: birthdays
          .map(c => `${c.fullName} (إتمام ${now.getFullYear() - Number((c.birthDate || '').slice(0, 4))} سنوات)`)
          .join('، '),
        time: 'اليوم',
      });
    }

    const absent = storage.getAttendanceSummary().absent;
    if (absent > 0) {
      notifications.push({
        id: 'absent',
        title: 'غياب اليوم',
        desc: `${absent} ${absent === 1 ? 'طفل لم يُسجَّل' : 'أطفال لم يُسجَّل'} حضورهم اليوم (لم يمسح ولي الأمر QR قبل 08:30 ص).`,
        time: 'اليوم',
      });
    }
  }

  return (
    <header className="h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3.5 flex items-center justify-between z-30 shrink-0 shadow-sm relative">
      {/* Left: Back button or Brand */}
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : null}

        <div className="flex items-center gap-2">
          <BrandLogo size="sm" iconOnly={Boolean(title)} showSubtitle={false} />
          {title && (
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
              {title}
            </h1>
          )}
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5">
        {/* الوضع الليلي / وضع النهار */}
        <ThemeToggleButton />

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          title="بحث شامل (طفل، ولي أمر، موظف، إيصال)"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* Quick QR Scanner Button */}
        <button
          onClick={onOpenQrScanner}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors active:scale-95 border border-blue-200 dark:border-blue-800/40"
          title="مسح كود QR لتسجيل الحضور"
        >
          <QrCode className="w-4.5 h-4.5" />
        </button>

        {NOTIFICATIONS_ENABLED && <NotificationBell user={currentUser} recipient={RECIPIENT_ADMIN} />}

        {/* User Mini Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-900 font-bold text-xs shadow-xs ring-2 ring-white dark:ring-slate-800 active:scale-95 transition-transform"
            title={`${currentUser.name} - ${currentUser.roleLabelAr}`}
          >
            {currentUser.avatar}
          </button>

          {userMenuOpen && (
            <div 
              className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 text-right animate-fade-in"
              onClick={() => setUserMenuOpen(false)}
            >
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{currentUser.roleLabelAr}</div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors"
                >
                  <span>تسجيل الخروج</span>
                  <span className="text-sm">🚪</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
