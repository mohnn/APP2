import { academicYearLabel, localDateStr, MONTH_NAMES_AR, currentPeriod } from '../../utils/dateUtils';
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Wallet, 
  PlusCircle,
  QrCode,
  Sparkles,
  ChevronLeft,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { User } from '../../types/nursery';

interface DashboardScreenProps {
  currentUser: User;
  onNavigateToChildren: () => void;
  onNavigateToAttendance: () => void;
  onNavigateToFinance: () => void;
  onOpenQuickQr: () => void;
  onOpenQuickCollect: () => void;
  onOpenAddChild: () => void;
  onOpenKidsArea?: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'year';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentUser,
  onNavigateToChildren,
  onNavigateToAttendance,
  onNavigateToFinance,
  onOpenQuickQr,
  onOpenQuickCollect,
  onOpenAddChild,
  onOpenKidsArea,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('month');
  const storage = NurseryStorageService.getInstance();

  const stats = useMemo(() => {
    const today = localDateStr();
    const allChildren = storage.children;

    // Attendance stats
    const attSummary = storage.getAttendanceSummary();
    const presentCount = attSummary.present;
    const lateCount = attSummary.late;
    const absentCount = attSummary.absent;
    const leaveCount = attSummary.leave;

    // Dynamic Financial stats by selected period (النقطة 5)
    const finSummary = storage.getFinancialSummary(filterPeriod);

    // ملخص رسوم الشهر الحالي
    const monthFees = storage.getMonthFees();
    const totalRequiredFees = monthFees.reduce((sum, f) => sum + f.totalRequired, 0);
    const totalPaidFees = monthFees.reduce((sum, f) => sum + f.paidAmount, 0);
    const arrearsFees = monthFees.reduce((sum, f) => sum + f.remainingAmount, 0);

    return {
      totalKids: allChildren.length,
      preKgCount: allChildren.filter(c => c.levelId === 'lvl-pre-kg').length,
      kidsAreaActive: storage.kidsAreaSessions.filter(s => s.status === 'active').length,
      kidsAreaToday: storage.kidsAreaSessions.filter(s => localDateStr(new Date(s.entryTimestamp)) === localDateStr()).length,
      kg1Count: allChildren.filter(c => c.levelId === 'lvl-kg1').length,
      presentCount,
      lateCount,
      absentCount,
      leaveCount,
      attendanceRate: Math.round((presentCount / (allChildren.length || 1)) * 100),
      totalPaidFees,
      arrearsFees,
      totalRequiredFees,
      // Period dynamic stats:
      periodIncome: finSummary.totalIncome,
      periodExpenses: finSummary.totalExpenses,
      periodNetProfit: finSummary.netProfit,
      periodLabel: finSummary.periodLabel,
      receiptsCount: finSummary.receiptsCount,
    };
  }, [storage, filterPeriod]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-4 font-sans text-right">
      {/* Welcome Banner Card */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-4 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              حضانة Modern British Kids
            </span>
            <span className="text-[10px] text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">
              العام الدراسي {academicYearLabel()}
            </span>
          </div>

          <h2 className="text-lg font-bold font-display text-white mb-1">
            أهلاً بك، {currentUser.name} (الإدارة) 👋
          </h2>
          <p className="text-xs text-blue-100 max-w-xs leading-relaxed">
            متابعة شاملة لحضور الطلاب الذكي بـ QR، والمصروفات النقدية (كاش)، وكافة عمليات الحضانة.
          </p>

          {/* Quick Action Shortcuts inside Banner */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10">
            <button
              onClick={onOpenQuickQr}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all active:scale-95 shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>بوستر QR</span>
            </button>

            <button
              onClick={onOpenQuickCollect}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all active:scale-95 shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>تحصيل كاش</span>
            </button>

            <button
              onClick={onOpenAddChild}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all active:scale-95 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>تسجيل طالب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Filter Tabs (النقطة 5: تفعيل فلاتر اليوم، الأسبوع، الشهر، السنة) */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            الملخص المالي الفعلي
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            حسابات: {stats.periodLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-xl text-[11px]">
          {(['today', 'week', 'month', 'year'] as PeriodFilter[]).map((period) => {
            const labels = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر', year: 'السنة' };
            const isActive = filterPeriod === period;
            return (
              <button
                key={period}
                onClick={() => setFilterPeriod(period)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {labels[period]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Core Dynamic Financial Cards for the selected period */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 block mb-1">
            الدخل ({filterPeriod === 'today' ? 'اليوم' : filterPeriod === 'week' ? 'الأسبوع' : filterPeriod === 'month' ? 'الشهر' : 'السنة'})
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {stats.periodIncome.toLocaleString()} ج.م
          </div>
          <span className="text-[9px] text-slate-400">نقداً كاش 💵</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 block mb-1">
            المصروفات
          </span>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {stats.periodExpenses.toLocaleString()} ج.م
          </div>
          <span className="text-[9px] text-slate-400">تشغيل وفواتير</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xs bg-blue-50/20">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-1">
            صافي الربح
          </span>
          <div className={`text-sm font-bold font-mono ${stats.periodNetProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600'}`}>
            {stats.periodNetProfit.toLocaleString()} ج.م
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold">محدث لحظياً</span>
        </div>
      </div>

      {/* Attendance KPI Strip */}
      <div 
        onClick={onNavigateToAttendance}
        className="cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                حضور الطلاب اليوم
              </div>
              <div className="text-[10px] text-slate-400">
                مواعيد الدخول: 07:30 - 08:30 ص · الانصراف: 02:00 م
              </div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        {/* 4 Mini Stat Pills */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-xl">
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {stats.presentCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">حاضرون</div>
          </div>

          <div className="bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl">
            <div className="text-base font-bold text-amber-700 dark:text-amber-400 font-mono">
              {stats.lateCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">متأخرون</div>
          </div>

          <div className="bg-rose-50/60 dark:bg-rose-950/30 p-2 rounded-xl">
            <div className="text-base font-bold text-rose-700 dark:text-rose-400 font-mono">
              {stats.absentCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">غائبون</div>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2 rounded-xl">
            <div className="text-base font-bold text-blue-700 dark:text-blue-400 font-mono">
              {stats.leaveCount}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">إجازات</div>
          </div>
        </div>
      </div>

      {/* Registered Students by Level (بري كيجي وكيجي 1) */}
      <div 
        onClick={onNavigateToChildren}
        className="cursor-pointer bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              إجمالي الطلاب المسجلين ({stats.totalKids})
            </span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* الكيدز إريا: يفتح ركن الجلسات (ليس مرحلة تسجيل) */}
          <div
            onClick={(e) => {
              if (onOpenKidsArea) {
                e.stopPropagation();
                onOpenKidsArea();
              }
            }}
            className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">الكيدز إريا ⏱</span>
            <span className="font-mono font-bold text-base text-amber-700 dark:text-amber-300 mt-1 block">
              {stats.kidsAreaActive} <span className="text-[10px] font-sans font-semibold">بالداخل</span>
            </span>
            <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 block">{stats.kidsAreaToday} اليوم · فتح الركن</span>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
            <span className="text-[10px] text-slate-500 block">بري كيجي (3 أرقام)</span>
            <span className="font-mono font-bold text-base text-sky-700 dark:text-sky-300 mt-1 block">
              {stats.preKgCount} <span className="text-[10px] font-sans font-semibold">طالباً</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-[10px] text-slate-500 block">كيجي 1 (4 أرقام)</span>
            <span className="font-mono font-bold text-base text-blue-700 dark:text-blue-300 mt-1 block">
              {stats.kg1Count} <span className="text-[10px] font-sans font-semibold">طالباً</span>
            </span>
          </div>
        </div>
      </div>

      {/* Collection Status Progress Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-slate-800 dark:text-slate-200">
            تحصيل مصروفات {MONTH_NAMES_AR[currentPeriod().month - 1]} (كاش)
          </span>
          <span className="text-blue-600 font-mono">
            {stats.totalPaidFees.toLocaleString()} / {stats.totalRequiredFees.toLocaleString()} ج.م
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round((stats.totalPaidFees / (stats.totalRequiredFees || 1)) * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
          <span className="text-emerald-600 font-medium">
            تم تحصيل {Math.round((stats.totalPaidFees / (stats.totalRequiredFees || 1)) * 100)}% نقداً
          </span>
          <span className="text-rose-500 font-medium">
            متبقي متأخرات: {stats.arrearsFees.toLocaleString()} ج.م
          </span>
        </div>
      </div>
    </div>
  );
};
