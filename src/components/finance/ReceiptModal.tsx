import React, { useState } from 'react';
import { X, Share2, Loader2 } from 'lucide-react';
import { PaymentReceipt } from '../../types/nursery';
import { BrandLogo, OfficialNurseryStamp } from '../common/BrandLogo';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { NurseryStorageService } from '../../services/storage';
import { DEFAULT_NURSERY_LOGO_DATA_URL } from '../../services/mockData';
import { renderReceiptPng } from '../../utils/receiptImage';
import { saveOrShareFile } from '../../utils/shareFile';

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  if (!isOpen || !receipt) return null;

  // مشاركة الإيصال كصورة (PNG) عبر واتساب أو أي تطبيق — بدلاً من إرسال نص فقط
  const handleShareWhatsApp = async () => {
    if (sharing) return;
    setSharing(true);
    setShareMsg(null);
    try {
      const logo = NurseryStorageService.getInstance().settings.logoUrl || DEFAULT_NURSERY_LOGO_DATA_URL;
      const png = await renderReceiptPng(receipt, logo);
      const caption =
        `إيصال سداد معتمد - Modern British Kids 🎓\n` +
        `رقم الإيصال: ${receipt.receiptNumber}\n` +
        `${receipt.childName} · المبلغ: ${receipt.amount} ج.م · عن شهر ${receipt.monthName}`;
      const result = await saveOrShareFile(
        png,
        `Receipt-${receipt.receiptNumber}.png`,
        'image/png',
        `إيصال سداد ${receipt.receiptNumber}`,
        caption
      );
      if (result === 'cancelled') setShareMsg({ type: 'error', text: 'تم إلغاء المشاركة.' });
      else if (result === 'shared') setShareMsg({ type: 'ok', text: 'اختر واتساب من القائمة ثم المحادثة لإرسال صورة الإيصال.' });
      else if (result === 'saved-documents') setShareMsg({ type: 'ok', text: 'تم حفظ صورة الإيصال في المستندات: Documents/MBK' });
      else setShareMsg({ type: 'ok', text: 'تم تنزيل صورة الإيصال، أرسلها من الواتساب كصورة.' });
    } catch (e) {
      console.error('Receipt share error:', e);
      const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
      setShareMsg({ type: 'error', text: `تعذر تجهيز صورة الإيصال${detail}. حاول مرة أخرى.` });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans select-none">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Controls Bar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareWhatsApp}
              disabled={sharing}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{sharing ? 'جاري تجهيز الصورة...' : 'مشاركة واتساب (صورة)'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {shareMsg && (
          <div
            className={`px-3 py-2 text-[11px] font-bold no-print shrink-0 ${
              shareMsg.type === 'ok' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {shareMsg.text}
          </div>
        )}

        {/* Official Printable Receipt Content */}
        <div id="receipt-printable" className="flex-1 overflow-y-auto p-5 space-y-4 bg-white text-slate-900 text-xs">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
            <BrandLogo size="md" />

            <div className="text-left font-mono">
              <span className="font-bold text-sm text-blue-900 block">{receipt.receiptNumber}</span>
              <span className="text-[10px] text-slate-500">{receipt.date}</span>
            </div>
          </div>

          <div className="text-center py-1">
            <h2 className="text-base font-bold font-display text-slate-900">إيصال سداد مصروفات معتمد (كاش)</h2>
            <span className="text-[10px] text-slate-500 font-medium">Official Payment Receipt · Cash Only</span>
          </div>

          {/* Child & Guardian Box */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">اسم الطفل:</span>
              <span className="font-bold text-slate-900">{receipt.childName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">معرف الطالب (ID):</span>
              <span className="font-mono font-bold text-blue-700">{receipt.studentId || receipt.childCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ولي الأمر:</span>
              <span className="font-semibold text-slate-800">{receipt.guardianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">عن شهر:</span>
              <span className="font-semibold text-slate-800">{receipt.monthName}</span>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-1">
            <span className="text-[11px] font-bold text-amber-800">المبلغ المحصل نقداً</span>
            <div className="text-2xl font-bold font-mono text-amber-900">
              {receipt.amount.toLocaleString()} ج.م
            </div>
            <span className="text-[10px] text-slate-500 block">
              طريقة الدفع: <span className="font-bold text-slate-800">نقداً (كاش Cash 💵)</span>
            </span>
          </div>

          {/* Remaining Balance & Staff */}
          <div className="space-y-1 text-slate-600 text-[11px] pt-1">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>المتبقي على حساب الطفل:</span>
              <span className={`font-mono font-bold ${receipt.remainingChildBalance === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {receipt.remainingChildBalance === 0 ? '0.00 ج.م (خالص تماماً)' : `${receipt.remainingChildBalance} ج.م`}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span>الموظف المسؤول:</span>
              <span className="font-semibold text-slate-800">{receipt.issuedByUserName}</span>
            </div>
            {receipt.notes && (
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>ملاحظات:</span>
                <span>{receipt.notes}</span>
              </div>
            )}
          </div>

          {/* Official Nursery Rubber Stamp & QR Verification (النقطة 8) */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200">
            <div className="space-y-1 text-[10px] text-slate-500">
              <div className="font-bold text-slate-900 text-xs">ختم الاعتماد الرقمي والمالي</div>
              <div>معتمد وموثق رسمياً من إدارة الحضانة</div>
              <div className="font-mono text-[9px] text-slate-400">IDEMP: {receipt.idempotencyKey.slice(0, 16)}...</div>
            </div>

            {/* Rubber Stamp of Modern British Kids */}
            <div className="flex items-center gap-2">
              <OfficialNurseryStamp size={95} />
              <div className="border p-1 rounded-xl bg-white shadow-xs">
                <QrCodeSvg value={`MBK-REC-VERIFY:${receipt.receiptNumber}:${receipt.amount}`} size={56} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs no-print">
          <span className="text-slate-400 text-[10px]">Modern British Kids Official Receipt</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
