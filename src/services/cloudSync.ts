/**
 * طبقة المزامنة السحابية: تُبقي نسخة محلية سريعة (localStorage) وتعكس كل تغيير إلى قاعدة بيانات مشتركة،
 * وتستقبل تغييرات الأجهزة الأخرى لحظياً. السحابة هي المرجع عند وجودها؛ ودون إعدادات يعمل التطبيق محلياً.
 */
import { isCloudConfigured } from '../config/firebase';

export interface Rec { id: string; json: string }

/** واجهة قاعدة البيانات البعيدة (Firestore فعلياً، وخادم اختبار أثناء التطوير) */
export interface RemoteDB {
  list(col: string): Promise<Rec[]>;
  upsert(col: string, recs: Rec[]): Promise<void>;
  remove(col: string, ids: string[]): Promise<void>;
  subscribe(col: string, cb: (recs: Rec[]) => void): () => void;
}

/** الجسر بين الطبقة السحابية ومخزن التطبيق المحلي */
export interface LocalBridge {
  getAll(): Record<string, unknown>;
  apply(key: string, value: unknown): void;
}

/** مجموعات سجلات (كل عنصر له id) */
export const SYNC_COLLECTIONS = [
  'attendance', 'auditLogs', 'children', 'classes', 'dailyReports', 'employees', 'evaluations', 'expenses',
  'galleryPhotos', 'guardians', 'kidsAreaSessions', 'levels', 'monthClosings', 'monthlyFees', 'payroll',
  'pickupPersons', 'receipts', 'secondaryIncome', 'teachers', 'users',
];
/** قيم مفردة (كائن إعدادات أو قوائم نصية) */
export const SYNC_DOCS = ['settings', 'deletedParentAccounts', 'deletedTeacherAccounts'];

const DOCS_COL = 'docs';
const META_ID = '_meta';
const MAX_JSON = 950_000; // حد المستند 1MB

let remote: RemoteDB | null = null;
let bridge: LocalBridge | null = null;
let active = false;
let initialized = false;
const last: Record<string, Map<string, string>> = {};
const latest: Record<string, unknown> = {};
const timers: Record<string, ReturnType<typeof setTimeout>> = {};

export const isCloudActive = (): boolean => active;
const isSynced = (key: string) => SYNC_COLLECTIONS.includes(key) || SYNC_DOCS.includes(key);

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });

const createRemote = async (): Promise<RemoteDB | null> => {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('remote') : null;
  if (import.meta.env.VITE_TEST_REMOTE && q) {
    const m = await import('./testRemote');
    return m.createTestRemote(q);
  }
  if (!isCloudConfigured()) return null;
  const m = await import('./firestoreRemote');
  return m.createFirestoreRemote();
};

const parse = (r: Rec): unknown => { try { return JSON.parse(r.json); } catch { return null; } };
const toMap = (recs: Rec[]) => new Map(recs.map(r => [r.id, r.json]));
const sameMap = (a: Map<string, string>, b: Map<string, string> | undefined) => {
  if (!b || a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
};

async function pullAll(): Promise<void> {
  const docs = await remote!.list(DOCS_COL);
  initialized = docs.some(d => d.id === META_ID);
  SYNC_COLLECTIONS.concat(SYNC_DOCS).forEach(k => { last[k] = new Map(); });
  if (!initialized) return; // السحابة فارغة: ننتظر أول دخول للإدارة ليرفع البيانات
  const byId = toMap(docs);
  await Promise.all(SYNC_COLLECTIONS.map(async key => {
    const recs = await remote!.list(key);
    last[key] = toMap(recs);
    bridge!.apply(key, recs.map(parse).filter(v => v !== null));
  }));
  SYNC_DOCS.forEach(key => {
    const json = byId.get(key);
    if (json !== undefined) { last[key] = new Map([[key, json]]); bridge!.apply(key, JSON.parse(json)); }
  });
}

function handleCollection(key: string, recs: Rec[]) {
  if (timers[key]) return; // توجد تعديلات محلية لم تُرسل بعد
  const m = toMap(recs);
  if (sameMap(m, last[key])) return;
  last[key] = m;
  bridge!.apply(key, recs.map(parse).filter(v => v !== null));
}

function handleDocs(recs: Rec[]) {
  recs.forEach(r => {
    if (r.id === META_ID) { initialized = true; return; }
    if (!SYNC_DOCS.includes(r.id) || timers[r.id]) return;
    if (last[r.id]?.get(r.id) === r.json) return;
    last[r.id] = new Map([[r.id, r.json]]);
    try { bridge!.apply(r.id, JSON.parse(r.json)); } catch { /* ignore */ }
  });
}

function startLive() {
  SYNC_COLLECTIONS.forEach(key => remote!.subscribe(key, recs => { if (initialized) handleCollection(key, recs); }));
  remote!.subscribe(DOCS_COL, handleDocs);
}

/** تشغيل المزامنة: يسحب البيانات من السحابة ويطبّقها محلياً ثم يبدأ الاستماع للتغييرات */
export async function initCloud(b: LocalBridge, timeoutMs = 7000): Promise<boolean> {
  bridge = b;
  try { remote = await createRemote(); } catch { remote = null; }
  if (!remote) return false;
  try {
    await withTimeout(pullAll(), timeoutMs);
    active = true;
    startLive();
    return true;
  } catch (e) {
    console.warn('Cloud sync unavailable, working locally:', e);
    remote = null;
    return false;
  }
}

async function flush(key: string) {
  delete timers[key];
  if (!remote) return;
  const val = latest[key];
  try {
    if (SYNC_DOCS.includes(key)) {
      const json = JSON.stringify(val);
      if (json.length > MAX_JSON) { console.warn('Value too large to sync:', key); return; }
      if (last[key]?.get(key) === json) return;
      await remote.upsert(DOCS_COL, [{ id: key, json }]);
      last[key] = new Map([[key, json]]);
      return;
    }
    const arr: any[] = Array.isArray(val) ? val : [];
    const next = new Map<string, string>();
    const up: Rec[] = [];
    for (const item of arr) {
      const id = String(item?.id ?? '');
      if (!id) continue;
      const json = JSON.stringify(item);
      if (json.length > MAX_JSON) { console.warn('Record too large to sync:', key, id); continue; }
      next.set(id, json);
      if (last[key]?.get(id) !== json) up.push({ id, json });
    }
    const del = Array.from(last[key]?.keys() ?? []).filter(id => !next.has(id));
    if (up.length) await remote.upsert(key, up);
    if (del.length) await remote.remove(key, del);
    last[key] = next;
  } catch (e) {
    console.warn('Cloud push failed, will retry:', key, e);
    timers[key] = setTimeout(() => flush(key), 5000);
  }
}

/** يُستدعى من مخزن التطبيق بعد كل حفظ محلي */
export function queuePush(key: string, value: unknown): void {
  if (!active || !initialized || !isSynced(key)) return;
  latest[key] = value;
  if (timers[key]) clearTimeout(timers[key]);
  timers[key] = setTimeout(() => flush(key), 250);
}

/** أول إعداد: ترفع الإدارة بيانات جهازها للسحابة مرة واحدة إذا كانت السحابة فارغة */
export async function seedCloudIfNeeded(): Promise<void> {
  if (!active || initialized || !remote || !bridge) return;
  try {
    const all = bridge.getAll();
    for (const key of SYNC_COLLECTIONS.concat(SYNC_DOCS)) {
      latest[key] = all[key];
      initialized = true; // يسمح لـ flush بالعمل
      await flush(key);
    }
    await remote.upsert(DOCS_COL, [{ id: META_ID, json: JSON.stringify({ at: new Date().toISOString() }) }]);
  } catch (e) {
    initialized = false;
    console.warn('Cloud seed failed:', e);
  }
}
