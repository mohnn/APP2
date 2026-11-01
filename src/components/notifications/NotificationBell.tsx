import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CheckCheck, Megaphone, Trash2 } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import {
  AppNotification, NOTIF_EVENT, NotifType, clearAll, listNotifications, markAllRead, markRead, relativeTime, unreadCount,
} from '../../services/notifications';
import type { User } from '../../types/nursery';
import { NotificationComposer } from './NotificationComposer';

const ICONS: Record<NotifType, string> = {
  attendance: '🚌', daily: '📝', evaluation: '⭐', photo: '📸', video: '🎬',
  payment: '💵', alert: '🔔', announcement: '📢', system: '⚙️',
};

const canDeviceNotify = () => typeof Notification !== 'undefined';

/** جرس الإشعارات: يعمل لكل الأدوار (إدارة / معلم / ولي أمر) */
export const NotificationBell: React.FC<{ user: User; recipient: string; className?: string; panelAlign?: 'left' | 'right' }> = ({
  user, recipient, className = '', panelAlign = 'left',
}) => {
  const storage = NurseryStorageService.getInstance();
  const [open, setOpen] = useState(false);
  const [composer, setComposer] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [perm, setPerm] = useState<string>(canDeviceNotify() ? Notification.permission : 'denied');
  const seen = useRef<Set<string> | null>(null);

  const refresh = useCallback(() => {
    const list = listNotifications(recipient);
    setItems(list);
    setUnread(unreadCount(recipient));
    // إشعار على مستوى الجهاز عند وصول إشعار جديد أثناء فتح التطبيق
    if (seen.current === null) { seen.current = new Set(list.map(n => n.id)); return; }
    list.filter(n => !n.read && !seen.current!.has(n.id)).forEach(n => {
      seen.current!.add(n.id);
      try { if (canDeviceNotify() && Notification.permission === 'granted') new Notification(n.title, { body: n.body }); } catch { /* ignore */ }
    });
  }, [recipient]);

  useEffect(() => {
    try { storage.refreshAlertsFor(user); } catch { /* ignore */ }
    refresh();
    const id = setInterval(() => { try { storage.refreshAlertsFor(user); } catch { /* ignore */ } refresh(); }, 15000);
    window.addEventListener(NOTIF_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => { clearInterval(id); window.removeEventListener(NOTIF_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, [user, refresh]);

  const enableDevice = async () => {
    try { setPerm(await Notification.requestPermission()); } catch { /* ignore */ }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 relative"
        title="الإشعارات"
        aria-label="الإشعارات"
      >
        {unread > 0 ? <BellRing className="w-4.5 h-4.5" /> : <Bell className="w-4.5 h-4.5" />}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`fixed inset-x-3 top-[4.25rem] mx-auto max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 text-right overflow-hidden`}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">الإشعارات {unread > 0 && <span className="text-rose-500">({unread} جديد)</span>}</span>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={() => markAllRead(recipient)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800" title="تعليم الكل كمقروء">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {items.length > 0 && (
                  <button onClick={() => clearAll(recipient)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800" title="مسح الكل">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {user.role === 'admin' && (
              <button
                onClick={() => { setOpen(false); setComposer(true); }}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-b border-slate-100 dark:border-slate-800"
              >
                <Megaphone className="w-3.5 h-3.5" /> إرسال إشعار لأولياء الأمور أو المعلمين
              </button>
            )}

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 && <div className="p-6 text-center text-[11px] text-slate-500">لا توجد إشعارات حالياً ✅</div>}
              {items.map(n => (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`w-full text-right flex gap-2.5 p-3 ${n.read ? '' : 'bg-blue-50/70 dark:bg-blue-950/20'}`}
                >
                  <span className="text-lg leading-none mt-0.5">{ICONS[n.type] || '🔔'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{n.title}</span>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    </span>
                    <span className="block text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{n.body}</span>
                    <span className="block text-[10px] text-slate-400 mt-1">{n.from ? `${n.from} · ` : ''}{relativeTime(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>

            {canDeviceNotify() && perm === 'default' && (
              <button onClick={enableDevice} className="w-full py-2 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800">
                🔔 تفعيل تنبيهات الجهاز
              </button>
            )}
          </div>
        </>
      )}

      {composer && <NotificationComposer onClose={() => setComposer(false)} />}
    </div>
  );
};
