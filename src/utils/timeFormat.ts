const pad = (n: number) => String(n).padStart(2, '0');

/** يحوّل HH:mm (24 ساعة) إلى hh:mm ص/م. النصوص المنسّقة مسبقاً تُترك كما هي. */
export const formatTime12h = (t?: string | null): string => {
  if (!t) return '';
  if (/[صم]|am|pm/i.test(t)) return t;
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  const h = parseInt(m[1], 10);
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${m[2]} ${h >= 12 ? 'م' : 'ص'}`;
};

export const getCurrentTime12h = (): string => {
  const d = new Date();
  return formatTime12h(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
};
