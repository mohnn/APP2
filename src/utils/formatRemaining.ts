/** تنسيق الوقت المتبقي (مللي ثانية) بالعربية: "5 س 20 د" */
export const formatRemaining = (ms: number): string => {
  if (ms <= 60 * 1000) return 'أقل من دقيقة';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} س ${m} د` : `${m} د`;
};
