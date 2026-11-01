import { localDateStr } from '../../utils/dateUtils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ImagePlus, Images, CheckCircle2, AlertTriangle, Loader2, Trash2, Clock } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { GalleryPhoto } from '../../types/nursery';
import { compressImageFile } from '../../utils/imageCompress';
import { PhotoViewerModal } from './PhotoViewerModal';
import { askConfirm } from '../../utils/confirmDialog';
import { formatRemaining } from '../../utils/formatRemaining';
import { downloadPhoto } from '../../utils/photoDownload';
import { VideosPanel } from './VideosPanel';

interface PhotosScreenProps {
  onBack: () => void;
}

const MAX_FILES_PER_UPLOAD = 10;
const todayStr = () => localDateStr();

/** شاشة الإدارة لرفع صور الأطفال (تظهر لولي الأمر في تبويب "الصور") */
export const PhotosScreen: React.FC<PhotosScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<GalleryPhoto[]>(storage.galleryPhotos);
  const [targetChild, setTargetChild] = useState<string>('all');
  const [caption, setCaption] = useState('');
  const [takenDate, setTakenDate] = useState(todayStr());
  const [filterChild, setFilterChild] = useState<string>('everyone');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [mode, setMode] = useState<'photos' | 'videos'>('photos');

  // حذف الصور المنتهية (24 ساعة) وتحديث العدّاد كل نصف دقيقة
  useEffect(() => {
    const tick = () => {
      storage.purgeExpiredPhotos();
      setPhotos([...storage.galleryPhotos]);
      setNow(Date.now());
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const children = storage.children;
  const nameOf = (childId: string) =>
    childId === 'all' ? 'كل الأطفال (صور عامة)' : children.find(c => c.id === childId)?.fullName || 'طفل محذوف';

  const visible = useMemo(() => {
    const list = filterChild === 'everyone' ? photos : photos.filter(p => p.childId === filterChild);
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [photos, filterChild]);

  const totalKB = Math.round(photos.reduce((n, p) => n + p.dataUrl.length, 0) / 1024);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setMessage(null);

    const images = files.filter(f => f.type.startsWith('image/')).slice(0, MAX_FILES_PER_UPLOAD);
    if (images.length === 0) {
      setMessage({ type: 'error', text: 'اختر ملفات صور فقط.' });
      return;
    }
    const skipped = files.length - images.length;

    setBusy(true);
    try {
      const items: { childId: string; dataUrl: string; caption: string; takenDate: string }[] = [];
      for (const f of images) {
        try {
          items.push({ childId: targetChild, dataUrl: await compressImageFile(f), caption, takenDate });
        } catch {
          /* نتجاوز الصورة التالفة */
        }
      }
      if (items.length === 0) {
        setMessage({ type: 'error', text: 'تعذر قراءة الصور المختارة.' });
        return;
      }
      const res = storage.addGalleryPhotos(items);
      if (res.success) {
        setPhotos([...storage.galleryPhotos]);
        setCaption('');
        const extra = skipped > 0 ? ` (تم تجاهل ${skipped} ملف: الحد الأقصى ${MAX_FILES_PER_UPLOAD} صور في المرة أو ليست صوراً)` : '';
        setMessage({ type: 'ok', text: res.message + extra });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = (photo: GalleryPhoto) => {
    storage.deleteGalleryPhoto(photo.id);
    setPhotos([...storage.galleryPhotos]);
  };

  const askDelete = async (photo: GalleryPhoto) => {
    const ok = await askConfirm({
      title: 'حذف الصورة',
      message: 'هل تريد حذف هذه الصورة نهائياً؟ ستختفي أيضاً من حساب ولي الأمر.',
      confirmText: 'حذف',
      danger: true,
    });
    if (ok) handleDelete(photo);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">معرض الصور والفيديو</h2>
          <span className="text-[10px] text-slate-400">ارفع صور وفيديوهات الأطفال لتظهر لأولياء الأمور</span>
        </div>
      </div>

      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button onClick={() => setMode('photos')} className={`flex-1 py-2 rounded-xl transition-all ${mode === 'photos' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>📸 الصور</button>
        <button onClick={() => setMode('videos')} className={`flex-1 py-2 rounded-xl transition-all ${mode === 'videos' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>🎬 الفيديو</button>
      </div>

      {mode === 'videos' ? <VideosPanel /> : (<>
      {/* Upload card */}
      <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-xs">
        <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <ImagePlus className="w-4 h-4 text-blue-600" /> رفع صور جديدة
        </div>

        <div>
          <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">لمن هذه الصور؟</label>
          <select
            value={targetChild}
            onChange={e => setTargetChild(e.target.value)}
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <option value="all">كل الأطفال (صور عامة: فعاليات وأنشطة)</option>
            {children.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullName} (ID: {c.studentId})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">تعليق (اختياري)</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="مثال: نشاط الرسم"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div>
            <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">تاريخ الصورة</label>
            <input
              type="date"
              value={takenDate}
              onChange={e => setTakenDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-left"
            />
          </div>
        </div>

        {message && (
          <div
            className={`p-2.5 rounded-xl text-[11px] font-bold flex items-start gap-1.5 ${
              message.type === 'ok'
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
            }`}
          >
            {message.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="w-full py-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          <span>{busy ? 'جاري تجهيز الصور...' : 'اختيار الصور ورفعها'}</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        <p className="text-[10px] text-slate-400 leading-relaxed">
          ⏳ تُحذف كل صورة تلقائياً بعد 24 ساعة من رفعها (من حساب الإدارة وحساب ولي الأمر)، ويمكنك حذفها يدوياً قبل ذلك بزر الحذف. تُضغط الصور لتوفير المساحة، ويمكن رفع حتى {MAX_FILES_PER_UPLOAD} صور في المرة.
        </p>
      </div>

      {/* Gallery */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Images className="w-4 h-4 text-amber-600" /> الصور المرفوعة ({visible.length})
          </div>
          <select
            value={filterChild}
            onChange={e => setFilterChild(e.target.value)}
            className="max-w-[55%] p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px]"
          >
            <option value="everyone">كل الصور</option>
            <option value="all">الصور العامة</option>
            {children.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            لا توجد صور بعد. ارفع أول صورة من الأعلى 📸
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {visible.map((p, i) => (
              <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                <button onClick={() => setViewerIndex(i)} className="absolute inset-0 w-full h-full" aria-label="عرض الصورة">
                  <img src={p.dataUrl} alt={p.caption || ''} className="w-full h-full object-cover" loading="lazy" />
                </button>
                <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[9px] px-1 py-0.5 truncate pointer-events-none">
                  {p.childId === 'all' ? 'عامة' : nameOf(p.childId)}
                </span>
                <span className="absolute top-1 right-1 bg-black/60 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 pointer-events-none">
                  <Clock className="w-2.5 h-2.5" /> {formatRemaining(storage.photoRemainingMs(p, now))}
                </span>
                <button
                  onClick={() => askDelete(p)}
                  className="absolute top-1 left-1 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md active:scale-95"
                  aria-label="حذف الصورة"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] text-slate-400 text-center">
          إجمالي {photos.length} صورة · حوالي {totalKB} كيلوبايت من مساحة الجهاز
        </div>
      </div>

      </>)}

      {viewerIndex !== null && (
        <PhotoViewerModal
          photos={visible}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          labelFor={p => `${nameOf(p.childId)} · تُحذف بعد ${formatRemaining(storage.photoRemainingMs(p))}`}
          onDelete={handleDelete}
          onDownload={(p, i) => downloadPhoto(p, i)}
        />
      )}
    </div>
  );
};
