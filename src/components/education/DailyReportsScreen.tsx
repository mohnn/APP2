import { notify } from '../../utils/notify';
import { localDateStr } from '../../utils/dateUtils';
import React, { useEffect, useState } from 'react';
import { ArrowRight, Calendar, Check, Save, Sparkles, Smile, Frown, Coffee } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { DailyReport } from '../../types/nursery';
import { Toast } from '../common/Toast';
import { DailyReportCard } from '../common/DailyReportCard';

interface DailyReportsScreenProps {
  /** عند وجودها تُعرض هذه الأسماء فقط (لحساب المعلم) */
  allowedChildIds?: string[];
  onBack: () => void;
}

export const DailyReportsScreen: React.FC<DailyReportsScreenProps> = ({ onBack, allowedChildIds }) => {
  const storage = NurseryStorageService.getInstance();
  const kids = storage.children.filter(c => !allowedChildIds || allowedChildIds.includes(c.id));
  const [selectedChildId, setSelectedChildId] = useState(kids[0]?.id || '');
  const [foodIntake, setFoodIntake] = useState<DailyReport['foodIntake']>('excellent');
  const [sleepDuration, setSleepDuration] = useState<DailyReport['sleepDuration']>('1hour');
  const [mood, setMood] = useState<DailyReport['mood']>('happy');
  const [toiletVisits, setToiletVisits] = useState(0);
  // لا توجد قيمة افتراضية: يجب أن تختار المعلمة نعم أو لا
  const [homeworkDone, setHomeworkDone] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const today = localDateStr();
  const [tab, setTab] = useState<'create' | 'archive'>('create');
  const [archiveChild, setArchiveChild] = useState('all');
  const archive = storage.dailyReports
    .filter(r => (!allowedChildIds || allowedChildIds.includes(r.childId)) && (archiveChild === 'all' || r.childId === archiveChild))
    .sort((a, b) => b.date.localeCompare(a.date));

  // تحميل تقرير اليوم المحفوظ للطفل (إن وُجد) أو بدء نموذج جديد بدون بقايا من طفل آخر
  const loadFor = (childId: string) => {
    const r = storage.dailyReports.find(x => x.childId === childId && x.date === today);
    setFoodIntake(r?.foodIntake ?? 'excellent');
    setSleepDuration(r?.sleepDuration ?? '1hour');
    setMood(r?.mood ?? 'happy');
    setToiletVisits(r?.toiletVisits ?? 0);
    setHomeworkDone(r ? r.homeworkDone : null);
    setNotes(r?.notes ?? '');
  };

  useEffect(() => {
    if (selectedChildId) loadFor(selectedChildId);
  }, []);

  const handleSelectChild = (id: string) => {
    setSelectedChildId(id);
    setSavedMsg(null);
    loadFor(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    if (homeworkDone === null) {
      notify('اختاري هل أكمل الطفل الواجب أم لا (نعم / لا) قبل الحفظ.', 'error');
      return;
    }

    const child = storage.children.find(c => c.id === selectedChildId);
    const existed = storage.dailyReports.some(r => r.childId === selectedChildId && r.date === today);

    storage.saveDailyReport({
      childId: selectedChildId,
      date: today,
      foodIntake,
      sleepDuration,
      mood,
      activityLevel: 'very_active',
      toiletVisits: Number(toiletVisits),
      homeworkDone: homeworkDone === true,
      notes: notes.trim() || undefined,
    });

    setSavedMsg(
      existed
        ? `تم تحديث تقرير اليوم للطفل (${child?.fullName}) وإرسال النسخة المحدّثة إلى ولي الأمر ✅`
        : `تم حفظ تقرير المتابعة اليومية للطفل (${child?.fullName}) وإرساله إلى ولي الأمر ✅`
    );
  };

  const selectedChild = storage.children.find(c => c.id === selectedChildId);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      <Toast message={savedMsg} onClose={() => setSavedMsg(null)} />

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

      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button onClick={() => setTab('create')} className={`flex-1 py-2 rounded-xl transition-all ${tab === 'create' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>
          تقرير اليوم
        </button>
        <button onClick={() => setTab('archive')} className={`flex-1 py-2 rounded-xl transition-all ${tab === 'archive' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>
          أرشيف المتابعة اليومية ({storage.dailyReports.filter(r => !allowedChildIds || allowedChildIds.includes(r.childId)).length})
        </button>
      </div>

      {tab === 'archive' ? (
        <div className="space-y-2.5 text-xs">
          <select value={archiveChild} onChange={e => setArchiveChild(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-bold">
            <option value="all">كل الأطفال</option>
            {kids.map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>)}
          </select>
          {archive.length === 0
            ? <div className="p-8 text-center text-slate-400 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">لا توجد تقارير محفوظة بعد</div>
            : archive.map(r => <DailyReportCard key={r.id} report={r} childName={storage.children.find(c => c.id === r.childId)?.fullName || 'طفل محذوف'} />)}
        </div>
      ) : (
      <form onSubmit={handleSave} className="space-y-3.5 text-xs">
        {/* Child Selector */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اختر الطفل</label>
          <select
            value={selectedChildId}
            onChange={e => handleSelectChild(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
          >
            {kids.map(c => (
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

        {/* 4. Homework */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">4. هل أكمل الطفل الواجب؟ (Homework)</span>
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              type="button"
              onClick={() => setHomeworkDone(true)}
              className={`py-2.5 rounded-xl font-bold border transition-all ${
                homeworkDone === true
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              نعم، أكمل الواجب ✔
            </button>
            <button
              type="button"
              onClick={() => setHomeworkDone(false)}
              className={`py-2.5 rounded-xl font-bold border transition-all ${
                homeworkDone === false
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              لا، لم يكمله ✖
            </button>
          </div>
          {homeworkDone === null && <span className="text-[10px] text-amber-600 font-semibold block">⚠️ اختاري نعم أو لا</span>}
        </div>

        {/* 5. Toilet */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">5. دخول الحمام (مرات)</label>
          <input
            type="number"
            min={0}
            max={10}
            value={toiletVisits}
            onChange={e => setToiletVisits(Number(e.target.value))}
            className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-center font-bold"
          />
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

        {savedMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs leading-relaxed">
            {savedMsg}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-700/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التقرير اليومي وإرساله لولي الأمر</span>
        </button>
      </form>
      )}
    </div>
  );
};
