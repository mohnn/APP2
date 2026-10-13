import React, { useState } from 'react';
import { Plus, Receipt, Camera, ArrowRight, Filter, Calendar } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { ExpenseCategory, ExpenseRecord, PaymentMethod } from '../../types/nursery';

interface ExpensesScreenProps {
  onBack: () => void;
}

export const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form State
  const [amount, setAmount] = useState<number>(1500);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'rent', label: 'الإيجار' },
    { id: 'salaries', label: 'الرواتب' },
    { id: 'electricity', label: 'الكهرباء' },
    { id: 'water', label: 'المياه' },
    { id: 'internet', label: 'الإنترنت' },
    { id: 'cleaning', label: 'النظافة والتعقيم' },
    { id: 'tools', label: 'أدوات تعليمية' },
    { id: 'toys', label: 'ألعاب منتسوري' },
    { id: 'maintenance', label: 'الصيانة' },
    { id: 'food', label: 'الطعام والوجبات' },
    { id: 'transport', label: 'المواصلات وبنزين الباص' },
    { id: 'marketing', label: 'التسويق والدعاية' },
    { id: 'supplies', label: 'المشتريات والمكتبية' },
    { id: 'administrative', label: 'مصاريف إدارية' },
    { id: 'other', label: 'أخرى' },
  ];

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      alert('يرجى إدخال مبلغ وبيان المصروف');
      return;
    }

    const catObj = categories.find(c => c.id === category);

    storage.addExpense({
      amount: Number(amount),
      category,
      categoryLabelAr: catObj ? catObj.label : 'أخرى',
      date,
      description: description.trim(),
      paymentMethod,
      supplier: supplier.trim() || undefined,
    });

    setShowAddModal(false);
    setDescription('');
    setSupplier('');
  };

  const filteredExpenses = selectedCategory === 'all'
    ? storage.expenses
    : storage.expenses.filter(e => e.category === selectedCategory);

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

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
              مصروفات وتشغيل الحضانة
            </h2>
            <span className="text-[10px] text-slate-400">إدارة الفواتير والمصروفات الإدارية</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل مصروف</span>
        </button>
      </div>

      {/* Total Card */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">إجمالي المصروفات المعروضة</span>
          <div className="text-xl font-bold font-mono text-rose-600">
            {totalExpenseSum.toLocaleString()} ج.م
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
          <Receipt className="w-5 h-5" />
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="flex items-center gap-1 overflow-x-auto text-xs no-scrollbar pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          الكل ({storage.expenses.length})
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === c.id
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Expenses Feed */}
      <div className="space-y-2 pb-4">
        {filteredExpenses.map((exp) => (
          <div
            key={exp.id}
            className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-rose-500" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {exp.description}
                  </span>
                  <span className="text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 px-1.5 py-0.2 rounded-md shrink-0">
                    {exp.categoryLabelAr}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {exp.date} · {exp.supplier ? `المورد: ${exp.supplier} · ` : ''} طريقة الدفع: {exp.paymentMethod}
                </div>
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className="font-mono font-bold text-rose-600 text-sm">
                -{exp.amount.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-4 border border-slate-200 dark:border-slate-800 text-right space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
              تسجيل مصروف جديد للحضانة
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المبلغ (ج.م)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">بيان المصروف</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء شهر سبتمبر أو شراء ألعاب تركيب"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المورد / الجهة</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="سوبرماركت / مكتبة"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="cash">كاش</option>
                    <option value="instapay">InstaPay</option>
                    <option value="vodafone_cash">فودافون كاش</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="card">بطاقة ائتمانية</option>
                  </select>
                </div>
              </div>

              {/* Bill Image Attachment Simulator */}
              <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <button
                  type="button"
                  onClick={() => alert('تم تفعيل كاميرا الهاتف لتصوير فاتورة المصروف وإرفاقها!')}
                  className="text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>تصوير / إرفاق صورة الفاتورة</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
