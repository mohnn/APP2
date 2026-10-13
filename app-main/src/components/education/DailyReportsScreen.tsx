import React, { useState } from 'react';
import { ArrowRight, Calendar, Check, Save, Sparkles, Smile, Frown, Coffee } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { DailyReport } from '../../types/nursery';

interface DailyReportsScreenProps {
  onBack: () => void;
}

export const DailyReportsScreen: React.FC<DailyReportsScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [selectedChildId, setSelectedChildId] = useState(storage.children[0]?.id || '');
  const [foodIntake, setFoodIntake] = useState<DailyReport['foodIntake']>('excellent');
  const [sleepDuration, setSleepDuration] = useState<DailyReport['sleepDuration']>('1hour');
  const [mood, setMood] = useState<DailyReport['mood']>('happy');
  const [toiletVisits, setToiletVisits] = useState(2);
  const [homeworkDone, setHomeworkDone] = useState(true);
  const [notes, setNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    storage.saveDailyReport({
      childId: selectedChildId,
      date: today,
      foodIntake,
      sleepDuration,
      mood,
      activityLevel: 'very_active',
      toiletVisits: Number(toiletVisits),
      homeworkDone,
      notes: notes.trim() || undefined,
    });

    alert('تم حفظ تقرير المتابعة اليومية للطفل بنجاح!');
  };

  const selectedChild = storage.children.find(c => c.id === selectedChildId);

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
              المتابعة اليومية للأطفال
            </h2>
            <span className="text-[10px] text-slate-400">سجل الوجبات، النوم، السلوك والحمام</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5 text-xs">
        {/* Child Selector */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اختر الطفل</label>
          <select
            value={selectedChildId}
            onChange={e => setSelectedChildId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
          >
            {storage.children.map(c => (
              <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>
            ))}
          </select>
        </div>

        {/* 1. Food Intake */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            1. تناول وجبة الإفطار والغداء (Food Intake)
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { id: 'excellent', label: 'ممتاز 🥗' },
              { id: 'good', label: 'جيد 🥪' },
              { id: 'little', label: 'قليل 🍎' },
              { id: 'none', label: 'لم يأكل 🚫' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFoodIntake(f.id as any)}
                className={`py-2 px-1 rounded-xl font-bold border transition-all ${
                  foodIntake === f.id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Sleep */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            2. فترة القيلولة والنوم (Nap Time)
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { id: '2hours', label: 'ساعتان 💤' },
              { id: '1hour', label: 'ساعة واحدة 😴' },
              { id: '30min', label: 'نصف ساعة 🥱' },
              { id: 'none', label: 'لم ينم 🧸' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSleepDuration(s.id as any)}
                className={`py-2 px-1 rounded-xl font-bold border transition-all ${
                  sleepDuration === s.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Mood */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            3. المزاج والسلوك العام (Mood)
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { id: 'happy', label: 'سعيد ومرح 😊' },
              { id: 'calm', label: 'هادئ ومطيع 😌' },
              { id: 'fussy', label: 'متقلب / قلق 😐' },
              { id: 'crying', label: 'يبكي / عنيد 😢' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id as any)}
                className={`py-2 px-1 rounded-xl font-bold border transition-all ${
                  mood === m.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Toilet & Homework */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">دخول الحمام (مرات)</label>
            <input
              type="number"
              min={0}
              max={10}
              value={toiletVisits}
              onChange={e => setToiletVisits(Number(e.target.value))}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-center font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الواجب والأنشطة</label>
            <button
              type="button"
              onClick={() => setHomeworkDone(!homeworkDone)}
              className={`w-full py-2 rounded-xl font-bold border transition-colors ${
                homeworkDone ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {homeworkDone ? 'تم الإنجاز بالكامل ✔' : 'لم يكتمل ✖'}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
            ملاحظات المعلمة لولي الأمر
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="اكتب ملاحظة تشجيعية أو تنبيهاً لولي الأمر..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-700/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التقرير اليومي وإرساله لولي الأمر</span>
        </button>
      </form>
    </div>
  );
};
