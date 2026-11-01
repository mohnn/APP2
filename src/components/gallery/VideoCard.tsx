import React, { useEffect, useState } from 'react';
import { Clock, Download, Trash2 } from 'lucide-react';
import { GalleryVideo, getVideoBlob, videoFileName, videoRemainingMs } from '../../services/videoStore';
import { saveOrShareFile } from '../../utils/shareFile';
import { saveResultMessage } from '../../utils/photoDownload';
import { formatRemaining } from '../../utils/formatRemaining';
import { notify } from '../../utils/notify';

interface Props { video: GalleryVideo; label: string; now?: number; onDelete?: (v: GalleryVideo) => void; }

export const VideoCard: React.FC<Props> = ({ video, label, now, onDelete }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let alive = true;
    getVideoBlob(video.id).then(b => {
      if (!alive) return;
      if (!b) { setMissing(true); return; }
      objectUrl = URL.createObjectURL(b);
      setUrl(objectUrl);
    });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [video.id]);

  const download = async () => {
    const b = await getVideoBlob(video.id);
    if (!b) { notify('تعذر قراءة الفيديو.', 'error'); return; }
    try {
      const bytes = new Uint8Array(await b.arrayBuffer());
      const res = await saveOrShareFile(bytes, videoFileName(video), b.type || 'video/mp4', 'فيديو من Modern British Kids');
      const m = saveResultMessage(res);
      notify(m.text.replace('الصورة', 'الفيديو'), m.ok ? 'success' : 'error');
    } catch { notify('تعذر حفظ الفيديو.', 'error'); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="bg-black aspect-video flex items-center justify-center">
        {url ? <video src={url} controls playsInline preload="metadata" className="w-full h-full" />
          : <span className="text-[11px] text-slate-400">{missing ? 'الفيديو غير متاح' : 'جاري التحميل...'}</span>}
      </div>
      <div className="p-2.5 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{video.caption || 'فيديو'}</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" /> {formatRemaining(videoRemainingMs(video, now))}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-400 truncate">{label} · {video.takenDate} · {(video.sizeBytes / 1048576).toFixed(1)} MB</span>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={download} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> تنزيل
            </button>
            {onDelete && (
              <button onClick={() => onDelete(video)} className="p-1.5 rounded-lg bg-rose-600 text-white" aria-label="حذف الفيديو">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
