import React from 'react';
import { 
  Users2, 
  Layers, 
  School, 
  Briefcase, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  PieChart, 
  CalendarCheck, 
  Award, 
  FileText, 
  History, 
  Settings, 
  Code2, 
  X,
  ChevronLeft,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { User } from '../../types/nursery';
import { BrandLogo } from '../common/BrandLogo';

export type SubModuleView = 
  | 'kids_area'
  | 'guardians'
  | 'levels_classes'
  | 'employees'
  | 'payroll'
  | 'advances'
  | 'expenses'
  | 'secondary_income'
  | 'financial_overview'
  | 'daily_reports'
  | 'evaluations'
  | 'reports'
  | 'audit_logs'
  | 'settings'
  | 'code_exporter';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (module: SubModuleView) => void;
  currentUser: User;
  onLogout?: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  currentUser,
  onLogout,
}) => {
  if (!isOpen) return null;

  const menuSections = [
    {
      title: 'ركن الكيدز إريا ومتابعة الأوقات',
      items: [
        { id: 'kids_area' as SubModuleView, label: 'ركن الكيدز إريا (إدارة الوقت والمالية)', icon: Sparkles, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
      ],
    },
    {
      title: 'العمليات التعليمية والتربوية',
      items: [
        { id: 'daily_reports' as SubModuleView, label: 'المتابعة اليومية (طعام/نوم/مزاج)', icon: CalendarCheck, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
        { id: 'evaluations' as SubModuleView, label: 'تقييم الأطفال والمهارات', icon: Award, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
        { id: 'levels_classes' as SubModuleView, label: 'المستويات التعليمية (الكيدز إريا وكيجي 1)', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' },
        { id: 'guardians' as SubModuleView, label: 'أولياء الأمور والمفوضين بالاستلام', icon: Users2, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
      ],
    },
    {
      title: 'الإدارة المالية والمصروفات',
      items: [
        { id: 'financial_overview' as SubModuleView, label: 'الملخص المالي وإغلاق الشهر', icon: PieChart, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
        { id: 'expenses' as SubModuleView, label: 'مصروفات وفواتير الحضانة', icon: Receipt, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' },
        { id: 'secondary_income' as SubModuleView, label: 'الدخل الثانوي (كتب، زي، أنشطة)', icon: TrendingUp, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40' },
      ],
    },
    {
      title: 'الموظفون والرواتب',
      items: [
        { id: 'employees' as SubModuleView, label: 'الموظفون والكادر الإداري', icon: Briefcase, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
        { id: 'payroll' as SubModuleView, label: 'مسير الرواتب الشهرية والبدلات', icon: CreditCard, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/40' },
      ],
    },
    {
      title: 'التقارير والمخرجات',
      items: [
        { id: 'reports' as SubModuleView, label: 'التقارير الشاملة والطباعة الرسمية', icon: FileText, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
      ],
    },
    {
      title: 'النظام والمطورين',
      items: [
        { id: 'audit_logs' as SubModuleView, label: 'سجل العمليات والرقابة (Audit Log)', icon: History, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
        { id: 'settings' as SubModuleView, label: 'إعدادات الحضانة ومواعيد الدوام', icon: Settings, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in font-sans">
      <div 
        className="w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col text-right overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header with Brand Logo */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <BrandLogo size="sm" showSubtitle={true} className="text-white [&_div]:text-white [&_span]:text-amber-300" />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Current User Card (Nihel) */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg">
              {currentUser.avatar}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{currentUser.roleLabelAr}</div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {menuSections.map((sec, idx) => (
            <div key={idx}>
              <div className="text-[11px] font-bold text-slate-400 px-2 mb-1.5">
                {sec.title}
              </div>

              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectModule(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-right group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {item.label}
                        </span>
                      </div>

                      <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
