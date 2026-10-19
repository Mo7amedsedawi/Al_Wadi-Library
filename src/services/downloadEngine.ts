/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book } from '../types';
import { saveBookOffline, OfflineBookRecord } from './offlineStorageService';
import { resolveBookFileUrlFromStorage } from './libraryService';

export interface DownloadProgressState {
  bookId: string;
  format: 'pdf' | 'epub';
  loadedBytes: number;
  totalBytes: number;
  percentage: number;
  speedMBps: number;
  status: 'idle' | 'starting' | 'downloading' | 'completed' | 'cancelled' | 'error';
  error?: string;
}

export type DownloadProgressCallback = (state: DownloadProgressState) => void;

/**
 * Sanitizes a filename for cross-platform file saving
 */
export function sanitizeFilename(title: string, authorName?: string, format: string = 'pdf'): string {
  const safeTitle = (title || 'كتاب').replace(/[/\\?%*:|"<>]/g, '-').trim();
  const safeAuthor = (authorName || 'مكتبة الوادي').replace(/[/\\?%*:|"<>]/g, '-').trim();
  return `${safeTitle} - ${safeAuthor}.${format.toLowerCase()}`;
}

/**
 * Resolves the genuine direct file URL from Supabase Storage or book metadata
 */
export async function resolveDirectBookUrl(
  book: Book,
  format: 'pdf' | 'epub' = 'pdf'
): Promise<string | null> {
  // 1. Check if directly available on the book object
  const existingUrl = format === 'epub' ? (book.epubUrl || book.fileUrl) : book.fileUrl;
  if (existingUrl && (existingUrl.startsWith('http://') || existingUrl.startsWith('https://'))) {
    return existingUrl;
  }

  // 2. Query Supabase Storage 'book-files' dynamically to match original uploaded document
  try {
    const storageUrl = await resolveBookFileUrlFromStorage(book, format);
    if (storageUrl) {
      if (format === 'epub') {
        book.epubUrl = storageUrl;
      } else {
        book.fileUrl = storageUrl;
      }
      return storageUrl;
    }
  } catch (err) {
    console.warn('Error resolving book file URL from storage:', err);
  }

  return null;
}

/**
 * Dispatches a native direct file download or opens the file URL directly.
 * Handles Capacitor / Android WebView and standard desktop / mobile browsers.
 */
export function openDirectDownloadUrl(url: string, fileName?: string): void {
  // Check if running inside Capacitor Android native wrapper
  const isCapacitorNative =
    typeof (window as any).Capacitor !== 'undefined' &&
    typeof (window as any).Capacitor.isNativePlatform === 'function' &&
    (window as any).Capacitor.isNativePlatform();

  if (isCapacitorNative) {
    // In Capacitor Android WebView:
    // Calling window.open with '_system' tells Capacitor to emit an Android Intent ACTION_VIEW.
    // This routes the download directly to the Android System Download Manager / external browser,
    // ensuring the complete, original PDF/EPUB is downloaded straight to the device's Downloads directory.
    try {
      const opened = window.open(url, '_system');
      if (!opened) {
        window.open(url, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
    return;
  }

  // In Standard Web Browsers (Desktop & Mobile):
  // Trigger direct download or opening using an anchor element
  const link = document.createElement('a');
  link.href = url;
  if (fileName) {
    link.setAttribute('download', fileName);
  }
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 250);
}

/**
 * Main Direct Download Execution:
 * Resolves the genuine remote URL, dispatches download via browser / system manager,
 * and saves metadata to IndexedDB for offline tracking.
 */
export async function downloadBookDirectly(
  book: Book,
  format: 'pdf' | 'epub' = 'pdf'
): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
  const directUrl = await resolveDirectBookUrl(book, format);

  if (!directUrl) {
    return {
      success: false,
      error: `لم يتم العثور على ملف بصيغة ${format.toUpperCase()} لهذا الكتاب على الخادم.`,
    };
  }

  const fileName = sanitizeFilename(book.title, book.author?.name, format);
  const estimatedMB = parseFloat(book.fileSize) || 8.5;

  // Open / Trigger native direct download
  openDirectDownloadUrl(directUrl, fileName);

  // Store metadata in IndexedDB so the book appears in "تنزيلاتي"
  try {
    const offlineRecord: OfflineBookRecord = {
      bookId: book.id,
      title: book.title,
      authorName: book.author?.name || 'مؤلف غير معروف',
      authorId: book.author?.id,
      coverImage: book.coverImage,
      category: book.category,
      format,
      fileUrl: directUrl,
      fileName,
      fileSizeMB: estimatedMB,
      downloadDate: new Date().toISOString(),
    };
    await saveBookOffline(offlineRecord);
  } catch (dbErr) {
    console.warn('Failed to record download in offline storage:', dbErr);
  }

  return {
    success: true,
    url: directUrl,
    fileName,
  };
}

/**
 * Compatible helper to open or share a downloaded book file URL
 */
export async function openOrShareFile(
  fileRef: string | Blob,
  fileName: string
): Promise<boolean> {
  if (typeof fileRef === 'string') {
    openDirectDownloadUrl(fileRef, fileName);
    return true;
  }

  // Fallback if a Blob is passed
  if (fileRef instanceof Blob) {
    const objectUrl = URL.createObjectURL(fileRef);
    openDirectDownloadUrl(objectUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return true;
  }

  return false;
}

/**
 * Direct Download Engine class for compatibility with callers
 */
export class BookDownloadEngine {
  public cancel(): void {
    // Direct downloads hand off to the browser/OS immediately
  }

  public async startDownload(
    book: Book,
    format: 'pdf' | 'epub' = 'pdf',
    onProgress: DownloadProgressCallback
  ): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    onProgress({
      bookId: book.id,
      format,
      loadedBytes: 0,
      totalBytes: 100,
      percentage: 25,
      speedMBps: 0,
      status: 'starting',
    });

    const result = await downloadBookDirectly(book, format);

    if (result.success) {
      onProgress({
        bookId: book.id,
        format,
        loadedBytes: 100,
        totalBytes: 100,
        percentage: 100,
        speedMBps: 0,
        status: 'completed',
      });
    } else {
      onProgress({
        bookId: book.id,
        format,
        loadedBytes: 0,
        totalBytes: 100,
        percentage: 0,
        speedMBps: 0,
        status: 'error',
        error: result.error,
      });
    }

    return result;
  }
}
