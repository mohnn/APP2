import React, { useState, useEffect, useMemo } from 'react';
import { X, Wallet, Check, Lock, Search, Sparkles, GraduationCap, DollarSign, AlertCircle } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { PaymentReceipt } from '../../types/nursery';
import confetti from 'canvas-confetti';

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedChildId?: string;
  onReceiptGenerated: (receipt: PaymentReceipt) => void;
}

export const CollectFeeModal: React.FC<CollectFeeModalProps> = ({
  isOpen,
  onClose,
  preSelectedChildId,
  onReceiptGenerated,
}) => {
  const storage = NurseryStorageService.getInstance();

  const [selectedChildId, setSelectedChildId] = useState(preSelectedChildId || '');
  const [studentSearch, setStudentSearch] = useState('');
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  
  // Non-editable required / collected amount (المبلغ المحصل المقرر)
  const [requiredAmount, setRequiredAmount] = useState(2500);
  // Editable amount actually being paid (المبلغ المدفوع الآن)
  const [paidAmount, setPaidAmount] = useState(2500);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grouped students: Kids Area vs KG1 (النقطة 11: تنظيم الطلاب بقسمين لتسهيل الاختيار)
  const kidsAreaStudents = useMemo(() => {
    return storage.children.filter(c => 
      c.status === 'active' && 
      (c.levelId === 'lvl-kids-area' || c.studentId.length === 3)
    );
  }, [storage.children]);

  const kg1Students = useMemo(() => {
    return storage.children.filter(c => 
      c.status === 'active' && 
      (c.levelId === 'lvl-kg1' || c.studentId.length === 4)
    );
  }, [storage.children]);

  // Recalculate required amount whenever child or month changes
  const updateChildFee = (childId: string, m: number, y: number) => {
    const child = storage.children.find(c => c.id === childId);
    if (child) {
      const fee = storage.monthlyFees.find(f => f.childId === child.id && f.month === m && f.year === y);
      const feeDue = fee ? (fee.remainingAmount > 0 ? fee.remainingAmount : fee.totalRequired) : child.monthlyFee;
      setRequiredAmount(feeDue);
      setPaidAmount(feeDue); // Default paid to full due amount
    }
  };

  useEffect(() => {
    if (preSelectedChildId) {
      setSelectedChildId(preSelectedChildId);
      updateChildFee(preSelectedChildId, month, year);
    } else if (storage.children.length > 0 && !selectedChildId) {
      const initialId = storage.children[0].id;
      setSelectedChildId(initialId);
      updateChildFee(initialId, month, year);
    }
  }, [preSelectedChildId, isOpen]);

  const handleChildChange = (id: string) => {
    setSelectedChildId(id);
    updateChildFee(id, month, year);
  };

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    if (selectedChildId) {
      updateChildFee(selectedChildId, newMonth, year);
    }
  };

  if (!isOpen) return null;

  const currentChild = storage.children.find(c => c.id === selectedChildId);
  const remainingAfterPayment = Math.max(0, requiredAmount - paidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || paidAmount <= 0) {
      alert('يرجى تحديد الطالب ومبلغ مدفوع صحيح أكبر من صفر!');
      return;
    }

    if (paidAmount > requiredAmount) {
      if (!confirm(`المبلغ المدفوع (${paidAmount} ج.م) أكبر من المبلغ المطلوب (${requiredAmount} ج.م)، هل تريد المتابعة؟`)) {
        return;
      }
    }

    setIsSubmitting(true);

    const res = storage.collectChildFee({
      childId: selectedChildId,
      month,
      year,
      amount: Number(paidAmount),
      notes: notes.trim() || 'سداد نقدي كاش',
    });

    setIsSubmitting(false);

    if (res.success && res.receipt) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#3b82f6', '#10b981'],
        });
      } catch (err) {}

      onReceiptGenerated(res.receipt);
      onClose();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans select-none">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display">تحصيل سريع للمصروفات (كاش فقط)</h3>
              <span className="text-[10px] text-amber-200">إصدار إيصال سداد نقدي معتمد وموثق</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form Body or Empty Notice */}
        {storage.children.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Wallet className="w-12 h-12 text-amber-500 mx-auto opacity-60" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">لا يوجد طلاب مسجلون حالياً</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              يرجى تسجيل الطلاب أولاً عبر شاشة "الأطفال" للتمكن من تحصيل المصروفات وإصدار الإيصالات النقدية.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {/* Child Selector - Grouped into Kids Area & KG1 (النقطة 11) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                اختر الطالب (مرتب حسب القسم) <span className="text-rose-500">*</span>
              </label>

            <select
              value={selectedChildId}
              onChange={e => handleChildChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {/* Kids Area Section */}
              <optgroup label="🌟 طلاب الكيدز إريا (Kids Area - معرف 3 أرقام)">
                {kidsAreaStudents.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} (ID: {c.studentId}) — المصروفات: {c.monthlyFee} ج.م
                  </option>
                ))}
              </optgroup>

              {/* KG1 Section */}
              <optgroup label="🎓 طلاب مرحلة كيجي 1 (KG1 - معرف 4 أرقام)">
                {kg1Students.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} (ID: {c.studentId}) — المصروفات: {c.monthlyFee} ج.م
                  </option>
                ))}
              </optgroup>
            </select>

            {currentChild && (
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] flex items-center justify-between">
                <span className="text-slate-500">
                  المرحلة: <strong className="text-slate-800 dark:text-slate-200">{currentChild.levelNameAr}</strong>
                </span>
                <span className="font-mono text-blue-600 font-bold">
                  معرف الطالب: {currentChild.studentId}
                </span>
              </div>
            )}
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">شهر الاستحقاق</label>
              <select
                value={month}
                onChange={e => handleMonthChange(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value={9}>سبتمبر 9</option>
                <option value={10}>أكتوبر 10 (الشهر الحالي)</option>
                <option value={11}>نوفمبر 11</option>
                <option value={12}>ديسمبر 12</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">السنة</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-left font-bold"
              />
            </div>
          </div>

          {/* Field 1: المبلغ المحصل (المقرر / المستحق) - ميتعدلش ثابت ومغلق (النقطة 9) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>المبلغ المستحق / المحصل (المقرر)</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <span className="text-[10px] text-slate-400 font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                غير قابل للتعديل
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={`${requiredAmount.toLocaleString()} ج.م`}
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-700 dark:text-slate-300 text-left cursor-not-allowed select-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[11px] text-slate-400">
                المصروفات المعتمدة
              </span>
            </div>
          </div>

          {/* Field 2: المبلغ المدفوع كاش الآن - خانة إضافية قابلة للتعديل (النقطة 9) */}
          <div>
            <label className="font-bold text-slate-800 dark:text-white block mb-1">
              المبلغ المدفوع نقداً الآن (ج.م) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={1}
                step="any"
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full p-3 bg-amber-50/70 dark:bg-slate-800 border-2 border-amber-500 dark:border-amber-600 rounded-xl font-mono text-lg font-bold text-amber-950 dark:text-amber-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">
                ج.م (كاش 💵)
              </span>
            </div>

            {/* Dynamic Remaining Balance Preview */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] px-1">
              <span className="text-slate-500">المتبقي بعد هذا السداد:</span>
              <span className={`font-mono font-bold ${remainingAfterPayment === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {remainingAfterPayment === 0 ? '0.00 ج.م (سداد كامل وخالص)' : `${remainingAfterPayment.toLocaleString()} ج.م`}
              </span>
            </div>
          </div>

          {/* Payment Method - Cash Only */}
          <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] block">طريقة التحصيل:</span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                نقداً في الخزينة (كاش Cash 💵)
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-white dark:bg-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
              معتمد
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ملاحظات التحصيل (اختياري)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="مثال: سداد مصروفات الشهر نقداً في الخزينة"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد التحصيل وإصدار إيصال الكاش</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
