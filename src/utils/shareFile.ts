import { Capacitor } from '@capacitor/core';

/** نتيجة عملية الحفظ */
export type SaveResult =
  | 'shared'          // فُتحت قائمة المشاركة (أندرويد)
  | 'saved-documents' // حُفظ الملف في مجلد المستندات على الجهاز (أندرويد)
  | 'downloaded'      // تم التنزيل (متصفح)
  | 'cancelled';      // ألغى المستخدم

const bytesToBase64 = (bytes: Uint8Array): string => {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
};

const isCancel = (e: unknown): boolean => {
  const msg = String((e as Error)?.message || e).toLowerCase();
  return msg.includes('cancel') || msg.includes('declined');
};

/**
 * يحفظ/يشارك ملفاً:
 *  - تطبيق أندرويد: يفتح قائمة المشاركة (Drive / الملفات / واتساب ...) وإن فشلت يحفظه في مجلد المستندات.
 *  - المتصفح: تنزيل مباشر (وفي الصفحات المنشورة عبر قدرة التنزيلات الرسمية).
 */
export const saveOrShareFile = async (
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
  title: string,
  text?: string
): Promise<SaveResult> => {
  // ---------- تطبيق أندرويد / iOS ----------
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const data = bytesToBase64(bytes);

    let shareError: unknown = null;
    try {
      const written = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url: written.uri, dialogTitle: 'حفظ أو مشاركة الملف' });
      return 'shared';
    } catch (e) {
      if (isCancel(e)) return 'cancelled';
      shareError = e;
    }

    // بديل: حفظ مباشر في مجلد المستندات
    try {
      await Filesystem.writeFile({
        path: `MBK/${fileName}`,
        data,
        directory: Directory.Documents,
        recursive: true,
      });
      return 'saved-documents';
    } catch {
      throw shareError;
    }
  }

  // ---------- صفحة منشورة (معاينة): قدرة التنزيلات الرسمية ----------
  try {
    const claude = (window as any).claude;
    if (claude && typeof claude.use === 'function') {
      const downloads = await claude.use('downloads');
      if (downloads && typeof downloads.save === 'function') {
        try {
          await downloads.save({ filename: fileName, data: bytes });
          return 'downloaded';
        } catch (e) {
          if (isCancel(e) || (e as any)?.code === 'declined') return 'cancelled';
          throw e;
        }
      }
    }
  } catch (e) {
    if (isCancel(e)) return 'cancelled';
    /* نكمل بالتنزيل العادي */
  }

  // ---------- متصفح عادي ----------
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: [file], title, text });
      return 'downloaded';
    } catch (e) {
      if (isCancel(e) || (e as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
};

export interface FileToSave {
  bytes: Uint8Array;
  fileName: string;
  mimeType: string;
}

/**
 * يحفظ/يشارك عدة ملفات دفعة واحدة:
 *  - أندرويد: قائمة مشاركة واحدة لكل الملفات (حفظ في Drive / الملفات / واتساب ...)
 *  - المتصفح: مشاركة جماعية إن أمكن، وإلا تنزيل الملفات واحداً بعد الآخر.
 */
export const saveOrShareFiles = async (files: FileToSave[], title: string, text?: string): Promise<SaveResult> => {
  if (files.length === 0) return 'cancelled';
  if (files.length === 1) return saveOrShareFile(files[0].bytes, files[0].fileName, files[0].mimeType, title, text);

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    let shareError: unknown = null;
    try {
      const uris: string[] = [];
      for (const f of files) {
        const written = await Filesystem.writeFile({ path: f.fileName, data: bytesToBase64(f.bytes), directory: Directory.Cache });
        uris.push(written.uri);
      }
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, files: uris, dialogTitle: 'حفظ أو مشاركة الصور' });
      return 'shared';
    } catch (e) {
      if (isCancel(e)) return 'cancelled';
      shareError = e;
    }
    try {
      for (const f of files) {
        await Filesystem.writeFile({
          path: `MBK/${f.fileName}`,
          data: bytesToBase64(f.bytes),
          directory: Directory.Documents,
          recursive: true,
        });
      }
      return 'saved-documents';
    } catch {
      throw shareError;
    }
  }

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const webFiles = files.map(f => new File([f.bytes.slice().buffer as ArrayBuffer], f.fileName, { type: f.mimeType }));
  if (nav.canShare && nav.canShare({ files: webFiles }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({ files: webFiles, title, text });
      return 'downloaded';
    } catch (e) {
      if (isCancel(e) || (e as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  for (const f of files) {
    const r = await saveOrShareFile(f.bytes, f.fileName, f.mimeType, title, text);
    if (r === 'cancelled') return 'cancelled';
  }
  return 'downloaded';
};
