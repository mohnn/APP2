/**
 * معرض الفيديو: بيانات الفيديو (بدون الملف) في localStorage، والملف نفسه في IndexedDB
 * لأن الفيديو أكبر بكثير من حد localStorage. يُحذف الفيديو تلقائياً بعد 24 ساعة مثل الصور.
 */
export interface GalleryVideo {
  id: string;
  childId: string; // معرف الطفل أو 'all'
  caption: string;
  takenDate: string;
  createdAt: string;
  mimeType: string;
  sizeBytes: number;
}

export const VIDEO_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_VIDEO_MB = 200;
export const MAX_VIDEOS_PER_UPLOAD = 3;

const META_KEY = 'mbk_nursery_v2_galleryVideos';
const DB_NAME = 'mbk_videos';
const STORE = 'blobs';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(r.result); };
    t.onerror = t.onabort = () => { db.close(); reject(t.error); };
  });
};

const readMeta = (): GalleryVideo[] => {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '[]'); } catch { return []; }
};
const writeMeta = (list: GalleryVideo[]) => {
  try { localStorage.setItem(META_KEY, JSON.stringify(list)); } catch { /* ignore */ }
};

export const isVideoExpired = (v: GalleryVideo, now = Date.now()): boolean => {
  const t = Date.parse(v.createdAt);
  return Number.isNaN(t) ? false : now - t >= VIDEO_TTL_MS;
};
export const videoRemainingMs = (v: GalleryVideo, now = Date.now()): number => {
  const t = Date.parse(v.createdAt);
  return Number.isNaN(t) ? VIDEO_TTL_MS : Math.max(0, VIDEO_TTL_MS - (now - t));
};

export const listVideos = (): GalleryVideo[] => readMeta().filter(v => !isVideoExpired(v));

export const getVideosForChild = (childId: string): GalleryVideo[] =>
  listVideos()
    .filter(v => v.childId === childId || v.childId === 'all')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getVideoBlob = async (id: string): Promise<Blob | null> => {
  try { return ((await tx('readonly', s => s.get(id))) as Blob) ?? null; } catch { return null; }
};

export const deleteVideo = async (id: string): Promise<void> => {
  writeMeta(readMeta().filter(v => v.id !== id));
  try { await tx('readwrite', s => s.delete(id)); } catch { /* ignore */ }
};

export const purgeExpiredVideos = async (): Promise<void> => {
  const now = Date.now();
  const expired = readMeta().filter(v => isVideoExpired(v, now));
  for (const v of expired) await deleteVideo(v.id);
};

export const deleteVideosForChild = async (childId: string): Promise<void> => {
  for (const v of readMeta().filter(x => x.childId === childId)) await deleteVideo(v.id);
};

export const addVideos = async (
  files: File[], meta: { childId: string; caption: string; takenDate: string }
): Promise<{ success: boolean; message: string; added: number }> => {
  const valid = files.filter(f => f.type.startsWith('video/')).slice(0, MAX_VIDEOS_PER_UPLOAD);
  if (valid.length === 0) return { success: false, message: 'اختر ملفات فيديو فقط.', added: 0 };
  const tooBig = valid.filter(f => f.size > MAX_VIDEO_MB * 1024 * 1024);
  if (tooBig.length) return { success: false, message: `حجم الفيديو أكبر من ${MAX_VIDEO_MB} ميجابايت: ${tooBig[0].name}`, added: 0 };
  const created: GalleryVideo[] = [];
  try {
    for (const f of valid) {
      const id = `vd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await tx('readwrite', s => s.put(f, id));
      created.push({ id, childId: meta.childId, caption: meta.caption.trim(), takenDate: meta.takenDate,
        createdAt: new Date().toISOString(), mimeType: f.type, sizeBytes: f.size });
    }
  } catch {
    for (const v of created) await deleteVideo(v.id);
    return { success: false, message: 'مساحة التخزين على الجهاز ممتلئة. احذف بعض الفيديوهات ثم حاول مرة أخرى.', added: 0 };
  }
  writeMeta([...created, ...readMeta()]);
  return { success: true, message: `تم رفع ${created.length} فيديو بنجاح.`, added: created.length };
};

/** تنزيل/حفظ فيديو (الامتدادات المسموحة في الصفحة المنشورة: mp4 / webm / mov) */
export const videoFileName = (v: GalleryVideo): string => {
  const ext = v.mimeType.includes('webm') ? 'webm' : v.mimeType.includes('quicktime') ? 'mov' : 'mp4';
  return `MBK-Video-${v.takenDate}-${v.id.slice(-5)}.${ext}`;
};
