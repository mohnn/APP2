import { initializeApp } from 'firebase/app';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, getDocs, onSnapshot, writeBatch, doc,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/firebase';
import type { Rec, RemoteDB } from './cloudSync';

const name = (c: string) => `mbk_${c}`;

/** تنفيذ RemoteDB فوق Cloud Firestore (مع تخزين مؤقت يعمل دون اتصال) */
export function createFirestoreRemote(): RemoteDB {
  const app = initializeApp(FIREBASE_CONFIG);
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  const toRecs = (snap: { docs: { id: string; data(): any }[] }): Rec[] =>
    snap.docs.map(d => ({ id: decodeURIComponent(d.id), json: String(d.data().json ?? '') }));

  const chunked = async (ops: ((b: ReturnType<typeof writeBatch>) => void)[]) => {
    for (let i = 0; i < ops.length; i += 400) {
      const b = writeBatch(db);
      ops.slice(i, i + 400).forEach(op => op(b));
      await b.commit();
    }
  };

  return {
    async list(col) { return toRecs(await getDocs(collection(db, name(col)))); },
    async upsert(col, recs) {
      await chunked(recs.map(r => (b: ReturnType<typeof writeBatch>) => b.set(doc(db, name(col), encodeURIComponent(r.id)), { json: r.json })));
    },
    async remove(col, ids) {
      await chunked(ids.map(id => (b: ReturnType<typeof writeBatch>) => b.delete(doc(db, name(col), encodeURIComponent(id)))));
    },
    subscribe(col, cb) {
      return onSnapshot(collection(db, name(col)), snap => cb(toRecs(snap)), err => console.warn('snapshot error', col, err));
    },
  };
}
