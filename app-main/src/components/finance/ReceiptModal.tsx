import React from 'react';
import { X, Printer, Share2, CheckCircle2, QrCode } from 'lucide-react';
import { PaymentReceipt } from '../../types/nursery';
import { BrandLogo, OfficialNurseryStamp } from '../common/BrandLogo';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { printHtmlDocument } from '../../utils/printHelper';

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
  if (!isOpen || !receipt) return null;

  // Real, reliable print receipt handler (النقطة 8: تشغيل زر طباعة الإيصال)
  const handlePrint = () => {

    const printHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>إيصال سداد - ${receipt.receiptNumber}</title>
          <style>
            @page {
              size: A5 portrait;
              margin: 10mm;
            }
            body {
              font-family: 'Cairo', system-ui, -apple-system, sans-serif;
              direction: rtl;
              text-align: right;
              margin: 0;
              padding: 15px;
              color: #0f172a;
              background: #ffffff;
            }
            .receipt-card {
              border: 3px double #1e3a8a;
              border-radius: 20px;
              padding: 24px;
              max-width: 500px;
              margin: 0 auto;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 14px;
            }
            .title-box {
              text-align: center;
              margin-bottom: 16px;
            }
            .title-box h2 {
              margin: 0;
              font-size: 20px;
              color: #1e3a8a;
            }
            .details-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              padding: 14px;
              margin-bottom: 14px;
              font-size: 13px;
              line-height: 2;
            }
            .details-row {
              display: flex;
              justify-content: space-between;
            }
            .amount-box {
              background: #fef3c7;
              border: 2px dashed #d97706;
              border-radius: 14px;
              padding: 16px;
              text-align: center;
              margin-bottom: 16px;
            }
            .amount-val {
              font-size: 26px;
              font-weight: 900;
              color: #78350f;
              font-family: monospace;
            }
            .stamp-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header-row">
              <div>
                <h3 style="margin:0;color:#1e3a8a;font-size:16px;">Modern British Kids</h3>
                <span style="font-size:11px;color:#64748b;">حضانة بريطانية دولية للغات</span>
              </div>
              <div style="text-align:left;font-family:monospace;">
                <strong style="color:#1e3a8a;font-size:14px;display:block;">${receipt.receiptNumber}</strong>
                <span style="font-size:11px;color:#64748b;">${receipt.date}</span>
              </div>
            </div>

            <div class="title-box">
              <h2>إيصال سداد مصروفات معتمد (كاش)</h2>
              <span style="font-size:11px;color:#64748b;">Official Payment Receipt · Cash Only</span>
            </div>

            <div class="details-box">
              <div class="details-row"><span>اسم الطفل:</span><strong>${receipt.childName}</strong></div>
              <div class="details-row"><span>معرف الطالب (ID):</span><strong style="font-family:monospace;color:#1d4ed8;">${receipt.studentId || receipt.childCode}</strong></div>
              <div class="details-row"><span>ولي الأمر:</span><span>${receipt.guardianName}</span></div>
              <div class="details-row"><span>عن شهر:</span><strong>${receipt.monthName}</strong></div>
            </div>

            <div class="amount-box">
              <div style="font-size:12px;font-weight:bold;color:#92400e;">المبلغ المحصل نقداً</div>
              <div class="amount-val">${receipt.amount.toLocaleString()} ج.م</div>
              <div style="font-size:11px;color:#64748b;">طريقة الدفع: نقداً (كاش Cash 💵)</div>
            </div>

            <div style="font-size:12px;line-height:1.8;margin-bottom:14px;">
              <div class="details-row">
                <span>المتبقي على حساب الطفل:</span>
                <strong style="font-family:monospace;color:${receipt.remainingChildBalance === 0 ? '#059669' : '#dc2626'};">
                  ${receipt.remainingChildBalance === 0 ? '0.00 ج.م (خالص تماماً)' : `${receipt.remainingChildBalance} ج.م`}
                </strong>
              </div>
              <div class="details-row"><span>الموظف المسؤول:</span><span>${receipt.issuedByUserName}</span></div>
            </div>

            <div class="stamp-row">
              <div>
                <strong style="font-size:12px;color:#1e3a8a;display:block;">ختم الاعتماد الرقمي والمالي</strong>
                <span style="font-size:10px;color:#64748b;">معتمد من إدارة Modern British Kids</span>
                <div style="font-size:9px;font-family:monospace;color:#94a3b8;">${receipt.idempotencyKey.slice(0, 16)}</div>
              </div>
              <div style="transform:rotate(-8deg);">
                <div style="border:3px double #1e3a8a;border-radius:50%;width:90px;height:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1e3a8a;font-size:9px;font-weight:bold;text-align:center;">
                  <span>★ معتمد مالياً ★</span>
                  <span style="font-size:8px;">خزينة الحضانة</span>
                  <span style="font-size:7px;">MBK CASH</span>
                </div>
              </div>
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

    printHtmlDocument(`إيصال سداد - ${receipt.receiptNumber}`, printHtml);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `إيصال سداد معتمد - Modern British Kids 🎓\n` +
      `رقم الإيصال: ${receipt.receiptNumber}\n` +
      `اسم الطفل: ${receipt.childName} (ID: ${receipt.studentId || receipt.childCode})\n` +
      `ولي الأمر: ${receipt.guardianName}\n` +
      `المبلغ المسدد: ${receipt.amount} ج.م\n` +
      `عن شهر: ${receipt.monthName}\n` +
      `طريقة الدفع: نقداً (كاش)\n` +
      `المتبقي: ${receipt.remainingChildBalance} ج.م\n` +
      `التاريخ: ${receipt.date}\n` +
      `الموظف المسؤول: ${receipt.issuedByUserName}\n` +
      `نشكركم لثقتكم بحضانة Modern British Kids.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
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
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm active:scale-98"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الإيصال (PDF)</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة واتساب</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

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
