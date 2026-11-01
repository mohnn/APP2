export const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const pad = (n: number) => String(n).padStart(2, '0');

/** تاريخ اليوم بتوقيت الجهاز (YYYY-MM-DD). بديل toISOString الذي يعطي تاريخ UTC ويتأخر ساعات عن مصر. */
export const localDateStr = (d: Date = new Date()): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** الشهر والسنة الحاليان */
export const currentPeriod = (d: Date = new Date()): { month: number; year: number } => ({ month: d.getMonth() + 1, year: d.getFullYear() });

/** بداية "YYYY-MM" للشهر المعطى */
export const yearMonthPrefix = (month: number, year: number): string => `${year}-${pad(month)}`;

/** العام الدراسي: يبدأ في سبتمبر (مثال: 2026 / 2027) */
export const academicYearLabel = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  return d.getMonth() >= 8 ? `${y} / ${y + 1}` : `${y - 1} / ${y}`;
};
