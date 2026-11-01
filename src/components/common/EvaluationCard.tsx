import React from 'react';
import { Star } from 'lucide-react';
import { EvaluationRecord } from '../../types/nursery';
import { MONTH_NAMES_AR } from '../../utils/dateUtils';

const SKILLS: [keyof EvaluationRecord, string][] = [
  ['arabicLanguage', 'اللغة العربية'],
  ['englishLanguage', 'اللغة الإنجليزية'],
  ['numbersMath', 'الأرقام والحساب'],
  ['fineMotorSkills', 'المهارات الحركية'],
  ['socialSkills', 'المهارات الاجتماعية'],
  ['independence', 'الاستقلالية'],
  ['artAndCreativity', 'الفن والإبداع'],
  ['quranAndEtiquette', 'القرآن والآداب'],
];

export const evaluationAverage = (ev: EvaluationRecord): number => {
  const vals = SKILLS.map(([k]) => Number(ev[k]) || 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
};

export const evaluationGrade = (avg: number): string =>
  avg >= 4.5 ? 'ممتاز' : avg >= 3.5 ? 'جيد جداً' : avg >= 2.5 ? 'جيد' : 'يحتاج متابعة';

/** بطاقة تقييم شهرية كاملة: درجات المهارات ومتوسطها وملاحظات المعلمة (إن وُجدت) */
export const EvaluationCard: React.FC<{ ev: EvaluationRecord }> = ({ ev }) => {
  const avg = evaluationAverage(ev);
  const grade = evaluationGrade(avg);
  const tone = avg >= 3.5 ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300' : avg >= 2.5 ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
  return (
    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-slate-900 dark:text-white">
          تقييم شهر {MONTH_NAMES_AR[ev.month - 1] || ev.month} {ev.year}
        </span>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${tone}`}>
          {grade} · {avg.toFixed(1)}/5
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {SKILLS.map(([key, label]) => {
          const v = Number(ev[key]) || 0;
          return (
            <div key={key} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 text-[10px]">
              <span className="text-slate-600 dark:text-slate-300">{label}</span>
              <span className="flex items-center gap-0.5 font-mono font-bold text-amber-600">
                {v}
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
            </div>
          );
        })}
      </div>

      {ev.overallFeedback?.trim() ? (
        <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
          <span className="font-bold block mb-0.5">ملاحظات المعلمة:</span>
          {ev.overallFeedback}
        </div>
      ) : (
        <div className="text-[10px] text-slate-400">لم تُكتب ملاحظات للمعلمة في هذا التقييم.</div>
      )}
    </div>
  );
};
