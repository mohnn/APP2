/**
 * النسخ الاحتياطي واستعادة بيانات الحضانة.
 * كل بيانات التطبيق محفوظة في localStorage بمفاتيح تبدأ بالبادئة أدناه.
 */
const PREFIX = 'mbk_nursery_v2_';
const SESSION_KEY = PREFIX + 'auth_session';
const PURGE_STATUS_KEY = PREFIX + 'db_purge_status_v11';
const LAST_BACKUP_KEY = 'mbk_last_backup_at_v1';
const BACKUP_MARK = 'MBK-Nursery-Backup';

export interface BackupSummary {
  children: number;
  receipts: number;
  employees: number;
  photos: number;
  keys: number;
}

export interface ParsedBackup {
  createdAt: string;
  data: Record<string, string>;
  summary: BackupSummary;
}

const countArray = (raw: string | undefined): number => {
  if (!raw) return 0;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.length : 0;
  } catch {
    return 0;
  }
};

const summarize = (data: Record<string, string>): BackupSummary => ({
  children: countArray(data[PREFIX + 'children']),
  receipts: countArray(data[PREFIX + 'receipts']),
  employees: countArray(data[PREFIX + 'employees']),
  photos: countArray(data[PREFIX + 'galleryPhotos']),
  keys: Object.keys(data).length,
});

/** يجمع كل بيانات التطبيق الحالية (بدون جلسة الدخول) */
const collectCurrentData = (): Record<string, string> => {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX) || key === SESSION_KEY) continue;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return data;
};

export const getLastBackupAt = (): string | null => {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
};

export const getCurrentSummary = (): BackupSummary => summarize(collectCurrentData());

/** ينشئ ملف النسخة الاحتياطية (نص JSON) */
export const buildBackupFile = (): { text: string; fileName: string; summary: BackupSummary } => {
  const data = collectCurrentData();
  const now = new Date();
  const payload = {
    app: BACKUP_MARK,
    version: 1,
    createdAt: now.toISOString(),
    data,
  };
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return {
    text: JSON.stringify(payload),
    fileName: `MBK-Backup-${stamp}.json`,
    summary: summarize(data),
  };
};

export const markBackupDone = (): void => {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
};

/** يتحقق من محتوى ملف نسخة احتياطية */
export const parseBackupFile = (text: string): { ok: true; backup: ParsedBackup } | { ok: false; message: string } => {
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, message: 'الملف غير صالح: ليس ملف نسخة احتياطية.' };
  }
  if (!obj || obj.app !== BACKUP_MARK || typeof obj.data !== 'object' || obj.data === null) {
    return { ok: false, message: 'هذا الملف ليس نسخة احتياطية من تطبيق الحضانة.' };
  }
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj.data as Record<string, unknown>)) {
    // نقبل فقط مفاتيح بيانات التطبيق، وبقيم نصية
    if (!key.startsWith(PREFIX) || key === SESSION_KEY || typeof value !== 'string') continue;
    data[key] = value;
  }
  if (Object.keys(data).length === 0) {
    return { ok: false, message: 'النسخة الاحتياطية فارغة ولا تحتوي على بيانات.' };
  }
  return {
    ok: true,
    backup: { createdAt: String(obj.createdAt || ''), data, summary: summarize(data) },
  };
};

/** يستبدل بيانات التطبيق الحالية بمحتوى النسخة (يُعاد تشغيل الصفحة بعدها) */
export const applyBackup = (backup: ParsedBackup): void => {
  const keepSession = localStorage.getItem(SESSION_KEY);
  const keepPurge = localStorage.getItem(PURGE_STATUS_KEY);

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) toRemove.push(key);
  }
  toRemove.forEach(k => localStorage.removeItem(k));

  Object.entries(backup.data).forEach(([k, v]) => localStorage.setItem(k, v));

  // علامة منع التفريغ التلقائي لأول تشغيل: يجب أن تبقى موجودة وإلا تُمسح البيانات المستعادة
  if (!backup.data[PURGE_STATUS_KEY] && keepPurge) localStorage.setItem(PURGE_STATUS_KEY, keepPurge);
  if (keepSession) localStorage.setItem(SESSION_KEY, keepSession);
};
