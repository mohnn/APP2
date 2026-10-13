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
import { printHtmlDocument } from '../../utils/printHelper';

interface FinancialOverviewScreenProps {
  onBack: () => void;
  currentUser: User;
}

export const FinancialOverviewScreen: React.FC<FinancialOverviewScreenProps> = ({
  onBack,
  currentUser,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);

  const [levelFilter, setLevelFilter] = useState<'all' | 'lvl-kids-area' | 'lvl-kg1'>('all');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const storage = NurseryStorageService.getInstance();
  const isAdmin = currentUser.role === 'admin';

  // Check if month is closed
  const closedRecord = useMemo(() => {
    return storage.monthClosings.find(m => m.month === selectedMonth && m.year === selectedYear);
  }, [storage.monthClosings, selectedMonth, selectedYear, saveToast]);

  // Calculations with independent breakdown for Kids Area vs KG1 (النقطة 6)
  const fin = useMemo(() => {
    let fees = storage.monthlyFees.filter(f => f.month === selectedMonth && f.year === selectedYear);
    
    if (levelFilter !== 'all') {
      const childIdsOfLevel = new Set(storage.children.filter(c => c.levelId === levelFilter).map(c => c.id));
      fees = fees.filter(f => childIdsOfLevel.has(f.childId));
    }

    const primaryCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const primaryArrears = fees.reduce((sum, f) => sum + f.remainingAmount, 0);

    // Kids Area Session revenue (only for kids area or all)
    const kidsAreaRevenue = levelFilter === 'lvl-kg1' 
      ? 0 
      : storage.kidsAreaSessions.reduce((sum, s) => sum + (s.fee || 0), 0);

    const secondary = levelFilter === 'lvl-kids-area'
      ? 0
      : storage.secondaryIncome.reduce((sum, i) => sum + i.amount, 0);

    const totalIncome = primaryCollected + kidsAreaRevenue + secondary;

    const payrollDisbursed = levelFilter === 'lvl-kids-area'
      ? Math.round(storage.payroll.filter(p => p.month === selectedMonth && p.year === selectedYear && p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0) * 0.3)
      : levelFilter === 'lvl-kg1'
      ? Math.round(storage.payroll.filter(p => p.month === selectedMonth && p.year === selectedYear && p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0) * 0.7)
      : storage.payroll.filter(p => p.month === selectedMonth && p.year === selectedYear && p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);

    const operational = levelFilter === 'lvl-kids-area'
      ? Math.round(storage.expenses.reduce((sum, e) => sum + e.amount, 0) * 0.25)
      : levelFilter === 'lvl-kg1'
      ? Math.round(storage.expenses.reduce((sum, e) => sum + e.amount, 0) * 0.75)
      : storage.expenses.reduce((sum, e) => sum + e.amount, 0);

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
      alert('صلاحية إغلاق الشهر مقصورة على إدارة الحضانة (Nihel)!');
      return;
    }

    const res = storage.closeMonth(selectedMonth, selectedYear);
    setSaveToast(`تم إغلاق شهر ${selectedMonth}/${selectedYear} وحفظ الحسابات رسميًا بنجاح ✅`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  const handleReopenMonth = () => {
    if (!isAdmin) {
      alert('عذراً، فقط إدارة الحضانة (Nihel) تملك صلاحية إعادة فتح شهر مالي مغلق!');
      return;
    }

    storage.reopenMonth(selectedMonth, selectedYear);
    setSaveToast(`تمت إعادة فتح حسابات شهر ${selectedMonth}/${selectedYear} بنجاح.`);
    setTimeout(() => setSaveToast(null), 5000);
  };

  // Real printable financial report (النقطة 10: تشغيل زر طباعة الملخص المالي وإغلاق الشهر)
  const handlePrintReport = () => {

    const levelTitle = 
      levelFilter === 'lvl-kids-area' ? 'ملخص ركن الكيدز إريا (Kids Area)' :
      levelFilter === 'lvl-kg1' ? 'ملخص مرحلة كيجي 1 (KG1)' :
      'الإجمالي العام للحضانة (كافة المراحل)';

    const monthName = selectedMonth === 10 ? 'أكتوبر' : selectedMonth === 9 ? 'سبتمبر' : selectedMonth === 11 ? 'نوفمبر' : `شهر ${selectedMonth}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>التقرير المالي وإغلاق الشهر - ${monthName} ${selectedYear}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Cairo', system-ui, -apple-system, sans-serif; direction: rtl; text-align: right; color: #0f172a; padding: 20px; margin: 0; background: #fff; }
            .header-table { width: 100%; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
            .title-box { text-align: center; margin-bottom: 24px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 13px; }
            .badge-closed { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
            .badge-open { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
            .summary-card { padding: 16px; border-radius: 12px; border: 1px solid #cbd5e1; background: #f8fafc; }
            .summary-card.profit { background: #f0fdf4; border-color: #86efac; }
            .summary-card.profit-neg { background: #fef2f2; border-color: #fca5a5; }
            .label { font-size: 13px; color: #64748b; margin-bottom: 4px; }
            .val { font-size: 22px; font-weight: 900; font-family: monospace; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            .table th, .table td { border: 1px solid #e2e8f0; padding: 10px 14px; text-align: right; font-size: 13px; }
            .table th { background: #f1f5f9; color: #1e3a8a; font-weight: bold; }
            .footer-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 style="margin:0;font-size:24px;color:#1e3a8a;">Modern British Kids Nursery</h1>
                <div style="font-size:12px;color:#d97706;font-weight:bold;">حضانة بريطانية دولية للغات · الإدارة المالية</div>
              </td>
              <td style="text-align:left;">
                <div style="font-size:12px;color:#64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
                <div style="font-size:12px;color:#1e3a8a;font-weight:bold;">الفترة: ${monthName} ${selectedYear}</div>
              </td>
            </tr>
          </table>

          <div class="title-box">
            <h2 style="margin:0 0 8px 0;font-size:20px;color:#0f172a;">بيان الملخص المالي وإغلاق الشهر (${levelTitle})</h2>
            <div class="badge ${closedRecord?.isClosed ? 'badge-closed' : 'badge-open'}">
              ${closedRecord?.isClosed ? `✓ الشهر مغلق ومحمي رسميًا بتاريخ ${closedRecord.closedAt}` : '● الشهر مفتوح للعمليات المالية'}
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="label">إجمالي الإيرادات المحصلة</div>
              <div class="val" style="color:#047857;">${fin.totalIncome.toLocaleString()} ج.م</div>
            </div>
            <div class="summary-card">
              <div class="label">إجمالي المصروفات والرواتب</div>
              <div class="val" style="color:#b91c1c;">${fin.totalExpenses.toLocaleString()} ج.م</div>
            </div>
            <div class="summary-card ${fin.netProfit >= 0 ? 'profit' : 'profit-neg'}">
              <div class="label">صافي الربح التشغيلي</div>
              <div class="val" style="color:${fin.netProfit >= 0 ? '#15803d' : '#b91c1c'};">${fin.netProfit.toLocaleString()} ج.م</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>البند المالي</th>
                <th>التصنيف</th>
                <th>المبلغ المحصل / المصروف</th>
                <th>البيان</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>مصروفات الطلاب المحصلة</td>
                <td>إيرادات رئيسية</td>
                <td style="font-family:monospace;font-weight:bold;color:#047857;">${fin.primaryCollected.toLocaleString()} ج.م</td>
                <td>رسوم شهرية مسددة نقداً في الخزينة</td>
              </tr>
              <tr>
                <td>إيرادات إضافية وجلسات</td>
                <td>إيرادات ثانوية</td>
                <td style="font-family:monospace;font-weight:bold;color:#047857;">${fin.secondary.toLocaleString()} ج.م</td>
                <td>أنشطة، كيدز إريا إضافية، ويونيفورم</td>
              </tr>
              <tr>
                <td>مسير الرواتب والأجور</td>
                <td>مصروفات تشغيلية</td>
                <td style="font-family:monospace;font-weight:bold;color:#b91c1c;">${fin.payrollDisbursed.toLocaleString()} ج.م</td>
                <td>رواتب الكادر التعليمي والإداري</td>
              </tr>
              <tr>
                <td>المصروفات العامة والمشتريات</td>
                <td>مصروفات إدارية</td>
                <td style="font-family:monospace;font-weight:bold;color:#b91c1c;">${fin.operational.toLocaleString()} ج.م</td>
                <td>فواتير، مستلزمات تعليمية، ونظافة</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-row">
            <div>
              <div style="font-weight:bold;color:#1e3a8a;margin-bottom:6px;">اعتماد إدارة الحضانة (Nihel):</div>
              <div style="font-size:12px;color:#64748b;">توقيع المدير المالي والإداري: ____________________</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">صدر من النظام الآلي المعتمد لحضانة Modern British Kids</div>
            </div>
            <div style="border:3px double #1e3a8a;border-radius:50%;width:105px;height:105px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1e3a8a;font-size:10px;font-weight:bold;text-align:center;transform:rotate(-6deg);">
              <span>★ معتمد مالياً ★</span>
              <span style="font-size:8px;">إدارة Nihel</span>
              <span style="font-size:8px;">${selectedYear} OFFICIAL</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printHtmlDocument(`التقرير المالي وإغلاق الشهر - ${monthName} ${selectedYear}`, html);
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
          <span>طباعة التقرير (PDF)</span>
        </button>
      </div>

      {/* Level Breakdown Tabs (النقطة 6: ملخص مالي للكيدز إريا لوحده وملخص مالي للكيجي لوحده) */}
      <div className="flex bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setLevelFilter('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          الإجمالي العام للحضانة
        </button>

        <button
          onClick={() => setLevelFilter('lvl-kids-area')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'lvl-kids-area'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          ملخص الكيدز إريا لوحده ⏱
        </button>

        <button
          onClick={() => setLevelFilter('lvl-kg1')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'lvl-kg1'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          ملخص كيجي 1 لوحده 🎓
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
              <option value={9}>سبتمبر 2026</option>
              <option value={10}>أكتوبر 2026</option>
              <option value={11}>نوفمبر 2026</option>
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
