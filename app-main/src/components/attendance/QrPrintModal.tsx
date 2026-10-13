import React, { useState, useEffect } from 'react';
import { X, QrCode, Printer, Download, CheckCircle2, FileDown, Clock, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { BrandLogo, OfficialNurseryStamp } from '../common/BrandLogo';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { printHtmlDocument } from '../../utils/printHelper';

interface QrPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrPrintModal: React.FC<QrPrintModalProps> = ({ isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
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

  // Print poster as PDF
  const handlePrintPdfPoster = () => {
    const posterHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>بوستر كود QR الحضور الرسمي - Modern British Kids</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            body {
              font-family: 'Cairo', system-ui, -apple-system, sans-serif;
              direction: rtl;
              text-align: center;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              background: #ffffff;
            }
            .poster-container {
              border: 6px double #1e3a8a;
              border-radius: 28px;
              padding: 30px 20px;
              max-width: 720px;
              margin: 0 auto;
              background: #ffffff;
            }
            .header-title {
              font-size: 32px;
              font-weight: 900;
              color: #1e3a8a;
              margin: 0 0 4px 0;
            }
            .header-sub {
              font-size: 18px;
              font-weight: 700;
              color: #d97706;
              margin: 0 0 20px 0;
            }
            .instructions {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
              margin: 15px 0 10px 0;
            }
            .qr-box {
              display: inline-block;
              padding: 16px;
              background: #ffffff;
              border: 3px solid #0f172a;
              border-radius: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              margin: 15px 0;
            }
            .qr-box img {
              width: 320px;
              height: 320px;
              display: block;
            }
            .rules-box {
              background: #f8fafc;
              border: 2px solid #cbd5e1;
              border-radius: 16px;
              padding: 16px 20px;
              text-align: right;
              margin: 20px auto;
              max-width: 580px;
              font-size: 15px;
              line-height: 1.8;
            }
            .rules-box strong {
              color: #1e3a8a;
            }
            .footer-note {
              font-size: 12px;
              color: #64748b;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="poster-container">
            <h1 class="header-title">Modern British Kids Nursery</h1>
            <div class="header-sub">حضانة بريطانية دولية للغات · بوابة الحضور والانصراف الذكي</div>

            <div class="instructions">امسح كود QR عبر هاتف ولي الأمر لإثبات حضور الطفل فور الوصول</div>

            <div class="qr-box">
              <img src="${qrDataUrl}" alt="Official QR Code" />
            </div>

            <div class="rules-box">
              <div>⏰ <strong>مواعيد الحضور بالموعد:</strong> من الساعة <strong>07:30 صباحاً</strong> حتى الساعة <strong>08:30 صباحاً</strong>.</div>
              <div>⚠️ <strong>تسجيل التأخير:</strong> أي مسح يتم بعد الساعة <strong>08:30 صباحاً</strong> يسجل تلقائياً في قائمة المتأخرين.</div>
              <div>🚪 <strong>موعد انصراف الطلاب:</strong> الساعة <strong>02:00 ظهراً</strong>.</div>
            </div>

            <div class="footer-note">
              كود QR رسمي مشفر معتمد من إدارة الحضانة (Nihel) · صالح لكافة مراحل الكيدز إريا وكيجي 1
            </div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printHtmlDocument('بوستر كود QR الحضور الرسمي - Modern British Kids', posterHtml);
  };

  // High quality poster PNG download
  const handleDownloadPoster = () => {
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        handlePrintPdfPoster();
        setIsDownloading(false);
        return;
      }

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1000, 1400);

      // Border frame
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 14;
      ctx.strokeRect(30, 30, 940, 1340);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(48, 48, 904, 1304);

      // Header Banner
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(52, 52, 896, 200);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Modern British Kids Nursery', 500, 130);

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('بوابة الحضور والانصراف الذكي المعتمدة', 500, 195);

      // Instructions
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('امسح كود QR عبر كاميرا التطبيق لإثبات الحضور', 500, 320);

      ctx.fillStyle = '#475569';
      ctx.font = '22px sans-serif';
      ctx.fillText('وجه الكاميرا مباشرة نحو المربع لتسجيل الطفل فوراً', 500, 365);

      // Draw QR Code
      const qrImg = new Image();
      qrImg.onload = () => {
        // QR Code Box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(250, 410, 500, 500);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeRect(250, 410, 500, 500);

        ctx.drawImage(qrImg, 260, 420, 480, 480);

        // Rules Section
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(100, 960, 800, 320);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 960, 800, 320);

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('✓ الحضور بالموعد: من 07:30 صباحاً إلى 08:30 صباحاً', 500, 1030);

        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('⚠ أي مسح بعد 08:30 صباحاً يُسجل في قائمة المتأخرين', 500, 1110);

        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('⏰ خروج الطلاب دائماً الساعة 02:00 ظهراً', 500, 1190);

        ctx.fillStyle = '#64748b';
        ctx.font = '18px sans-serif';
        ctx.fillText('نظام الحضور المعتمد · الكيدز إريا وكيجي 1 · إدارة Nihel', 500, 1250);

        // Download trigger
        const a = document.createElement('a');
        a.download = 'Modern-British-Kids-Official-Attendance-QR.png';
        a.href = canvas.toDataURL('image/png');
        a.click();
        setIsDownloading(false);
      };
      qrImg.onerror = () => {
        handlePrintPdfPoster();
        setIsDownloading(false);
      };
      qrImg.src = qrDataUrl || '';
    } catch (e) {
      console.warn('Fallback to PDF print:', e);
      handlePrintPdfPoster();
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
              <span className="text-[10px] text-amber-300">تنزيل وطباعة بوستر PDF للتعليق بمدخل الحضانة</span>
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

            {/* Download & Print Action Buttons (النقطة 4) */}
            <div className="pt-2 no-print grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrintPdfPoster}
                className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>طباعة بوستر (PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPoster}
                disabled={isDownloading}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'جاري التنزيل...' : 'تنزيل صورة البوستر'}</span>
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
