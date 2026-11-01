import { DailyReport } from '../types/nursery';

/** نصوص عرض المتابعة اليومية (كاملة وقصيرة) بحسب القيمة المسجلة فعلاً */
const FOOD: Record<DailyReport['foodIntake'], [string, string]> = {
  excellent: ['تناول الوجبة كاملة 🥗', 'ممتاز'],
  good: ['جيد 🥪', 'جيد'],
  little: ['قليل 🍎', 'قليل'],
  none: ['لم يأكل 🚫', 'لم يأكل'],
};
const SLEEP: Record<DailyReport['sleepDuration'], [string, string]> = {
  '2hours': ['ساعتان 💤', 'ساعتان'],
  '1hour': ['ساعة واحدة 😴', 'ساعة'],
  '30min': ['نصف ساعة 🥱', 'نصف ساعة'],
  none: ['لم ينم 🧸', 'لم ينم'],
};
const MOOD: Record<DailyReport['mood'], [string, string]> = {
  happy: ['سعيد ومرح 😊', 'سعيد'],
  calm: ['هادئ ومطيع 😌', 'هادئ'],
  fussy: ['متقلب / قلق 😐', 'متقلب'],
  crying: ['يبكي / عنيد 😢', 'يبكي'],
};

export const foodLabel = (v: DailyReport['foodIntake'], short = false): string => (FOOD[v] ?? ['—', '—'])[short ? 1 : 0];
export const sleepLabel = (v: DailyReport['sleepDuration'], short = false): string => (SLEEP[v] ?? ['—', '—'])[short ? 1 : 0];
export const moodLabel = (v: DailyReport['mood'], short = false): string => (MOOD[v] ?? ['—', '—'])[short ? 1 : 0];
export const homeworkLabel = (done: boolean): string => (done ? 'أكمل الواجب ✔' : 'لم يكمل الواجب ✖');
