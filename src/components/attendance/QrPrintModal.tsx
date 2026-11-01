import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { BrandLogo, OfficialNurseryStamp } from '../common/BrandLogo';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { dataUrlToBytes, buildPdfFromJpeg, saveOrSharePdf } from '../../utils/pdfFile';

interface QrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrPrintModal: React.FC<QrPrintModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const qrPayload = 'MBK-NURSERY-GATE-ATTENDANCE-OFFICIAL';

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Pre-generate high-res QR for canvas export
      QRCode.toDataURL(qrPayload, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
      }).then(url => setQrDataUrl(url)).catch(console.error);

      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // رسم البوستر على Canvas ثم تحويله إلى ملف PDF حقيقي (A4) وحفظه/مشاركته
  const handleDownloadPoster = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setStatus(null);

    try {
      // تحميل الخط العربي قبل الرسم (بحد أقصى ثانيتين حتى لا يتعلق الزر بدون إنترنت)
      try {
        await Promise.race([
          Promise.all([document.fonts.load('bold 44px Cairo'), document.fonts.load('600 26px Cairo')]),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
      } catch {}

      const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('qr-image'));
        img.src = qrDataUrl;
      });

      const W = 1000;
      const H = 1400;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      const FONT = "Cairo, 'Segoe UI', Tahoma, sans-serif";

      // الخلفية والإطار
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, 940, 1340);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, 904, 1304);

      // الشريط العلوي
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(52, 52, 896, 200);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 46px ${FONT}`;
      ctx.fillText('Modern British Kids Nursery', 500, 135);
      ctx.fillStyle = '#fde68a';
      ctx.font = `bold 30px ${FONT}`;
      ctx.fillText('بوابة الحضور والانصراف الذكي المعتمدة', 500, 200);

      // التعليمات
      ctx.fillStyle = '#0f172a';
      ctx.font = `bold 34px ${FONT}`;
      ctx.fillText('امسح كود QR عبر كاميرا التطبيق لإثبات الحضور', 500, 325);
      ctx.fillStyle = '#475569';
      ctx.font = `24px ${FONT}`;
      ctx.fillText('وجّه الكاميرا مباشرة نحو الكود لتسجيل الطفل فوراً', 500, 372);

      // كود QR
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(250, 410, 500, 500);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(250, 410, 500, 500);
      ctx.drawImage(qrImg, 260, 420, 480, 480);

      // المواعيد
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(100, 960, 800, 320);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, 960, 800, 320);

      ctx.fillStyle = '#047857';
      ctx.font = `bold 28px ${FONT}`;
      ctx.fillText('الحضور بالموعد: من 07:30 صباحاً إلى 08:30 صباحاً', 500, 1030);
      ctx.fillStyle = '#b45309';
      ctx.fillText('أي مسح بعد 08:30 صباحاً يُسجل في قائمة المتأخرين', 500, 1110);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillText('خروج الطلاب دائماً الساعة 02:00 ظهراً', 500, 1190);
      ctx.fillStyle = '#64748b';
      ctx.font = `20px ${FONT}`;
      ctx.fillText('نظام الحضور المعتمد · بري كيجي وكيجي 1 · إدارة Nihel', 500, 1250);

      // تحويل إلى PDF حقيقي
      const jpegBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.95));
      const pdfBytes = buildPdfFromJpeg(jpegBytes, W, H);
      const result = await saveOrSharePdf(
        pdfBytes,
        'Modern-British-Kids-Attendance-QR.pdf',
        'بوستر كود QR الحضور - Modern British Kids'
      );
      if (result === 'cancelled') {
        setStatus({ type: 'error', text: 'تم إلغاء الحفظ.' });
      } else if (result === 'shared') {
        setStatus({ type: 'ok', text: 'تم فتح قائمة المشاركة. اختر مكان الحفظ (الملفات أو Drive أو واتساب أو الطباعة) ليكتمل حفظ البوستر.' });
      } else if (result === 'saved-documents') {
        setStatus({ type: 'ok', text: 'تم حفظ البوستر في مجلد المستندات: Documents/MBK/Modern-British-Kids-Attendance-QR.pdf' });
      } else {
        setStatus({ type: 'ok', text: 'تم تنزيل ملف البوستر (PDF).' });
      }
    } catch (e) {
      console.error('PDF poster error:', e);
      const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
      setStatus({ type: 'error', text: `تعذر إنشاء أو حفظ ملف PDF للبوستر${detail}. حاول مرة أخرى.` });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans overscroll-contain select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display">بوستر QR كود الحضور الرسمي</h3>
              <span className="text-[10px] text-amber-300">تنزيل بوستر PDF للتعليق بمدخل الحضانة</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Printable QR Poster Container (النقطة 4: كود QR عادي قياسي وتنزيل PDF) */}
        <div className="p-4 overflow-y-auto space-y-3.5">
          <div 
            id="qr-poster-printable"
            className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-blue-400 dark:border-blue-700 text-center space-y-3 shadow-inner"
          >
            <BrandLogo size="md" className="justify-center mx-auto" />

            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                بوابة الحضور والانصراف الذكي
              </h2>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold block">
                Modern British Kids Attendance QR Station
              </span>
            </div>

            {/* Standard Black & White ISO QR Code */}
            <div className="bg-white p-3.5 rounded-2xl inline-block shadow-md border-2 border-slate-900">
              <QrCodeSvg value={qrPayload} size={180} />
            </div>

            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              كود QR قياسي معتمد للمسح عبر كاميرات كافة الهواتف الذكية
            </div>

            {/* Timing Rules Banner (12-hour civilian time) */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-950 dark:text-amber-200 space-y-2 text-right">
              <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>تعليمات ومواعيد الحضور والانصراف:</span>
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                • <span className="font-bold text-emerald-600 dark:text-emerald-400">حضور بالموعد:</span> من الساعة <span className="font-bold">07:30 ص</span> إلى الساعة <span className="font-bold">08:30 ص</span>.
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                • <span className="font-bold text-rose-600 dark:text-rose-400">متأخر:</span> أي مسح بعد الساعة <span className="font-bold">08:30 ص</span> يتم تسجيله في قائمة المتأخرين.
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                • <span className="font-bold text-blue-600 dark:text-blue-400">انصراف الطلاب:</span> موعد الخروج دائماً الساعة <span className="font-bold">02:00 م</span> (ظهراً).
              </div>
            </div>

            {status && (
              <div
                className={`p-2.5 rounded-xl text-[11px] font-bold ${
                  status.type === 'ok'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                }`}
              >
                {status.text}
              </div>
            )}

            {/* زر تنزيل البوستر كملف PDF */}
            <div className="pt-2 no-print">
              <button
                type="button"
                onClick={handleDownloadPoster}
                disabled={isDownloading || !qrDataUrl}
                className="w-full py-3 px-3 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-60 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{isDownloading ? 'جاري إنشاء الملف...' : 'تنزيل البوستر (PDF)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info (Clean, no simulation buttons as requested in Point 6) */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-center text-slate-500 font-medium">
          يتم تثبيت هذا البوستر عند البوابة الرئيسية لتقوم كاميرا ولي الأمر بمسحه فور الوصول
        </div>
      </div>
    </div>
  );
};
