import React, { useEffect, useRef, useState } from 'react';
import { Film, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { GalleryVideo, MAX_VIDEOS_PER_UPLOAD, MAX_VIDEO_MB, addVideos, deleteVideo, listVideos, purgeExpiredVideos } from '../../services/videoStore';
import { localDateStr } from '../../utils/dateUtils';
import { askConfirm } from '../../utils/confirmDialog';
import { VideoCard } from './VideoCard';

/** رفع وإدارة فيديوهات الأطفال (تظهر لولي الأمر في تبويب "الفيديو") */
export const VideosPanel: React.FC = () => {
  const storage = NurseryStorageService.getInstance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<GalleryVideo[]>(listVideos());
  const [targetChild, setTargetChild] = useState('all');
  const [caption, setCaption] = useState('');
  const [takenDate, setTakenDate] = useState(localDateStr());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = () => setVideos(listVideos().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  useEffect(() => {
    const tick = async () => { await purgeExpiredVideos(); refresh(); setNow(Date.now()); };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const nameOf = (id: string) => id === 'all' ? 'عامة' : storage.children.find(c => c.id === id)?.fullName || 'طفل محذوف';

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true); setMsg(null);
    const res = await addVideos(files, { childId: targetChild, caption, takenDate });
    setBusy(false);
    setMsg({ ok: res.success, text: res.message });
    if (res.success) { setCaption(''); refresh(); storage.notifyMedia('video', targetChild, res.added); }
  };

  const askDelete = async (v: GalleryVideo) => {
    if (await askConfirm({ title: 'حذف الفيديو', message: 'هل تريد حذف هذا الفيديو نهائياً؟ سيختفي أيضاً من حساب ولي الأمر.', confirmText: 'حذف', danger: true })) {
      await deleteVideo(v.id); refresh();
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-xs">
        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <Film className="w-4 h-4 text-blue-600" /> رفع فيديو جديد
        </div>
        <div>
          <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">لمن هذا الفيديو؟</label>
          <select value={targetChild} onChange={e => setTargetChild(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <option value="all">كل الأطفال (فعاليات وأنشطة)</option>
            {storage.children.map(c => <option key={c.id} value={c.id}>{c.fullName} (ID: {c.studentId})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">تعليق (اختياري)</label>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="مثال: حفلة التخرج"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">التاريخ</label>
            <input type="date" value={takenDate} onChange={e => setTakenDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left" />
          </div>
        </div>
        {msg && (
          <div className={`p-2.5 rounded-xl text-[11px] font-bold flex items-start gap-1.5 ${msg.ok ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}<span>{msg.text}</span>
          </div>
        )}
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
          className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
          <span>{busy ? 'جاري الرفع...' : 'اختيار الفيديو ورفعه'}</span>
        </button>
        <input ref={fileRef} type="file" accept="video/*" multiple className="hidden" onChange={onFiles} />
        <p className="text-[10px] text-slate-400 leading-relaxed">
          ⏳ يُحذف كل فيديو تلقائياً بعد 24 ساعة من رفعه (من حساب الإدارة وولي الأمر). الحد الأقصى {MAX_VIDEO_MB} ميجابايت للفيديو و{MAX_VIDEOS_PER_UPLOAD} فيديوهات في المرة.
        </p>
      </div>

      <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
        <Film className="w-4 h-4 text-amber-600" /> الفيديوهات المرفوعة ({videos.length})
      </div>
      {videos.length === 0
        ? <div className="p-8 text-center text-slate-400 text-xs rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">لا توجد فيديوهات بعد 🎬</div>
        : <div className="space-y-2.5">{videos.map(v => <VideoCard key={v.id} video={v} now={now} label={nameOf(v.childId)} onDelete={askDelete} />)}</div>}
    </div>
  );
};
