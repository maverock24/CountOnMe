const DB_NAME = 'CountOnMeDB';
const STORE_NAME = 'customAudio';

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject('Error opening IndexedDB: ' + (event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getBlob(key: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      if (result) {
        resolve(result as Blob);
      } else {
        resolve(null);
      }
    };

    request.onerror = (event) => {
      reject('Error getting blob from IndexedDB: ' + (event.target as IDBRequest).error);
    };
  });
}

export async function setBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Error setting blob in IndexedDB: ' + (event.target as IDBRequest).error);
    };
  });
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject('Error deleting blob from IndexedDB: ' + (event.target as IDBRequest).error);
    };
  });
}
