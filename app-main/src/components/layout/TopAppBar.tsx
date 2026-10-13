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
import { User } from '../../types/nursery';

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

  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'متأخرات مصروفات شهر أكتوبر',
      desc: 'يوجد 7 أطفال لم يسددوا رسوم الشهر بعد، مطلوب المتابعة مع أولياء الأمور.',
      time: 'منذ 30 دقيقة',
    },
    {
      id: 2,
      type: 'info',
      title: 'عيد ميلاد اليوم 🎉',
      desc: 'يصادف اليوم عيد ميلاد الطفل يوسف تامر (فصل العصافير) - إتمام 4 سنوات.',
      time: 'منذ ساعتين',
    },
    {
      id: 3,
      type: 'alert',
      title: 'تنبيه غياب متكرر',
      desc: 'الطفلة جودي أحمد غائبة لليوم الثالث على التوالي بعذر مرضي.',
      time: 'اليوم 09:00 ص',
    },
  ];

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

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 relative"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div 
              className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-right"
              onClick={() => setNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">إشعارات الحضانة</span>
                <span className="text-[11px] text-blue-600 font-medium">3 تنبيهات جديدة</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
