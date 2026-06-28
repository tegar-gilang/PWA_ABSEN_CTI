import { openDB } from 'idb';

const DB_NAME = 'attendance-offline-db';
const STORE_NAME = 'sync-queue';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function addToSyncQueue(type: 'CHECK_IN' | 'CHECK_OUT', payload: any) {
  const db = await initDB();
  await db.add(STORE_NAME, {
    type,
    payload,
    timestamp: new Date().toISOString()
  });
}

export async function getSyncQueue() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function removeFromSyncQueue(id: number) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

export async function clearSyncQueue() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}
