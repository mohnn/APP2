/** خادم اختبار محلي (للتطوير فقط، لا يُضمَّن في النسخة العادية): يحاكي قاعدة البيانات عبر HTTP */
import type { Rec, RemoteDB } from './cloudSync';

export function createTestRemote(base: string): RemoteDB {
  const call = async (path: string, body?: unknown) => {
    const r = await fetch(base + path, body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) });
    return r.json();
  };
  return {
    list: col => call(`/list?col=${encodeURIComponent(col)}`) as Promise<Rec[]>,
    upsert: (col, recs) => call('/upsert', { col, recs }),
    remove: (col, ids) => call('/remove', { col, ids }),
    subscribe(col, cb) {
      const tick = () => call(`/list?col=${encodeURIComponent(col)}`).then(cb).catch(() => {});
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    },
  };
}
