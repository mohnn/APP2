import { NurseryStorageService } from '../services/storage';
import { DEFAULT_NURSERY_LOGO_DATA_URL } from '../services/mockData';
import { buildPdfFromJpegs, dataUrlToBytes } from './pdfFile';
import { saveOrShareFile, SaveResult } from './shareFile';

export interface ReportColumn {
  header: string;
  /** عرض نسبي */
  width: number;
  align?: 'right' | 'center' | 'left';
  mono?: boolean;
}
export interface ReportSection {
  title: string;
  columns: ReportColumn[];
  rows: string[][];
  emptyText?: string;
}
export interface ReportSpec {
  title: string;
  subtitle?: string;
  /** بطاقات الملخص [الاسم، القيمة، النوع] */
  summary?: [string, string, ('good' | 'bad' | 'neutral')?][];
  sections: ReportSection[];
  footer?: string;
}

const W = 1000;
const H = 1414; // نسبة A4
const FONT = "Cairo, 'Segoe UI', Tahoma, sans-serif";
const MONO = "'Courier New', Consolas, monospace";
const NAVY = '#1e3a8a';
const MARGIN = 50;

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise(resolve => {
    const img = new Image();
    const t = setTimeout(() => resolve(null), 4000);
    img.onload = () => { clearTimeout(t); resolve(img); };
    img.onerror = () => { clearTimeout(t); resolve(null); };
    img.src = src;
  });

const fit = (ctx: CanvasRenderingContext2D, text: string, maxW: number): string => {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
};

/** يرسم التقرير على صفحات A4 ويحوّلها إلى ملف PDF */
export const renderReportPdf = async (spec: ReportSpec): Promise<Uint8Array> => {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('bold 30px Cairo'), document.fonts.load('600 22px Cairo')]),
      new Promise(r => setTimeout(r, 2000)),
    ]);
  } catch {}
  const logoUrl = NurseryStorageService.getInstance().settings.logoUrl || DEFAULT_NURSERY_LOGO_DATA_URL;
  const logo = await loadImage(logoUrl);

  const canvases: HTMLCanvasElement[] = [];
  let canvas!: HTMLCanvasElement;
  let ctx!: CanvasRenderingContext2D;
  let y = 0;

  const newPage = (first: boolean) => {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d')!;
    ctx.direction = 'rtl';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, W - 40, H - 40);
    canvases.push(canvas);
    y = first ? 60 : 60;
  };

  newPage(true);

  // ---------- الرأس ----------
  if (logo) {
    const lw = 190;
    const lh = Math.min(140, (logo.naturalHeight / logo.naturalWidth) * lw);
    const dw = Math.min(lw, (logo.naturalWidth / logo.naturalHeight) * lh);
    ctx.drawImage(logo, W - MARGIN - dw, y, dw, lh);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = `22px ${MONO}`;
  ctx.fillText(new Date().toLocaleDateString('en-GB'), MARGIN, y + 40);
  y += 150;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(MARGIN, y, W - 2 * MARGIN, 3);
  y += 50;
  ctx.textAlign = 'center';
  ctx.fillStyle = NAVY;
  ctx.font = `bold 38px ${FONT}`;
  ctx.fillText(spec.title, W / 2, y);
  y += 38;
  if (spec.subtitle) {
    ctx.fillStyle = '#64748b';
    ctx.font = `24px ${FONT}`;
    ctx.fillText(spec.subtitle, W / 2, y);
    y += 20;
  }
  y += 24;

  // ---------- ملخص ----------
  if (spec.summary && spec.summary.length) {
    const perRow = 3;
    const gap = 16;
    const cw = (W - 2 * MARGIN - gap * (perRow - 1)) / perRow;
    const ch = 96;
    spec.summary.forEach((item, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = W - MARGIN - cw - col * (cw + gap);
      const cy = y + row * (ch + gap);
      const tone = item[2] || 'neutral';
      ctx.fillStyle = tone === 'good' ? '#f0fdf4' : tone === 'bad' ? '#fef2f2' : '#f8fafc';
      ctx.fillRect(x, cy, cw, ch);
      ctx.strokeStyle = tone === 'good' ? '#86efac' : tone === 'bad' ? '#fca5a5' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, cy, cw, ch);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = `20px ${FONT}`;
      ctx.fillText(fit(ctx, item[0], cw - 16), x + cw / 2, cy + 32);
      ctx.fillStyle = tone === 'good' ? '#15803d' : tone === 'bad' ? '#b91c1c' : '#0f172a';
      ctx.font = `bold 30px ${MONO}`;
      ctx.fillText(fit(ctx, item[1], cw - 16), x + cw / 2, cy + 72);
    });
    y += Math.ceil(spec.summary.length / perRow) * (ch + gap) + 14;
  }

  // ---------- الجداول ----------
  const ROW_H = 52;
  const drawTableHeader = (sec: ReportSection, colX: { x: number; w: number }[]) => {
    ctx.fillStyle = NAVY;
    ctx.fillRect(MARGIN, y, W - 2 * MARGIN, ROW_H - 6);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 21px ${FONT}`;
    sec.columns.forEach((c, i) => {
      const { x, w } = colX[i];
      ctx.textAlign = 'center';
      ctx.fillText(fit(ctx, c.header, w - 10), x + w / 2, y + 31);
    });
    y += ROW_H;
  };

  for (const sec of spec.sections) {
    if (y > H - 220) { newPage(false); }
    ctx.textAlign = 'right';
    ctx.fillStyle = NAVY;
    ctx.font = `bold 28px ${FONT}`;
    ctx.fillText(sec.title, W - MARGIN, y + 8);
    y += 30;

    const total = sec.columns.reduce((n, c) => n + c.width, 0);
    const colX: { x: number; w: number }[] = [];
    let cx = W - MARGIN;
    sec.columns.forEach(c => {
      const w = ((W - 2 * MARGIN) * c.width) / total;
      colX.push({ x: cx - w, w });
      cx -= w;
    });
    drawTableHeader(sec, colX);

    if (sec.rows.length === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.font = `22px ${FONT}`;
      ctx.fillText(sec.emptyText || 'لا توجد بيانات', W / 2, y + 36);
      y += ROW_H + 20;
      continue;
    }
    sec.rows.forEach((row, ri) => {
      if (y > H - 150) {
        newPage(false);
        drawTableHeader(sec, colX);
      }
      if (ri % 2 === 1) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(MARGIN, y - 6, W - 2 * MARGIN, ROW_H - 4);
      }
      ctx.fillStyle = '#0f172a';
      row.forEach((cell, i) => {
        const col = sec.columns[i];
        const { x, w } = colX[i];
        ctx.font = `${col.mono ? '' : ''}21px ${col.mono ? MONO : FONT}`;
        const t = fit(ctx, String(cell ?? ''), w - 14);
        const align = col.align || 'right';
        ctx.textAlign = align === 'right' ? 'right' : align === 'left' ? 'left' : 'center';
        const tx = align === 'right' ? x + w - 8 : align === 'left' ? x + 8 : x + w / 2;
        ctx.fillText(t, tx, y + 28);
      });
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(MARGIN, y + ROW_H - 8, W - 2 * MARGIN, 1);
      y += ROW_H - 4;
    });
    y += 30;
  }

  if (spec.footer) {
    if (y > H - 130) newPage(false);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = `22px ${FONT}`;
    ctx.fillText(spec.footer, W / 2, y + 10);
  }

  // ---------- ترقيم الصفحات ----------
  canvases.forEach((c, i) => {
    const g = c.getContext('2d')!;
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.fillStyle = '#94a3b8';
    g.font = `18px ${FONT}`;
    g.fillText(`Modern British Kids · صفحة ${i + 1} من ${canvases.length}`, W / 2, H - 38);
  });

  return buildPdfFromJpegs(canvases.map(c => ({ jpeg: dataUrlToBytes(c.toDataURL('image/jpeg', 0.93)), w: W, h: H })));
};

/** يرسم التقرير ثم يحفظه/يشاركه (مشاركة على أندرويد، تنزيل على المتصفح) */
export const shareReportPdf = async (spec: ReportSpec, fileName: string): Promise<SaveResult> => {
  const bytes = await renderReportPdf(spec);
  return saveOrShareFile(bytes, fileName, 'application/pdf', spec.title);
};
