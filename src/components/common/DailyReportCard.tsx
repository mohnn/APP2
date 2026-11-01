import React from 'react';
import { DailyReport } from '../../types/nursery';
import { foodLabel, sleepLabel, moodLabel, homeworkLabel } from '../../utils/dailyLabels';

/** بطاقة مختصرة لتقرير يومي (تُستخدم في أرشيف المتابعة اليومية للإدارة وولي الأمر) */
export const DailyReportCard: React.FC<{ report: DailyReport; childName?: string }> = ({ report: r, childName }) => (
  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
      <span className="font-bold text-slate-900 dark:text-white">{childName ?? 'تقرير اليوم'}</span>
      <span className="text-slate-400 font-mono">{r.date}</span>
    </div>
    <div className="grid grid-cols-2 gap-1.5">
      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg"><span className="text-slate-400 block text-[10px]">الطعام</span><b>{foodLabel(r.foodIntake)}</b></div>
      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg"><span className="text-slate-400 block text-[10px]">النوم</span><b>{sleepLabel(r.sleepDuration)}</b></div>
      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg"><span className="text-slate-400 block text-[10px]">المزاج</span><b>{moodLabel(r.mood)}</b></div>
      <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg"><span className="text-slate-400 block text-[10px]">الحمام</span><b>{r.toiletVisits} مرات</b></div>
    </div>
    <div className={`p-1.5 rounded-lg font-bold ${r.homeworkDone ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'}`}>
      {homeworkLabel(r.homeworkDone)}
    </div>
    {r.notes && <p className="text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/30 p-2 rounded-lg">{r.notes}</p>}
  </div>
);
