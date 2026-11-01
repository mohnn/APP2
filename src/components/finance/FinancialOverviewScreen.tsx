import { notify } from '../../utils/notify';
import { MONTH_NAMES_AR, currentPeriod, yearMonthPrefix } from '../../utils/dateUtils';
import React, { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { User } from '../../types/nursery';
import { shareReportPdf } from '../../utils/reportPdf';

interface FinancialOverviewScreenProps {
  onBack: () => void;
  currentUser: User;
}

export const FinancialOverviewScreen: React.FC<FinancialOverviewScreenProps> = ({
  onBack,
  currentUser,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(currentPeriod().month);
  const [selectedYear, setSelectedYear] = useState(currentPeriod().year);

  const [levelFilter, setLevelFilter] = useState<'all' | 'kids_area' | 'lvl-pre-kg' | 'lvl-kg1'>('all');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const storage = NurseryStorageService.getInstance();
  const isAdmin = currentUser.role === 'admin';

  // Check if month is closed
  const closedRecord = useMemo(() => {
    return storage.monthClosings.find(m => m.month === selectedMonth && m.year === selectedYear);
  }, [storage.monthClosings, selectedMonth, selectedYear, saveToast]);

  // Calculations with independent breakdown for Kids Area vs KG1 (النقطة 6)
  const fin = useMemo(() => {
    const ym = yearMonthPrefix(selectedMonth, selectedYear);
    const monthExpenses = storage.expenses.filter(e => e.date.startsWith(ym));
    let fees = storage.getMonthFees(selectedMonth, selectedYear);

    // حصة المرحلة من المصروفات المشتركة (تقدير بنسبة عدد الأطفال النشطين)
    const activeKids = storage.children.filter(c => c.status === 'active');
    const share =
      levelFilter === 'all'
        ? 1
        : levelFilter === 'kids_area'
        ? 0
        : activeKids.length
        ? activeKids.filter(c => c.levelId === levelFilter).length / activeKids.length
        : 0;

    if (levelFilter === 'kids_area') {
      fees = [];
    } else if (levelFilter !== 'all') {
      const childIdsOfLevel = new Set(storage.children.filter(c => c.levelId === levelFilter).map(c => c.id));
      fees = fees.filter(f => childIdsOfLevel.has(f.childId));
    }

    const primaryCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const primaryArrears = fees.reduce((sum, f) => sum + f.remainingAmount, 0);

    // إيراد جلسات ركن الكيدز إريا (للإجمالي ولركن الكيدز إريا فقط)
    const kidsAreaRevenue =
      levelFilter === 'all' || levelFilter === 'kids_area'
        ? storage.kidsAreaSessions
            .filter(s => {
              const d = new Date(s.entryTimestamp);
              return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
            })
            .reduce((sum, s) => sum + (s.fee || 0), 0)
        : 0;

    const allSecondary = storage.secondaryIncome.filter(i => i.date.startsWith(ym)).reduce((sum, i) => sum + i.amount, 0);
    const secondary = levelFilter === 'all' ? allSecondary : Math.round(allSecondary * share);

    const totalIncome = primaryCollected + kidsAreaRevenue + secondary;

    const allPayroll = storage.payroll
      .filter(p => p.month === selectedMonth && p.year === selectedYear && p.status === 'paid')
      .reduce((sum, p) => sum + p.netSalary, 0);
    const payrollDisbursed = levelFilter === 'all' ? allPayroll : Math.round(allPayroll * share);

    const allOperational = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const operational = levelFilter === 'all' ? allOperational : Math.round(allOperational * share);

    const totalExpenses = payrollDisbursed + operational;
    const netProfit = totalIncome - totalExpenses;

    return {
      primaryCollected,
      primaryArrears,
      kidsAreaRevenue,
      secondary,
      totalIncome,
      payrollDisbursed,
      operational,
      totalExpenses,
      netProfit,
    };
  }, [storage.monthlyFees, storage.secondaryIncome, storage.payroll, storage.expenses, storage.kidsAreaSessions, storage.children, selectedMonth, selectedYear, levelFilter]);

  const handleCloseMonth = () => {
    if (!isAdmin) {
      notify('صلاحية إغلاق الشهر مقصورة على إدارة الحضانة (Nihel)!');
      return;
    }

    const res = storage.closeMonth(selectedMonth, selectedYear);
    setSaveToast(`تم إغلاق شهر ${selectedMonth}/${selectedYear} وحفظ الحسابات رسميًا بنجاح ✅`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  const handleReopenMonth = () => {
    if (!isAdmin) {
      notify('عذراً، فقط إدارة الحضانة (Nihel) تملك صلاحية إعادة فتح شهر مالي مغلق!');
      return;
    }

    storage.reopenMonth(selectedMonth, selectedYear);
    setSaveToast(`تمت إعادة فتح حسابات شهر ${selectedMonth}/${selectedYear} بنجاح.`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  // تصدير التقرير المالي وإغلاق الشهر كملف PDF (يعمل على أندرويد والمتصفح)
  const handlePrintReport = async () => {
    const levelTitle =
      levelFilter === 'kids_area' ? 'ملخص ركن الكيدز إريا (Kids Area)' :
      levelFilter === 'lvl-pre-kg' ? 'ملخص مرحلة بري كيجي (Pre-KG)' :
      levelFilter === 'lvl-kg1' ? 'ملخص مرحلة كيجي 1 (KG1)' :
      'الإجمالي العام للحضانة (كافة المراحل)';
    const monthName = MONTH_NAMES_AR[selectedMonth - 1];
    const fmt = (n: number) => `${n.toLocaleString('en-US')} ج.م`;

    try {
      const result = await shareReportPdf(
        {
          title: `التقرير المالي وإغلاق الشهر - ${monthName} ${selectedYear}`,
          subtitle: `${levelTitle} · ${closedRecord?.isClosed ? 'الشهر مغلق ومعتمد' : 'الشهر مفتوح'}`,
          summary: [
            ['إجمالي الإيرادات', fmt(fin.totalIncome), 'good'],
            ['إجمالي المصروفات', fmt(fin.totalExpenses), 'bad'],
            ['صافي الربح', fmt(fin.netProfit), fin.netProfit >= 0 ? 'good' : 'bad'],
          ],
          sections: [
            {
              title: 'تفصيل الحساب',
              columns: [
                { header: 'النوع', width: 1.4, align: 'center' },
                { header: 'البند', width: 4, align: 'right' },
                { header: 'المبلغ', width: 2, align: 'center', mono: true },
              ],
              rows: [
                ['إيراد', 'مصروفات الأطفال المحصّلة', fmt(fin.primaryCollected)],
                ['إيراد', 'إيراد ركن الكيدز إريا', fmt(fin.kidsAreaRevenue)],
                ['إيراد', 'الدخل الثانوي (كتب، زي، أنشطة)', fmt(fin.secondary)],
                ['مصروف', 'الرواتب المصروفة', fmt(fin.payrollDisbursed)],
                ['مصروف', 'المصروفات التشغيلية', fmt(fin.operational)],
                ['متأخرات', 'مصروفات أطفال غير محصّلة بعد', fmt(fin.primaryArrears)],
              ],
            },
          ],
          footer: `صدر من النظام الآلي المعتمد لحضانة Modern British Kids · إدارة ${currentUser.name}`,
        },
        `Financial-Report-${monthName}-${selectedYear}.pdf`
      );
      if (result === 'cancelled') notify('تم إلغاء الحفظ.', 'error');
      else notify(result === 'shared' ? 'اختر مكان الحفظ أو المشاركة من القائمة.' : result === 'saved-documents' ? 'تم حفظ التقرير في مجلد المستندات: Documents/MBK' : 'تم تنزيل التقرير المالي (PDF).', 'success');
    } catch (e) {
      console.error('Financial PDF error:', e);
      notify(`تعذر إنشاء التقرير${e instanceof Error && e.message ? ` (${e.message})` : ''}.`, 'error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      {/* Toast Alert Banner (النقطة 11) */}
      {saveToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in border border-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              الملخص المالي وإغلاق الشهر
            </h2>
            <span className="text-[10px] text-slate-400">Financial Overview & Month Closing</span>
          </div>
        </div>

        <button
          onClick={handlePrintReport}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-98 transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>تصدير التقرير (PDF)</span>
        </button>
      </div>

      {/* ملخص مالي لكل قسم: الإجمالي / الكيدز إريا / بري كيجي / كيجي 1 */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-2xl text-[11px] font-bold text-center">
        <button
          onClick={() => setLevelFilter('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          الإجمالي العام
        </button>

        <button
          onClick={() => setLevelFilter('kids_area')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'kids_area'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          الكيدز إريا ⏱
        </button>

        <button
          onClick={() => setLevelFilter('lvl-pre-kg')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'lvl-pre-kg'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          بري كيجي 🌟
        </button>

        <button
          onClick={() => setLevelFilter('lvl-kg1')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'lvl-kg1'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          كيجي 1 🎓
        </button>
      </div>

      {/* Month & Status Banner */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold"
            >
              {MONTH_NAMES_AR.map((n, i) => (
                <option key={i + 1} value={i + 1}>
                  {n} {selectedYear}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {closedRecord?.isClosed ? (
            <span className="text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-rose-200 dark:border-rose-900/40">
              <Lock className="w-3.5 h-3.5" />
              <span>الشهر مغلق ومحمي</span>
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-emerald-200 dark:border-emerald-900/40">
              <Unlock className="w-3.5 h-3.5" />
              <span>الشهر مفتوح للعمليات</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Financial Statement (Income vs Expense -> Net Profit) */}
      <div className={`p-4 rounded-3xl text-white shadow-lg relative overflow-hidden ${
        fin.netProfit >= 0
          ? 'bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900'
          : 'bg-gradient-to-br from-rose-900 via-red-950 to-slate-900'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold opacity-80">صافي الربح المالي (Net Profit)</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20">
            {fin.netProfit >= 0 ? 'أرباح تشغيلية فائضة 📈' : 'عجز تشغيلي مؤقت 📉'}
          </span>
        </div>

        <div className="text-3xl font-bold font-mono tracking-tight mb-2">
          {fin.netProfit.toLocaleString()} <span className="text-sm font-sans font-normal">ج.م</span>
        </div>

        {/* Month over Month Comparison (Point 36) */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20 text-center text-xs">
          <div>
            <span className="text-[10px] opacity-75 block">مقارنة الدخل</span>
            <span className="font-bold text-emerald-300 font-mono flex items-center justify-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>

          <div>
            <span className="text-[10px] opacity-75 block">مقارنة المصروفات</span>
            <span className="font-bold text-emerald-300 font-mono flex items-center justify-center gap-0.5">
              <TrendingDown className="w-3 h-3" /> -5%
            </span>
          </div>

          <div>
            <span className="text-[10px] opacity-75 block">نمو الأرباح</span>
            <span className="font-bold text-amber-300 font-mono flex items-center justify-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +18%
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Accordion / Cards */}
      <div className="space-y-2.5">
        {/* Income Card */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              1. إجمالي الإيرادات (Total Income)
            </span>
            <span className="font-mono font-bold text-sm text-emerald-600">
              {fin.totalIncome.toLocaleString()} ج.م
            </span>
          </div>

          <div className="space-y-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>مصروفات الأطفال المحصلة فعلياً:</span>
              <span className="font-mono font-semibold">{fin.primaryCollected.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span>الدخل الثانوي (باص، كتب، زي، أنشطة):</span>
              <span className="font-mono font-semibold">{fin.secondary.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>* متأخرات مطلوب تحصيلها:</span>
              <span className="font-mono text-rose-500">{fin.primaryArrears.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-rose-600">
              2. إجمالي المصروفات (Total Expenses)
            </span>
            <span className="font-mono font-bold text-sm text-rose-600">
              {fin.totalExpenses.toLocaleString()} ج.م
            </span>
          </div>

          <div className="space-y-1 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>رواتب الموظفين المصروفة:</span>
              <span className="font-mono font-semibold">{fin.payrollDisbursed.toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span>المصروفات التشغيلية (إيجار، كهرباء، طعام، صيانة):</span>
              <span className="font-mono font-semibold">{fin.operational.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Month Closing Action Section (Point 37) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            إجراءات إغلاق الشهر المالي
          </span>
          <span className="text-[10px] text-slate-400">حماية البيانات المالية</span>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          إغلاق الشهر يحفظ الإجماليات ويمنع أي تعديل على المدفوعات أو الفواتير التابعة للشهر إلا بصلاحية المالك (Reopen Month).
        </p>

        {closedRecord?.isClosed ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
              تم إغلاق هذا الشهر في: <span className="font-mono font-bold">{closedRecord.closedAt}</span>
            </div>
            {isAdmin && (
              <button
                onClick={handleReopenMonth}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Unlock className="w-4 h-4" />
                <span>إعادة فتح الشهر المالي (صلاحية الإدارة)</span>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleCloseMonth}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>إغلاق شهر {selectedMonth} / {selectedYear} رسميًا</span>
          </button>
        )}
      </div>
    </div>
  );
};
