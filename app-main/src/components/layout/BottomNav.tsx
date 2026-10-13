import React from 'react';
import { 
  Home, 
  Users, 
  QrCode, 
  Wallet, 
  Menu 
} from 'lucide-react';

export type MainTab = 'dashboard' | 'children' | 'attendance' | 'finance' | 'more';

interface BottomNavProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  attendanceBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  attendanceBadge,
}) => {
  const tabs: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: Home },
    { id: 'children', label: 'الأطفال', icon: Users },
    { id: 'attendance', label: 'الحضور', icon: QrCode },
    { id: 'finance', label: 'المالية', icon: Wallet },
    { id: 'more', label: 'المزيد', icon: Menu },
  ];

  return (
    <nav className="h-16 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center px-1 z-40 shrink-0 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[48px] flex flex-col items-center justify-center relative transition-all active:scale-95 ${
              isActive
                ? 'text-blue-700 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors relative ${isActive ? 'bg-blue-50 dark:bg-blue-950/60' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              
              {tab.id === 'attendance' && attendanceBadge && attendanceBadge > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                  {attendanceBadge}
                </span>
              ) : null}
            </div>

            <span className="text-[11px] leading-none mt-1 tracking-tight">
              {tab.label}
            </span>

            {isActive && (
              <span className="absolute bottom-1 w-1.5 h-1.5 bg-blue-700 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
