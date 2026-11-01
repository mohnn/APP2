import QRCode from 'qrcode';
import { PaymentReceipt } from '../types/nursery';
import { dataUrlToBytes } from './pdfFile';

const FONT = "Cairo, 'Segoe UI', Tahoma, sans-serif";
const MONO = "'Courier New', Consolas, monospace";
const W = 1000;

const loadImage = (src: string, timeoutMs = 4000): Promise<HTMLImageElement | null> =>
  new Promise(resolve => {
    const img = new Image();
    const t = setTimeout(() => resolve(null), timeoutMs);
    img.onload = () => {
      clearTimeout(t);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(null);
    };
    img.src = src;
  });

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** يقسم النص على أسطر بحيث لا يتجاوز العرض المحدد */
const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach(w => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  });
  if (line) lines.push(line);
  return lines.slice(0, 3);
};

/**
 * يرسم الإيصال كصورة PNG (للمشاركة على واتساب).
 * التصميم مطابق لإيصال التطبيق: الشعار، البيانات، المبلغ، المتبقي، الختم، ورمز QR للتحقق.
 */
export const renderReceiptPng = async (receipt: PaymentReceipt, logoUrl: string): Promise<Uint8Array> => {
  // الخط العربي (بحد أقصى ثانيتين حتى لا يتعلق بدون إنترنت)
  try {
    await Promise.race([
      Promise.all([document.fonts.load('bold 40px Cairo'), document.fonts.load('600 26px Cairo')]),
      new Promise(resolve => setTimeout(resolve, 2000)),
    ]);
  } catch {}

  const qrUrl = await QRCode.toDataURL(`MBK-REC-VERIFY:${receipt.receiptNumber}:${receipt.amount}`, {
    width: 300,
    margin: 1,
    errorCorrectionLevel: 'M',
  });
  const [logo, qr] = await Promise.all([loadImage(logoUrl), loadImage(qrUrl)]);

  const notes = (receipt.notes || '').trim();
  const H = notes ? 1420 : 1340;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.direction = 'rtl';

  const NAVY = '#1e3a8a';
  const GRAY = '#64748b';
  const INK = '#0f172a';
  const R = W - 70; // الحافة اليمنى للمحتوى
  const L = 70; // الحافة اليسرى

  // الخلفية والإطار المزدوج
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 8;
  roundRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f59e0b';
  roundRect(ctx, 42, 42, W - 84, H - 84, 20);
  ctx.stroke();

  // ---------- الرأس ----------
  if (logo) {
    const lw = 230;
    const lh = Math.min(170, (logo.naturalHeight / logo.naturalWidth) * lw);
    const dw = Math.min(lw, (logo.naturalWidth / logo.naturalHeight) * lh);
    ctx.drawImage(logo, R - dw, 80, dw, lh);
  } else {
    ctx.fillStyle = NAVY;
    ctx.font = `bold 36px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('Modern British Kids', R, 140);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = NAVY;
  ctx.font = `bold 38px ${MONO}`;
  ctx.fillText(receipt.receiptNumber, L, 130);
  ctx.fillStyle = GRAY;
  ctx.font = `26px ${MONO}`;
  ctx.fillText(receipt.date, L, 175);

  ctx.fillStyle = INK;
  ctx.fillRect(L, 265, W - 2 * L, 3);

  // ---------- العنوان ----------
  ctx.textAlign = 'center';
  ctx.fillStyle = NAVY;
  ctx.font = `bold 42px ${FONT}`;
  ctx.fillText('إيصال سداد مصروفات معتمد (كاش)', W / 2, 335);
  ctx.fillStyle = GRAY;
  ctx.font = `24px ${FONT}`;
  ctx.fillText('Official Payment Receipt · Cash Only', W / 2, 378);

  // ---------- بيانات الطفل ----------
  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, L, 410, W - 2 * L, 300, 22);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  const row = (label: string, value: string, y: number, valueColor = INK, mono = false, bold = true) => {
    ctx.textAlign = 'right';
    ctx.fillStyle = GRAY;
    ctx.font = `26px ${FONT}`;
    ctx.fillText(label, R - 20, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = valueColor;
    ctx.font = `${bold ? 'bold ' : ''}28px ${mono ? MONO : FONT}`;
    ctx.fillText(value, L + 20, y);
  };
  row('اسم الطفل:', receipt.childName, 472);
  row('معرف الطالب (ID):', String(receipt.studentId || receipt.childCode || ''), 543, '#1d4ed8', true);
  row('ولي الأمر:', receipt.guardianName, 614, INK, false, false);
  row('عن شهر:', receipt.monthName, 685);

  // ---------- المبلغ ----------
  ctx.fillStyle = '#fef3c7';
  roundRect(ctx, L, 745, W - 2 * L, 215, 22);
  ctx.fill();
  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#92400e';
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText('المبلغ المحصل نقداً', W / 2, 800);
  ctx.fillStyle = '#78350f';
  ctx.font = `bold 70px ${MONO}`;
  ctx.fillText(`${receipt.amount.toLocaleString('en-US')} ج.م`, W / 2, 885);
  ctx.fillStyle = GRAY;
  ctx.font = `24px ${FONT}`;
  ctx.fillText('طريقة الدفع: نقداً (كاش Cash)', W / 2, 933);

  // ---------- المتبقي والموظف ----------
  let y = 1025;
  const line = (label: string, value: string, color = INK) => {
    ctx.textAlign = 'right';
    ctx.fillStyle = GRAY;
    ctx.font = `26px ${FONT}`;
    ctx.fillText(label, R, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(value, L, y);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(L, y + 18, W - 2 * L, 2);
    y += 62;
  };
  line(
    'المتبقي على حساب الطفل:',
    receipt.remainingChildBalance === 0 ? '0.00 ج.م (خالص تماماً)' : `${receipt.remainingChildBalance} ج.م`,
    receipt.remainingChildBalance === 0 ? '#059669' : '#dc2626'
  );
  line('الموظف المسؤول:', receipt.issuedByUserName);
  if (notes) {
    ctx.font = `24px ${FONT}`;
    const lines = wrap(ctx, notes, W - 2 * L - 160);
    ctx.textAlign = 'right';
    ctx.fillStyle = GRAY;
    ctx.fillText('ملاحظات:', R, y);
    ctx.fillStyle = INK;
    lines.forEach((t, i) => ctx.fillText(t, R - 130, y + i * 34));
    y += Math.max(1, lines.length) * 34 + 20;
  }

  // ---------- الختم و QR ----------
  const fy = H - 215;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(L, fy - 20, W - 2 * L, 3);

  ctx.textAlign = 'right';
  ctx.fillStyle = NAVY;
  ctx.font = `bold 28px ${FONT}`;
  ctx.fillText('ختم الاعتماد الرقمي والمالي', R, fy + 40);
  ctx.fillStyle = GRAY;
  ctx.font = `22px ${FONT}`;
  ctx.fillText('معتمد وموثق رسمياً من إدارة الحضانة', R, fy + 82);
  ctx.fillStyle = '#94a3b8';
  ctx.font = `18px ${MONO}`;
  ctx.fillText(`IDEMP: ${receipt.idempotencyKey.slice(0, 16)}`, R, fy + 118);

  // الختم الدائري
  ctx.save();
  ctx.translate(375, fy + 85);
  ctx.rotate((-8 * Math.PI) / 180);
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = NAVY;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('★ معتمد مالياً ★', 0, -8);
  ctx.font = `16px ${FONT}`;
  ctx.fillText('خزينة الحضانة', 0, 20);
  ctx.font = `bold 14px ${MONO}`;
  ctx.fillText('MBK CASH', 0, 44);
  ctx.restore();

  // رمز QR للتحقق
  if (qr) {
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, L, fy + 5, 160, 160, 14);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.drawImage(qr, L + 8, fy + 13, 144, 144);
  }

  return dataUrlToBytes(canvas.toDataURL('image/png'));
};
