import { GalleryPhoto } from '../types/nursery';
import { dataUrlToBytes } from './pdfFile';
import { FileToSave, SaveResult, saveOrShareFile, saveOrShareFiles } from './shareFile';

const isPng = (dataUrl: string) => dataUrl.startsWith('data:image/png');

const toFile = (photo: GalleryPhoto, index: number): FileToSave => ({
  bytes: dataUrlToBytes(photo.dataUrl),
  fileName: `MBK-Photo-${photo.takenDate}-${String(index + 1).padStart(2, '0')}.${isPng(photo.dataUrl) ? 'png' : 'jpg'}`,
  mimeType: isPng(photo.dataUrl) ? 'image/png' : 'image/jpeg',
});

/** تنزيل/حفظ صورة واحدة */
export const downloadPhoto = (photo: GalleryPhoto, index = 0): Promise<SaveResult> => {
  const f = toFile(photo, index);
  return saveOrShareFile(f.bytes, f.fileName, f.mimeType, 'صورة من Modern British Kids');
};

/** تنزيل/حفظ كل الصور المعروضة دفعة واحدة */
export const downloadAllPhotos = (photos: GalleryPhoto[]): Promise<SaveResult> =>
  saveOrShareFiles(photos.map(toFile), 'صور من Modern British Kids');

/** رسالة للمستخدم بحسب نتيجة الحفظ */
export const saveResultMessage = (result: SaveResult): { ok: boolean; text: string } => {
  switch (result) {
    case 'shared':
      return { ok: true, text: 'اختر مكان الحفظ من القائمة (الصور / الملفات / Drive / واتساب).' };
    case 'saved-documents':
      return { ok: true, text: 'تم الحفظ في مجلد المستندات: Documents/MBK' };
    case 'downloaded':
      return { ok: true, text: 'تم تنزيل الصورة.' };
    default:
      return { ok: false, text: 'تم إلغاء الحفظ.' };
  }
};
