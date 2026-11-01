/**
 * نظام الإشعارات الموحّد (إدارة / معلم / ولي أمر).
 * كل إشعار نسخة خاصة بمستلم واحد (to) مع حالة مقروء/غير مقروء.
 * مفاتيح المستلمين: 'admin' | 't:<teacherId>' | 'c:<childId>'
 */
import { NOTIFICATIONS_ENABLED } from '../config/features';

export type NotifType = 'attendance' | 'daily' | 'evaluation' | 'photo' | 'video' | 'payment' | 'alert' | 'announcement' | 'system';

export interface AppNotification {
  id: string;
  to: string;
  type: NotifType;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  dedupeKey?: string;
  from?: string;
}

const KEY = 'mbk_nursery_v2_notifications';
const MAX_ITEMS = 500;
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const NOTIF_EVENT = 'mbk:notifications';

export const RECIPIENT_ADMIN = 'admin';
export const recipientTeacher = (teacherId: string) => `t:${teacherId}`;
export const recipientParent = (childId: string) => `c:${childId}`;

const readAll = (): AppNotification[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};
const writeAll = (list: AppNotification[]) => {
  const now = Date.now();
  const kept = list
    .filter(n => now - Date.parse(n.createdAt) < TTL_MS)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_ITEMS);
  try { localStorage.setItem(KEY, JSON.stringify(kept)); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(NOTIF_EVENT)); } catch { /* ignore */ }
};

export const pushNotification = (
  to: string | string[],
  n: { type: NotifType; title: string; body: string; dedupeKey?: string; from?: string }
): number => {
  if (!NOTIFICATIONS_ENABLED) return 0;
  const targets = Array.from(new Set(Array.isArray(to) ? to : [to]));
  if (targets.length === 0) return 0;
  const all = readAll();
  const createdAt = new Date().toISOString();
  const fresh: AppNotification[] = [];
  targets.forEach((t, i) => {
    if (n.dedupeKey && all.some(x => x.to === t && x.dedupeKey === n.dedupeKey)) return;
    fresh.push({ id: `nt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`, to: t, type: n.type,
      title: n.title, body: n.body, createdAt, read: false, dedupeKey: n.dedupeKey, from: n.from });
  });
  if (fresh.length) writeAll([...fresh, ...all]);
  return fresh.length;
};

export const listNotifications = (to: string): AppNotification[] =>
  readAll().filter(n => n.to === to).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const unreadCount = (to: string): number => readAll().filter(n => n.to === to && !n.read).length;

export const markRead = (id: string) => writeAll(readAll().map(n => (n.id === id ? { ...n, read: true } : n)));
export const markAllRead = (to: string) => writeAll(readAll().map(n => (n.to === to ? { ...n, read: true } : n)));
export const clearAll = (to: string) => writeAll(readAll().filter(n => n.to !== to));

export const relativeTime = (iso: string): string => {
  const m = Math.floor((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'أمس' : `منذ ${d} أيام`;
};
