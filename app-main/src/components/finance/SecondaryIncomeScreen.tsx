import React, { useState } from 'react';
import { Plus, TrendingUp, ArrowRight, Bus, BookOpen, Shirt, Sparkles } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { IncomeCategory, IncomeRecord, PaymentMethod } from '../../types/nursery';

interface SecondaryIncomeScreenProps {
  onBack: () => void;
}

export const SecondaryIncomeScreen: React.FC<SecondaryIncomeScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState<number>(2000);
  const [category, setCategory] = useState<IncomeCategory>('bus');
  const [description, setDescription] = useState('');
  const [childName, setChildName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  const categories: { id: IncomeCategory; label: string; icon: string }[] = [
    { id: 'bus', label: 'اشتراكات الباص', icon: '🚌' },
    { id: 'books', label: 'الكتب والمناهج المستوردة', icon: '📚' },
    { id: 'uniform', label: 'الزي المدرسي (اليونيفورم)', icon: '👕' },
    { id: 'activities', label: 'الأنشطة الرياضية والكورسات', icon: '🎨' },
    { id: 'trips', label: 'الرحلات الترفيهية', icon: '🎡' },
    { id: 'parties', label: 'الحفلات والتخرج', icon: '🎉' },
    { id: 'courses', label: 'كورسات اللغات الصيفية', icon: '🗣️' },
    { id: 'other', label: 'إيرادات أخرى', icon: '✨' },
  ];

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      alert('يرجى كتابة المبلغ والبيان');
      return;
    }

    const catObj = categories.find(c => c.id === category);

    storage.addSecondaryIncome({
      amount: Number(amount),
      category,
      categoryLabelAr: catObj ? catObj.label : 'أخرى',
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      description: description.trim(),
      childName: childName.trim() || undefined,
    });

    setShowAddModal(false);
    setDescription('');
    setChildName('');
  };

  const totalSecondary = storage.secondaryIncome.reduce((sum, i) => sum + i.amount, 0);

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
              الدخل الثانوي والإضافي
            </h2>
            <span className="text-[10px] text-slate-400">الباص، الكتب، الزي، الأنشطة والرحلات</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل دخل إضافي</span>
        </button>
      </div>

      {/* KPI Card */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">إجمالي الدخل الإضافي المحصل</span>
          <div className="text-xl font-bold font-mono text-emerald-600">
            {totalSecondary.toLocaleString()} ج.م
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 pb-4">
        {storage.secondaryIncome.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 text-base">
                {categories.find(c => c.id === item.category)?.icon || '💰'}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {item.description}
                  </span>
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-md shrink-0">
                    {item.categoryLabelAr}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {item.date} · طريقة الدفع: {item.paymentMethod}
                  {item.childName ? ` · الطالب: ${item.childName}` : ''}
                </div>
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className="font-mono font-bold text-emerald-600 text-sm">
                +{item.amount.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
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
              تسجيل دخل إضافي للحضانة
            </h3>

            <form onSubmit={handleAddIncome} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المبلغ (ج.م)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">بند الدخل</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as IncomeCategory)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">البيان / الوصف</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="مثال: توريد كتب Oxford لمجموعة KG1"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الطفل (إن وجد)</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={e => setChildName(e.target.value)}
                    placeholder="اسم الطفل"
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
                    <option value="instapay">InstaPay</option>
                    <option value="cash">كاش</option>
                    <option value="vodafone_cash">فودافون كاش</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>
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
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  حفظ الدخل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
