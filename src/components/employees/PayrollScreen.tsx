import { notify } from '../../utils/notify';
import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pencil, Send } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { PaymentMethod, PayrollRecord } from '../../types/nursery';

interface PayrollScreenProps {
  onBack: () => void;
}

export const PayrollScreen: React.FC<PayrollScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const nowDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(nowDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(nowDate.getFullYear());
  const [, setVersion] = useState(0);
  const [adjust, setAdjust] = useState<{ rec: PayrollRecord; field: 'bonuses' | 'advances' | 'deductions' } | null>(null);
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const [disburseModalItem, setDisburseModalItem] = useState<PayrollRecord | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<string>('cash');

  // كل موظف نشط له سجل راتب في الشهر المعروض
  useEffect(() => {
    if (storage.ensurePayrollForMonth(selectedMonth, selectedYear) > 0) setVersion(v => v + 1);
  }, [selectedMonth, selectedYear]);

  const shiftMonth = (delta: number) => {
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const employeesMap = new Map<string, typeof storage.employees[0]>();
  storage.employees.forEach(e => employeesMap.set(e.id, e));

  const payrollList = storage.payroll.filter(p => p.month === selectedMonth && p.year === selectedYear);

  const totalNetSalaries = payrollList.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDisbursed = payrollList.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);

  const handleConfirmDisburse = () => {
    if (!disburseModalItem) return;
    const ok = storage.disburseSalary(disburseModalItem.id);
    if (ok) {
      notify('تم اعتماد صرف الراتب بنجاح وتسجيله بالحسابات!');
      setDisburseModalItem(null);
    }
  };

  const FIELD_INFO = {
    bonuses: { title: 'مكافأة', hint: 'مبلغ المكافأة التي تُضاف للراتب' },
    advances: { title: 'سلفة', hint: 'مبلغ السلفة التي تُخصم من الراتب' },
    deductions: { title: 'خصم', hint: 'مبلغ الخصم (جزاء / غياب ...)' },
  } as const;

  const currentOf = (rec: PayrollRecord, field: 'bonuses' | 'advances' | 'deductions'): number =>
    field === 'advances' ? (rec.advancesDeduction ?? rec.advances ?? 0) : (rec[field] ?? 0);

  const openAdjust = (rec: PayrollRecord, field: 'bonuses' | 'advances' | 'deductions') => {
    if (rec.status === 'paid') return;
    setAdjust({ rec, field });
    const cur = currentOf(rec, field);
    setAdjustValue(cur ? String(cur) : '');
    setAdjustError('');
  };

  // الصافي المتوقع أثناء الكتابة
  const previewNet = (): number | null => {
    if (!adjust) return null;
    const v = Number(adjustValue || 0);
    if (!Number.isFinite(v)) return null;
    const r = adjust.rec;
    const vals = {
      bonuses: currentOf(r, 'bonuses'),
      advances: currentOf(r, 'advances'),
      deductions: currentOf(r, 'deductions'),
      [adjust.field]: v,
    } as Record<'bonuses' | 'advances' | 'deductions', number>;
    return (r.baseSalary || r.basicSalary || 0) + vals.bonuses - vals.deductions - vals.advances;
  };

  const saveAdjust = () => {
    if (!adjust) return;
    const value = Number(adjustValue || 0);
    const res = storage.updatePayrollAdjustments(adjust.rec.id, { [adjust.field]: value });
    if (!res.success) {
      setAdjustError(res.message);
      return;
    }
    setAdjust(null);
    setVersion(v => v + 1);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      {/* Header */}
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
              مسير رواتب الموظفين (Payroll)
            </h2>
            <span className="text-[10px] text-slate-400">اضغط على المكافأة أو السلفة أو الخصم لتعديلها</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5">
          <button onClick={() => shiftMonth(-1)} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" aria-label="الشهر السابق">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold min-w-[78px] text-center">{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
          <button onClick={() => shiftMonth(1)} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center" aria-label="الشهر التالي">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 text-[10px] block">إجمالي مستحقات الرواتب</span>
          <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
            {totalNetSalaries.toLocaleString()} ج.م
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-slate-500 text-[10px] block">الرواتب المصروفة فعلياً</span>
          <span className="font-mono font-bold text-base text-emerald-600">
            {totalDisbursed.toLocaleString()} ج.م
          </span>
        </div>
      </div>

      {/* Payroll Items List */}
      <div className="space-y-2 pb-4">
        {payrollList.map((pay: PayrollRecord) => {
          const emp = employeesMap.get(pay.employeeId) ?? { fullName: pay.employeeName, roleLabelAr: 'موظف سابق (محذوف)' };

          return (
            <div
              key={pay.id}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {emp.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {emp.roleLabelAr}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      pay.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {pay.status === 'paid' ? 'تم الصرف ✅' : 'قيد الانتظار ⏳'}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-2 gap-1.5 text-center text-[10px]">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                  <span className="text-slate-400 block">الأساسي</span>
                  <span className="font-mono font-bold text-xs">{pay.baseSalary || pay.basicSalary}</span>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <span className="text-blue-600 block font-bold">الصافي</span>
                  <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300">{pay.netSalary} ج.م</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                {(['bonuses', 'advances', 'deductions'] as const).map(field => {
                  const editable = pay.status !== 'paid';
                  const colors = {
                    bonuses: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
                    advances: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
                    deductions: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40',
                  } as const;
                  const sign = field === 'bonuses' ? '+' : '-';
                  return (
                    <button
                      key={field}
                      type="button"
                      disabled={!editable}
                      onClick={() => openAdjust(pay, field)}
                      className={`p-2 rounded-xl border ${colors[field]} ${editable ? 'active:scale-95 hover:brightness-95 cursor-pointer' : 'opacity-70 cursor-default'} transition-all`}
                    >
                      <span className="font-bold flex items-center justify-center gap-1">
                        {field === 'bonuses' ? 'مكافأة' : field === 'advances' ? 'سلفة' : 'خصم'}
                        {editable && <Pencil className="w-2.5 h-2.5" />}
                      </span>
                      <span className="font-mono font-bold text-xs block mt-0.5">
                        {sign}{currentOf(pay, field)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Footer / Disburse Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  {pay.disbursedDate || pay.disbursedAt ? `صُرف في: ${pay.disbursedDate || pay.disbursedAt}` : 'لم يُصرف بعد'}
                </span>

                {pay.status !== 'paid' && (
                  <button
                    onClick={() => setDisburseModalItem(pay)}
                    className="px-3 py-1 bg-violet-700 hover:bg-violet-600 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>صرف الراتب الآن</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust (مكافأة / سلفة / خصم) Modal */}
      {adjust && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setAdjust(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {FIELD_INFO[adjust.field].title} للموظف: {adjust.rec.employeeName}
            </h3>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {FIELD_INFO[adjust.field].hint} (ج.م)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                autoFocus
                value={adjustValue}
                onChange={e => {
                  setAdjustValue(e.target.value);
                  setAdjustError('');
                }}
                placeholder="0"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-left font-bold text-base"
              />
              <span className="text-[10px] text-slate-400 block mt-1">اكتب الإجمالي الجديد لهذا البند (اتركه فارغاً أو 0 لإلغائه).</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-center text-xs">
              <span className="text-blue-700 dark:text-blue-300">الصافي بعد التعديل: </span>
              <span className="font-mono font-bold text-blue-900 dark:text-blue-200">
                {previewNet() !== null ? previewNet()!.toLocaleString() : '—'} ج.م
              </span>
            </div>

            {adjustError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                ⚠️ {adjustError}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setAdjust(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={saveAdjust}
                className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl font-bold text-xs"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {disburseModalItem && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setDisburseModalItem(null)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border text-right space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2">
              تأكيد صرف راتب شهر {selectedMonth}
            </h3>

            <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-center">
              <span className="text-[11px] text-violet-700 dark:text-violet-300 block">المبلغ الصافي للصرف</span>
              <span className="text-2xl font-bold font-mono text-violet-900 dark:text-violet-200">
                {disburseModalItem.netSalary.toLocaleString()} ج.م
              </span>
            </div>

            <div className="text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">طريقة الصرف</label>
              <select
                value={disburseMethod}
                onChange={e => setDisburseMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              >
                <option value="bank_transfer">تحويل بنكي / محفظة</option>
                <option value="cash">كاش نقدي</option>
                <option value="instapay">InstaPay</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDisburseModalItem(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDisburse}
                className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl font-bold text-xs"
              >
                تأكيد واعتماد الصرف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
