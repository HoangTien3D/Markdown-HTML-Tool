import { ProjectAsset } from '../types';

const DB_NAME = 'simple_desdoc_idb';
const DB_VERSION = 1;
const STORE_NAME = 'project_state';
const PROJECT_KEY = 'current_workspace';

export interface LocalProjectData {
  rawMarkdown: string;
  customCss: string;
  assets: ProjectAsset[];
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalProjectToIdb(data: LocalProjectData): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, PROJECT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

export async function loadLocalProjectFromIdb(): Promise<LocalProjectData | null> {
  try {
    const db = await openDb();
    const result = await new Promise<LocalProjectData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(PROJECT_KEY);
      req.onsuccess = () => resolve((req.result as LocalProjectData) || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
  } catch (err) {
    console.warn('IndexedDB load warning:', err);
    return null;
  }
}

export async function clearLocalProjectIdb(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(PROJECT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('IndexedDB clear warning:', err);
  }
}
