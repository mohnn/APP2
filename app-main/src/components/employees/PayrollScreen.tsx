import React, { useState } from 'react';
import { ArrowRight, CreditCard, CheckCircle2, Clock, DollarSign, Send } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { PaymentMethod, PayrollRecord } from '../../types/nursery';

interface PayrollScreenProps {
  onBack: () => void;
}

export const PayrollScreen: React.FC<PayrollScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [disburseModalItem, setDisburseModalItem] = useState<PayrollRecord | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<string>('cash');

  const employeesMap = new Map<string, typeof storage.employees[0]>();
  storage.employees.forEach(e => employeesMap.set(e.id, e));

  const payrollList = storage.payroll.filter(p => p.month === selectedMonth && p.year === selectedYear);

  const totalNetSalaries = payrollList.reduce((sum, p) => sum + p.netSalary, 0);
  const totalDisbursed = payrollList.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.netSalary, 0);

  const handleConfirmDisburse = () => {
    if (!disburseModalItem) return;
    const ok = storage.disburseSalary(disburseModalItem.id);
    if (ok) {
      alert('تم اعتماد صرف الراتب بنجاح وتسجيله بالحسابات!');
      setDisburseModalItem(null);
    }
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
            <span className="text-[10px] text-slate-400">شهر {selectedMonth} / {selectedYear}</span>
          </div>
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
          const emp = employeesMap.get(pay.employeeId);
          if (!emp) return null;

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
              <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-[10px]">
                <div>
                  <span className="text-slate-400 block">الأساسي</span>
                  <span className="font-mono font-bold">{pay.baseSalary || pay.basicSalary}</span>
                </div>
                <div>
                  <span className="text-emerald-600 block">مكافآت</span>
                  <span className="font-mono font-bold">+{pay.bonuses}</span>
                </div>
                <div>
                  <span className="text-rose-500 block">سلف/خصم</span>
                  <span className="font-mono font-bold">-{(pay.advancesDeduction || pay.advances || 0) + (pay.deductions || 0)}</span>
                </div>
                <div>
                  <span className="text-blue-600 block font-bold">الصافي</span>
                  <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300">
                    {pay.netSalary} ج.م
                  </span>
                </div>
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
