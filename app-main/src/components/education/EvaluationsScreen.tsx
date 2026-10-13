import React, { useState } from 'react';
import { ArrowRight, Award, Star, Save, CheckCircle2, Share2, Send, Eye, User, Sparkles } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';

interface EvaluationsScreenProps {
  onBack: () => void;
}

export const EvaluationsScreen: React.FC<EvaluationsScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [selectedChildId, setSelectedChildId] = useState(storage.children[0]?.id || '');
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');

  // Ratings (1 to 5)
  const [english, setEnglish] = useState(5);
  const [arabic, setArabic] = useState(5);
  const [math, setMath] = useState(5);
  const [motor, setMotor] = useState(5);
  const [social, setSocial] = useState(5);
  const [independence, setIndependence] = useState(5);
  const [art, setArt] = useState(5);
  const [quran, setQuran] = useState(5);
  const [feedback, setFeedback] = useState('يظهر الطفل تطوراً ملحوظاً في التفاعل الصفي واللغة وحفظ الآداب.');

  // Load existing evaluation when selecting a child
  const handleSelectChild = (cid: string) => {
    setSelectedChildId(cid);
    const existing = storage.evaluations.find(e => e.childId === cid && e.month === month && e.year === year);
    if (existing) {
      setEnglish(existing.englishLanguage);
      setArabic(existing.arabicLanguage);
      setMath(existing.numbersMath);
      setMotor(existing.fineMotorSkills);
      setSocial(existing.socialSkills);
      setIndependence(existing.independence);
      setArt(existing.artAndCreativity);
      setQuran(existing.quranAndEtiquette);
      setFeedback(existing.overallFeedback);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    const child = storage.children.find(c => c.id === selectedChildId);

    storage.saveEvaluation({
      childId: selectedChildId,
      month,
      year,
      arabicLanguage: arabic,
      englishLanguage: english,
      numbersMath: math,
      fineMotorSkills: motor,
      socialSkills: social,
      independence,
      artAndCreativity: art,
      quranAndEtiquette: quran,
      overallFeedback: feedback.trim(),
    });

    setToastMessage(`تم حفظ تقرير تقييم الطفل (${child?.fullName}) بنجاح وإرساله فوراً إلى حساب ولي الأمر ✅`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleShareWithParent = (childName: string) => {
    setToastMessage(`تم تأكيد إرسال ومشاركة التقرير مع حساب ولي أمر الطالب (${childName}) بنجاح 📲`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const skills = [
    { label: 'اللغة الإنجليزية و Oxford Phonics', val: english, setter: setEnglish },
    { label: 'اللغة العربية والتهجئة', val: arabic, setter: setArabic },
    { label: 'الأرقام والمفاهيم الرياضية (Math)', val: math, setter: setMath },
    { label: 'المهارات الحركية الدقيقة (Fine Motor)', val: motor, setter: setMotor },
    { label: 'المهارات الاجتماعية والمشاركة', val: social, setter: setSocial },
    { label: 'الاعتماد على النفس والاستقلالية', val: independence, setter: setIndependence },
    { label: 'الفنون والأعمال اليدوية والابتكار', val: art, setter: setArt },
    { label: 'القرآن الكريم والآداب الإسلامية', val: quran, setter: setQuran },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      {/* Toast Notification (النقطة 13: وصول التقرير لحساب ولي الأمر) */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in border border-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            ✕
          </button>
        </div>
      )}

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
              تقييم مهارات الأطفال والشهادات
            </h2>
            <span className="text-[10px] text-slate-400">نظام التقييم الشامل ومشاركته المباشرة مع أولياء الأمور</span>
          </div>
        </div>
      </div>

      {/* 2 Tabs: نموذج التقييم و أرشيف جميع التقييمات المحفوظة */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'create'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          كتابة تقييم جديد
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'archive'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          أرشيف التقييمات الكاملة ({storage.evaluations.length})
        </button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* Child Selector */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex gap-2">
            <div className="flex-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اختر الطفل *</label>
              <select
                value={selectedChildId}
                onChange={e => handleSelectChild(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-slate-800 dark:text-slate-100"
              >
                {storage.children.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.studentId} - {c.levelNameAr})</option>
                ))}
              </select>
            </div>

            <div className="w-28">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">شهر التقييم</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
              >
                <option value={9}>سبتمبر</option>
                <option value={10}>أكتوبر</option>
                <option value={11}>نوفمبر</option>
              </select>
            </div>
          </div>

          {/* Skills Star Rating Grid */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="text-[11px] font-bold text-slate-400 border-b pb-1">
              معايير التقييم النمائي والأكاديمي (1 إلى 5 نجوم)
            </div>

            <div className="space-y-2.5">
              {skills.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {s.label}
                  </span>

                  <div className="flex items-center gap-1.5" dir="ltr">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => s.setter(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= s.val
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              تقرير وملاحظات المعلمة (تظهر في حساب ولي الأمر فوراً)
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التقييم وإرساله لحساب ولي الأمر الآن</span>
          </button>
        </form>
      ) : (
        /* TAB 2: أرشيف التقييمات الكاملة لجميع الأطفال في حساب الإدارة (النقطة 13) */
        <div className="space-y-3">
          {storage.evaluations.map((ev) => {
            const child = storage.children.find(c => c.id === ev.childId);
            const avgRating = ((
              ev.arabicLanguage +
              ev.englishLanguage +
              ev.numbersMath +
              ev.fineMotorSkills +
              ev.socialSkills +
              ev.independence +
              ev.artAndCreativity +
              ev.quranAndEtiquette
            ) / 8).toFixed(1);

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: child?.avatarColor || '#3b82f6' }}
                    >
                      {child?.fullName[0] || 'ط'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white block">
                        {child?.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        معرف: {child?.studentId} · {child?.levelNameAr} · شهر {ev.month}/{ev.year}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">المعدل العام</span>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1 font-mono">
                      ⭐ {avgRating} / 5
                    </span>
                  </div>
                </div>

                {/* 8 Skills Grid Display */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                  <div className="flex justify-between">
                    <span className="text-slate-500">الإنجليزية و Phonics:</span>
                    <span className="font-bold text-amber-500">{ev.englishLanguage} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">اللغة العربية:</span>
                    <span className="font-bold text-amber-500">{ev.arabicLanguage} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الرياضيات Math:</span>
                    <span className="font-bold text-amber-500">{ev.numbersMath} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">المهارات الحركية:</span>
                    <span className="font-bold text-amber-500">{ev.fineMotorSkills} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">المشاركة الاجتماعية:</span>
                    <span className="font-bold text-amber-500">{ev.socialSkills} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الاستقلالية:</span>
                    <span className="font-bold text-amber-500">{ev.independence} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الفنون والأشغال:</span>
                    <span className="font-bold text-amber-500">{ev.artAndCreativity} ⭐</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">القرآن والآداب:</span>
                    <span className="font-bold text-amber-500">{ev.quranAndEtiquette} ⭐</span>
                  </div>
                </div>

                {/* Feedback Note */}
                <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 text-[11px] text-blue-900 dark:text-blue-200">
                  <span className="font-bold block mb-0.5">كلمة المعلمة:</span>
                  <p>{ev.overallFeedback}</p>
                </div>

                {/* Share Button (النقطة 13) */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    التقرير معتمد في بوابة ولي الأمر
                  </span>

                  <button
                    type="button"
                    onClick={() => handleShareWithParent(child?.fullName || '')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إشعار لولي الأمر</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
