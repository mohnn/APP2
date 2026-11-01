import React from 'react';
import { LayoutDashboard, Users, CalendarCheck, Wallet, Menu } from 'lucide-react';

export type MainTab = 'dashboard' | 'children' | 'attendance' | 'finance' | 'more';

const TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'children', label: 'الأطفال', icon: Users },
  { id: 'attendance', label: 'الحضور', icon: CalendarCheck },
  { id: 'finance', label: 'الحسابات', icon: Wallet },
  { id: 'more', label: 'المزيد', icon: Menu },
];

export const BottomNav = ({ activeTab, onTabChange }: { activeTab: MainTab; onTabChange: (t: MainTab) => void }) => (
  <nav className="absolute bottom-0 inset-x-0 z-30 flex bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
    {TABS.map(({ id, label, icon: Icon }) => (
      <button
        key={id}
        onClick={() => onTabChange(id)}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${
          activeTab === id ? 'text-brand-primary dark:text-sky-400' : 'text-slate-400'
        }`}
      >
        <Icon size={20} />
        {label}
      </button>
    ))}
  </nav>
);
