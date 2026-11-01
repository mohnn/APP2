import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { notify } from '../../utils/notify';

type Kind = 'all' | 'parents' | 'parent' | 'teachers' | 'teacher';

/** نافذة إرسال إشعار من الإدارة */
export const NotificationComposer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const storage = NurseryStorageService.getInstance();
  const [kind, setKind] = useState<Kind>('parents');
  const [targetId, setTargetId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const children = storage.children.filter(c => c.status === 'active');
  const teachers = storage.teachers.filter(t => t.active);

  const send = () => {
    setError('');
    if (!body.trim()) return setError('اكتب نص الإشعار.');
    if ((kind === 'parent' || kind === 'teacher') && !targetId) return setError('اختر المستلم.');
    const n = storage.sendAnnouncement({ kind, id: targetId || undefined }, title, body);
    if (n === 0) return setError('لا يوجد مستلمون لهذا الاختيار.');
    notify(`تم إرسال الإشعار إلى ${n} مستلم`);
    onClose();
  };

  const field = 'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs';

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div dir="rtl" className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-4 space-y-3 text-right" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">إرسال إشعار</h3>
          <button onClick={onClose} aria-label="إغلاق"><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">إلى من؟</label>
          <select value={kind} onChange={e => { setKind(e.target.value as Kind); setTargetId(''); }} className={field}>
            <option value="parents">كل أولياء الأمور</option>
            <option value="parent">ولي أمر طفل محدد</option>
            <option value="teachers">كل المعلمين</option>
            <option value="teacher">معلم محدد</option>
            <option value="all">الجميع (أولياء الأمور والمعلمون)</option>
          </select>
        </div>

        {kind === 'parent' && (
          <select value={targetId} onChange={e => setTargetId(e.target.value)} className={field}>
            <option value="">اختر الطفل...</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.fullName} ({c.code})</option>)}
          </select>
        )}
        {kind === 'teacher' && (
          <select value={targetId} onChange={e => setTargetId(e.target.value)} className={field}>
            <option value="">اختر المعلم...</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        )}

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان الإشعار (اختياري)" className={field} maxLength={60} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="نص الإشعار" rows={4} className={field} maxLength={400} />
        {error && <div className="text-[11px] font-bold text-rose-600">{error}</div>}

        <button onClick={send} className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> إرسال
        </button>
      </div>
    </div>
  );
};
