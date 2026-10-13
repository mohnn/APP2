import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Share2,
  FileText,
  Calendar
} from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { PaymentReceipt, ChildMonthlyFee } from '../../types/nursery';

interface FinanceScreenProps {
  onOpenCollectModal: (childId?: string) => void;
  onViewReceipt: (receipt: PaymentReceipt) => void;
  onOpenFinancialOverview: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'year';

export const FinanceScreen: React.FC<FinanceScreenProps> = ({
  onOpenCollectModal,
  onViewReceipt,
  onOpenFinancialOverview,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'child_fees'>('receipts');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState<string>('all');

  const storage = NurseryStorageService.getInstance();

  // Dynamic Financial Summary for selected period (النقطة 5)
  const finSummary = useMemo(() => {
    return storage.getFinancialSummary(periodFilter);
  }, [storage.receipts, storage.expenses, periodFilter]);

  // Overall fees for October
  const monthFeesSummary = useMemo(() => {
    const fees = storage.monthlyFees.filter(f => f.month === 10 && f.year === 2026);
    const totalRequired = fees.reduce((sum, f) => sum + f.totalRequired, 0);
    const totalCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalArrears = fees.reduce((sum, f) => sum + f.remainingAmount, 0);
    return {
      totalCollected,
      totalArrears,
      totalRequired,
      collectionRate: Math.round((totalCollected / (totalRequired || 1)) * 100),
    };
  }, [storage.monthlyFees]);

  // Filtered Receipts for the selected period
  const filteredReceipts = useMemo(() => {
    let list = finSummary.receipts;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(r => 
        r.childName.toLowerCase().includes(q) ||
        r.studentId.includes(q) ||
        r.receiptNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [finSummary.receipts, searchQuery]);

  // Child Fees list
  const filteredFees = useMemo(() => {
    let list = storage.monthlyFees.filter(f => f.month === 10 && f.year === 2026);
    if (feeStatusFilter !== 'all') {
      list = list.filter(f => f.status === feeStatusFilter);
    }
    return list;
  }, [storage.monthlyFees, feeStatusFilter]);

  const childrenMap = useMemo(() => {
    const map = new Map<string, typeof storage.children[0]>();
    storage.children.forEach(c => map.set(c.id, c));
    return map;
  }, [storage.children]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      {/* Top Quick Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            إدارة الحسابات والمصروفات
          </h2>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            حسابات: {finSummary.periodLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenFinancialOverview}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            تقرير الأرباح
          </button>

          <button
            onClick={() => onOpenCollectModal()}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تحصيل كاش</span>
          </button>
        </div>
      </div>

      {/* Period Filter Selector: اليوم / الأسبوع / الشهر / السنة (النقطة 5) */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-1">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>فترة الحسابات:</span>
        </span>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold">
          {(['today', 'week', 'month', 'year'] as PeriodFilter[]).map((period) => {
            const labels = { today: 'اليوم', week: 'الأسبوع', month: 'الشهر', year: 'السنة' };
            const isActive = periodFilter === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setPeriodFilter(period)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
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

      {/* 3 Metric Cards for Selected Period */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">
            الدخل المحصل ({periodFilter === 'today' ? 'اليوم' : periodFilter === 'week' ? 'الأسبوع' : periodFilter === 'month' ? 'الشهر' : 'السنة'})
          </span>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
            {finSummary.totalIncome.toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400 font-mono">ج.م (كاش 💵)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold text-rose-500 block mb-0.5">
            المصروفات
          </span>
          <div className="text-base font-bold font-mono text-rose-600">
            {finSummary.totalExpenses.toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400">ج.م منصرفة</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-xs bg-blue-50/20">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">
            صافي الربح
          </span>
          <div className={`text-base font-bold font-mono ${finSummary.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-rose-600'}`}>
            {finSummary.netProfit.toLocaleString()}
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold font-mono">
            {finSummary.receiptsCount} إيصالات
          </span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setActiveSubTab('receipts')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeSubTab === 'receipts'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          إيصالات التحصيل الكاش ({filteredReceipts.length})
        </button>

        <button
          onClick={() => setActiveSubTab('child_fees')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeSubTab === 'child_fees'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          استحقاقات شهر أكتوبر ({storage.children.length})
        </button>
      </div>

      {/* Receipts View */}
      {activeSubTab === 'receipts' ? (
        <div className="space-y-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الإيصال، اسم الطفل، أو معرف ID..."
              className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
              <p className="text-xs font-semibold">لا توجد إيصالات مسجلة لهذه الفترة ({finSummary.periodLabel})</p>
            </div>
          ) : (
            filteredReceipts.map(r => (
              <div
                key={r.id}
                onClick={() => onViewReceipt(r)}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {r.childName}
                      </span>
                      <span className="text-[10px] text-blue-600 font-mono font-bold">
                        (ID: {r.studentId})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                      <span>{r.receiptNumber}</span>
                      <span>·</span>
                      <span>{r.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="text-sm font-bold font-mono text-emerald-600">
                    +{r.amount.toLocaleString()} ج.م
                  </div>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-semibold">
                    نقداً (كاش)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Child Monthly Fees View */
        <div className="space-y-2.5">
          {/* Status Filter */}
          <div className="flex gap-1.5 text-xs">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'paid', label: 'مسدد بالكامل' },
              { id: 'partial', label: 'مسدد جزئياً' },
              { id: 'unpaid', label: 'غير مسدد' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFeeStatusFilter(f.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                  feeStatusFilter === f.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredFees.map(fee => {
            const child = childrenMap.get(fee.childId);
            if (!child) return null;

            const isPaid = fee.status === 'paid';
            const isPartial = fee.status === 'partial';

            return (
              <div
                key={fee.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: child.avatarColor }}
                  >
                    {child.fullName[0]}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {child.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      معرف ID: {child.studentId} · المطلوب: {fee.totalRequired} ج.م
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-left font-mono">
                    <span className={`text-xs font-bold block ${isPaid ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-rose-600'}`}>
                      {fee.paidAmount} / {fee.totalRequired} ج.م
                    </span>
                    {fee.remainingAmount > 0 ? (
                      <span className="text-[9px] text-rose-500 font-semibold">متبقي: {fee.remainingAmount} ج.م</span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 font-semibold">تم السداد ✅</span>
                    )}
                  </div>

                  {fee.remainingAmount > 0 && (
                    <button
                      onClick={() => onOpenCollectModal(child.id)}
                      className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold"
                    >
                      تحصيل
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
