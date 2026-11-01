/**
 * حماية تسجيل الدخول: بعد 3 محاولات خاطئة متتالية يُمنع الدخول لمدة دقيقة،
 * ثم تُتاح 3 محاولات جديدة. الحالة محفوظة على الجهاز فلا تُتجاوز بإعادة تشغيل التطبيق.
 */
export type GuardKind = 'admin' | 'parent' | 'teacher';

export const MAX_FAILED_ATTEMPTS = 3;
export const LOCK_DURATION_MS = 60 * 1000;

const KEY = 'mbk_login_guard_v1';

interface KindState {
  fails: number;
  lockedUntil: number;
}
type GuardState = Partial<Record<GuardKind, KindState>>;

const read = (): GuardState => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as GuardState;
  } catch {
    return {};
  }
};
const write = (s: GuardState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
};

/** الثواني المتبقية للقفل (0 إذا لا يوجد قفل) */
export const getLockSeconds = (kind: GuardKind): number => {
  const s = read();
  const st = s[kind];
  if (!st || !st.lockedUntil) return 0;
  const left = st.lockedUntil - Date.now();
  if (left > 0) return Math.ceil(left / 1000);
  // انتهى القفل: بداية جديدة
  s[kind] = { fails: 0, lockedUntil: 0 };
  write(s);
  return 0;
};

/** تسجيل محاولة خاطئة. يرجع هل تم القفل وعدد المحاولات المتبقية. */
export const recordFailure = (kind: GuardKind): { locked: boolean; lockedSeconds: number; attemptsLeft: number } => {
  const already = getLockSeconds(kind);
  if (already > 0) return { locked: true, lockedSeconds: already, attemptsLeft: 0 };
  const s = read();
  const st = s[kind] || { fails: 0, lockedUntil: 0 };
  st.fails += 1;
  if (st.fails >= MAX_FAILED_ATTEMPTS) {
    s[kind] = { fails: 0, lockedUntil: Date.now() + LOCK_DURATION_MS };
    write(s);
    return { locked: true, lockedSeconds: Math.ceil(LOCK_DURATION_MS / 1000), attemptsLeft: 0 };
  }
  s[kind] = st;
  write(s);
  return { locked: false, lockedSeconds: 0, attemptsLeft: MAX_FAILED_ATTEMPTS - st.fails };
};

export const recordSuccess = (kind: GuardKind): void => {
  const s = read();
  if (s[kind]) {
    s[kind] = { fails: 0, lockedUntil: 0 };
    write(s);
  }
};

/** رسالة جاهزة للمستخدم بحسب حالة القفل */
export const lockMessage = (seconds: number): string =>
  `تم إيقاف المحاولات مؤقتاً بسبب كثرة المحاولات الخاطئة. حاول مرة أخرى بعد ${seconds} ثانية.`;
