import { saveOrShareFile, SaveResult } from './shareFile';

const A4_W = 595.28;
const A4_H = 841.89;

const ascii = (s: string): Uint8Array => {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
};

/** يحوّل data URL (JPEG) إلى بايتات. */
export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1] || '';
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
};

/**
 * ينشئ ملف PDF حقيقي (صفحة A4 واحدة) يحتوي على صورة JPEG مناسبة للصفحة.
 */
export const buildPdfFromJpeg = (jpeg: Uint8Array, imgW: number, imgH: number): Uint8Array => {
  const scale = Math.min(A4_W / imgW, A4_H / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (A4_W - drawW) / 2;
  const y = (A4_H - drawH) / 2;

  const content = `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;

  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: Uint8Array) => {
    parts.push(chunk);
    length += chunk.length;
  };
  const startObj = (n: number) => {
    offsets[n] = length;
  };

  push(ascii('%PDF-1.4\n'));
  startObj(1);
  push(ascii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));
  startObj(2);
  push(ascii('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'));
  startObj(3);
  push(
    ascii(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] ` +
        `/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`
    )
  );
  startObj(4);
  push(ascii(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`));
  startObj(5);
  push(
    ascii(
      `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
    )
  );
  push(jpeg);
  push(ascii('\nendstream\nendobj\n'));

  const xrefStart = length;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let n = 1; n <= 5; n++) {
    xref += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  push(ascii(xref));

  return concat(parts);
};

/**
 * يحفظ/يشارك ملف PDF (نفس آلية باقي الملفات: مشاركة على أندرويد، وتنزيل على المتصفح).
 */
export const saveOrSharePdf = async (bytes: Uint8Array, fileName: string, title: string): Promise<SaveResult> =>
  saveOrShareFile(bytes, fileName, 'application/pdf', title);

/** ينشئ ملف PDF متعدد الصفحات (A4) كل صفحة منه صورة JPEG */
export const buildPdfFromJpegs = (pages: { jpeg: Uint8Array; w: number; h: number }[]): Uint8Array => {
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: Uint8Array) => {
    parts.push(chunk);
    length += chunk.length;
  };
  const start = (n: number) => {
    offsets[n] = length;
  };

  const n = pages.length;
  // ترقيم الكائنات: 1 فهرس، 2 الصفحات، ثم لكل صفحة (صفحة، محتوى، صورة)
  const pageObj = (i: number) => 3 + i * 3;
  const contentObj = (i: number) => 4 + i * 3;
  const imageObj = (i: number) => 5 + i * 3;
  const total = 2 + n * 3;

  push(ascii('%PDF-1.4\n'));
  start(1);
  push(ascii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'));
  start(2);
  push(ascii(`2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`));

  pages.forEach((pg, i) => {
    const scale = Math.min(A4_W / pg.w, A4_H / pg.h);
    const dw = pg.w * scale;
    const dh = pg.h * scale;
    const x = (A4_W - dw) / 2;
    const y = (A4_H - dh) / 2;
    const content = `q ${dw.toFixed(2)} 0 0 ${dh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`;
    start(pageObj(i));
    push(ascii(`${pageObj(i)} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_W} ${A4_H}] /Resources << /XObject << /Im0 ${imageObj(i)} 0 R >> >> /Contents ${contentObj(i)} 0 R >>\nendobj\n`));
    start(contentObj(i));
    push(ascii(`${contentObj(i)} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`));
    start(imageObj(i));
    push(ascii(`${imageObj(i)} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n`));
    push(pg.jpeg);
    push(ascii('\nendstream\nendobj\n'));
  });

  const xrefStart = length;
  let xref = `xref\n0 ${total + 1}\n0000000000 65535 f \n`;
  for (let k = 1; k <= total; k++) xref += `${String(offsets[k]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  push(ascii(xref));
  return concat(parts);
};
