import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Download, Loader2 } from 'lucide-react';
import { GalleryPhoto } from '../../types/nursery';
import { askConfirm } from '../../utils/confirmDialog';
import { SaveResult } from '../../utils/shareFile';
import { saveResultMessage } from '../../utils/photoDownload';

interface PhotoViewerModalProps {
  photos: GalleryPhoto[];
  startIndex: number;
  onClose: () => void;
  /** اسم صاحب الصورة (يظهر أسفل الصورة) */
  labelFor?: (photo: GalleryPhoto) => string;
  /** إن وُجدت يظهر زر الحذف (للإدارة فقط) */
  onDelete?: (photo: GalleryPhoto) => void;
  /** إن وُجدت يظهر زر تنزيل الصورة */
  onDownload?: (photo: GalleryPhoto, index: number) => Promise<SaveResult>;
}

const formatDate = (d: string): string => {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
};

/** عارض الصور بملء الشاشة مع التمرير بالسحب أو الأسهم */
export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({ photos, startIndex, onClose, labelFor, onDelete, onDownload }) => {
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, photos.length - 1)));
  const touchStartX = useRef<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (photos.length === 0) onClose();
    else if (index > photos.length - 1) setIndex(photos.length - 1);
  }, [photos.length, index, onClose]);

  const photo = photos[index];
  if (!photo) return null;

  const go = (delta: number) => {
    setNote(null);
    setIndex(i => (i + delta + photos.length) % photos.length);
  };

  const handleDownload = async () => {
    if (!onDownload || saving) return;
    setSaving(true);
    setNote(null);
    try {
      setNote(saveResultMessage(await onDownload(photo, index)));
    } catch (e) {
      const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
      setNote({ ok: false, text: `تعذر حفظ الصورة${detail}.` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 flex flex-col text-white select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px))',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px))',
      }}
      onTouchStart={e => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStartX.current === null || photos.length < 2) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between p-3 shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="إغلاق">
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-slate-300">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-1.5">
          {onDownload && (
            <button
              onClick={handleDownload}
              disabled={saving}
              className="h-9 px-3 rounded-full bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-60 flex items-center justify-center gap-1.5 text-xs font-bold"
              aria-label="تنزيل الصورة"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>تنزيل</span>
            </button>
          )}
        {onDelete ? (
          <button
            onClick={async () => {
              const ok = await askConfirm({
                title: 'حذف الصورة',
                message: 'هل تريد حذف هذه الصورة نهائياً؟ ستختفي أيضاً من حساب ولي الأمر.',
                confirmText: 'حذف',
                danger: true,
              });
              if (ok) onDelete(photo);
            }}
            className="h-9 px-3 rounded-full bg-rose-600/90 hover:bg-rose-600 flex items-center justify-center gap-1.5 text-xs font-bold"
            aria-label="حذف الصورة"
          >
            <Trash2 className="w-4 h-4" />
            <span>حذف</span>
          </button>
        ) : null}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex items-center justify-center">
        <img src={photo.dataUrl} alt={photo.caption || 'صورة'} className="max-w-full max-h-full object-contain" draggable={false} />
        {photos.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute right-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center" aria-label="السابقة">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => go(1)} className="absolute left-2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center" aria-label="التالية">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="p-3 shrink-0 text-center space-y-0.5">
        {note && (
          <div className={`mb-1 inline-block px-3 py-1 rounded-full text-[11px] font-bold ${note.ok ? 'bg-emerald-600/80' : 'bg-rose-600/80'}`}>{note.text}</div>
        )}
        {photo.caption && <div className="text-sm font-bold">{photo.caption}</div>}
        <div className="text-[11px] text-slate-400">
          {labelFor ? labelFor(photo) + ' · ' : ''}
          {formatDate(photo.takenDate)}
        </div>
      </div>
    </div>
  );
};
