import React, { useRef, useState } from 'react';
import { DatabaseBackup, Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  applyBackup,
  getCurrentSummary,
  getLastBackupAt,
  markBackupDone,
  parseBackupFile,
} from '../../services/backup';
import { saveOrShareFile } from '../../utils/shareFile';
import { askConfirm } from '../../utils/confirmDialog';
import { buildExcelBackup, readRestoreTextFromExcel } from '../../services/excelExport';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

/** كارت النسخ الاحتياطي: إنشاء نسخة واستعادتها (داخل إعدادات الإدارة) */
export const BackupCard: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackupAt());
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const summary = getCurrentSummary();

  const handleCreate = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { bytes, fileName } = await buildExcelBackup();
      const result = await saveOrShareFile(bytes, fileName, XLSX_MIME, 'نسخة احتياطية - Modern British Kids');
      if (result === 'cancelled') {
        setMessage({ type: 'error', text: 'تم إلغاء الحفظ، ولم يتم إنشاء نسخة احتياطية.' });
        return;
      }
      markBackupDone();
      setLastBackup(getLastBackupAt());
      const doneText =
        result === 'shared'
          ? 'تم فتح قائمة المشاركة. اختر مكان الحفظ (Google Drive أو الملفات أو واتساب) ليكتمل حفظ الملف.'
          : result === 'saved-documents'
            ? `تم حفظ الملف على الجهاز في مجلد المستندات: Documents/MBK/${fileName}`
            : `تم تصدير ملف Excel (${fileName}). افتحه للاطلاع على بياناتك، واحتفظ به في مكان آمن للاستعادة.`;
      setMessage({ type: 'ok', text: doneText });
    } catch (e) {
      console.error('Backup error:', e);
      const detail = e instanceof Error && e.message ? ` (${e.message})` : '';
      setMessage({ type: 'error', text: `تعذر حفظ النسخة الاحتياطية${detail}. جرّب مرة أخرى.` });
    } finally {
      setBusy(false);
    }
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(null);
    try {
      const buf = await file.arrayBuffer();
      const head = new Uint8Array(buf.slice(0, 2));
      const isExcel = head[0] === 0x50 && head[1] === 0x4b; // ملف zip (xlsx)
      let text: string;
      if (isExcel) {
        const r = await readRestoreTextFromExcel(buf);
        if (!r.ok) {
          setMessage({ type: 'error', text: r.message });
          return;
        }
        text = r.text;
      } else {
        text = new TextDecoder().decode(buf); // نسخ قديمة بصيغة JSON
      }
      const parsed = parseBackupFile(text);
      if (!parsed.ok) {
        setMessage({ type: 'error', text: parsed.message });
        return;
      }
      const { backup } = parsed;
      const when = backup.createdAt ? formatDate(backup.createdAt) : 'غير معروف';
      const ok = await askConfirm({
        title: 'استعادة النسخة الاحتياطية',
        message:
          `تاريخ النسخة: ${when}\n` +
          `الأطفال: ${backup.summary.children} · الإيصالات: ${backup.summary.receipts}\n\n` +
          `⚠️ سيتم استبدال كل البيانات الحالية في هذا الجهاز ببيانات النسخة. ` +
          `يُنصح بتصدير نسخة من البيانات الحالية أولاً إن كانت مهمة.`,
        confirmText: 'استعادة البيانات',
        danger: true,
      });
      if (!ok) return;
      applyBackup(backup);
      setMessage({ type: 'ok', text: 'تمت استعادة البيانات بنجاح. جاري إعادة تشغيل التطبيق...' });
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.error('Restore error:', err);
      setMessage({ type: 'error', text: 'تعذر قراءة الملف. تأكد أنه ملف نسخة احتياطية صحيح.' });
    }
  };

  return (
    <div className="p-3.5 rounded-3xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 space-y-2.5 mt-4">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs">النسخ الاحتياطي للبيانات 💾</span>
        <DatabaseBackup className="w-4 h-4 text-blue-500" />
      </div>

      <p className="text-[11px] opacity-80 leading-relaxed">
        بياناتك محفوظة على هذا الجهاز فقط. صدّر نسخة بانتظام: ملف Excel فيه كل بياناتك في جداول مرتبة (الأطفال، الحضور، الإيصالات، المصروفات...) ويصلح أيضاً للاستعادة لو اتمسح التطبيق أو تغيّر الموبايل.
      </p>

      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
        <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/40">
          <div className="font-bold text-sm">{summary.children}</div>
          <div className="opacity-70">طفل</div>
        </div>
        <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/40">
          <div className="font-bold text-sm">{summary.receipts}</div>
          <div className="opacity-70">إيصال</div>
        </div>
        <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/40">
          <div className="font-bold text-sm">{summary.employees}</div>
          <div className="opacity-70">موظف</div>
        </div>
        <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-blue-100 dark:border-blue-900/40">
          <div className="font-bold text-sm">{summary.photos}</div>
          <div className="opacity-70">صورة</div>
        </div>
      </div>

      <div className="text-[11px] font-semibold">
        {lastBackup ? (
          <span>آخر نسخة احتياطية: {formatDate(lastBackup)}</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> لم يتم إنشاء أي نسخة احتياطية بعد
          </span>
        )}
      </div>

      {message && (
        <div
          className={`p-2.5 rounded-xl text-[11px] font-bold flex items-start gap-1.5 ${
            message.type === 'ok'
              ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
          }`}
        >
          {message.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="py-2.5 px-3 bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          <span>{busy ? 'جاري التجهيز...' : 'تصدير نسخة Excel'}</span>
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          <span>استعادة من نسخة</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.json,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={handleFileChosen} />
    </div>
  );
};
