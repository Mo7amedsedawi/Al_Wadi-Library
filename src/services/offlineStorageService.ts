/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Offline Storage Service using IndexedDB for Al-Wadi Library
 * Stores downloaded book files (Blobs) and full metadata offline.
 */

export interface OfflineBookRecord {
  bookId: string;
  title: string;
  authorName: string;
  authorId?: string;
  coverImage: string;
  category: string;
  format: 'pdf' | 'epub';
  fileBlob?: Blob;
  fileUrl?: string;
  fileName: string;
  fileSizeMB: number;
  downloadDate: string; // ISO string
}

const DB_NAME = 'alwadi_library_db';
const DB_VERSION = 1;
const STORE_NAME = 'downloaded_books';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
        store.createIndex('format', 'format', { unique: false });
        store.createIndex('downloadDate', 'downloadDate', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB database'));
    };
  });
}

/**
 * Save a downloaded book (Blob + metadata) into IndexedDB
 */
export async function saveBookOffline(record: OfflineBookRecord): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const putRequest = store.put(record);

    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieve all offline downloaded books (metadata + blob reference)
 */
export async function getOfflineBooks(): Promise<OfflineBookRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const records = (getAllRequest.result || []) as OfflineBookRecord[];
        // Sort newest download first
        records.sort((a, b) => new Date(b.downloadDate).getTime() - new Date(a.downloadDate).getTime());
        resolve(records);
      };

      getAllRequest.onerror = () => reject(getAllRequest.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn('Failed to fetch offline books from IndexedDB:', err);
    return [];
  }
}

/**
 * Retrieve a single book record by ID
 */
export async function getOfflineBook(bookId: string): Promise<OfflineBookRecord | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(bookId);

      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
      tx.oncomplete = () => db.close();
    });
  } catch (err) {
    console.warn(`Failed to fetch offline book ${bookId}:`, err);
    return null;
  }
}

/**
 * Delete a book from IndexedDB
 */
export async function deleteOfflineBook(bookId: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const deleteRequest = store.delete(bookId);

    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject(deleteRequest.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Clear all downloaded books from IndexedDB
 */
export async function clearAllOfflineBooks(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Calculate total storage used by offline books in MB
 */
export async function getOfflineStorageUsage(): Promise<{ totalMB: number; count: number }> {
  try {
    const books = await getOfflineBooks();
    const totalBytes = books.reduce((sum, item) => sum + (item.fileBlob?.size || item.fileSizeMB * 1024 * 1024), 0);
    const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
    return {
      totalMB,
      count: books.length,
    };
  } catch (err) {
    return { totalMB: 0, count: 0 };
  }
}
