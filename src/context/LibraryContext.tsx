import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Book, 
  DownloadItem, 
  UserProfile, 
  ToastMessage, 
  RecentBookItem,
  BookCategory,
  Author,
  CategoryItem,
  BookStatus,
  BookRequest
} from '../types';
import { 
  INITIAL_BOOKS, 
  INITIAL_CATEGORIES, 
  INITIAL_DOWNLOADS, 
  INITIAL_FAVORITES,
  MOCK_AUTHORS 
} from '../data/mockBooks';
import { 
  fetchBooks, 
  saveBookToSupabase,
  deleteBookFromSupabase,
  updateBookCurationInSupabase,
  fetchAuthors,
  saveAuthorToSupabase,
  deleteAuthorFromSupabase,
  fetchCategories,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  createCompleteBookTransactional,
  CompleteBookPayload,
  SequentialUploadProgress,
  recordBookDownload,
  fetchBookRequests,
  submitBookRequest,
  updateBookRequestStatus,
  deleteBookRequest
} from '../services/libraryService';
import { 
  testSupabaseConnection, 
  SupabaseConnectionStatus, 
  isSupabaseConfigured,
  supabase 
} from '../services/supabaseClient';
import { 
  BookDownloadEngine, 
  DownloadProgressState, 
  openOrShareFile,
  downloadBookDirectly,
  openDirectDownloadUrl
} from '../services/downloadEngine';
import { 
  getOfflineBooks, 
  getOfflineBook, 
  deleteOfflineBook, 
  clearAllOfflineBooks, 
  getOfflineStorageUsage, 
  OfflineBookRecord 
} from '../services/offlineStorageService';
import { useAuth } from './AuthContext';
import { useRouter } from './RouterContext';

interface LibraryContextType {
  books: Book[]; // Publicly accessible books (published only)
  allBooks: Book[]; // All books including Drafts & Hidden for Admin CMS
  authors: Author[];
  categoriesList: CategoryItem[];
  categories: typeof INITIAL_CATEGORIES;
  user: UserProfile;
  downloads: DownloadItem[];
  favorites: string[];
  recentBooks: RecentBookItem[];
  theme: 'light' | 'dark';
  isLoading: boolean;
  toasts: ToastMessage[];
  downloadingBookId: string | null;
  downloadProgress: number;
  downloadState: DownloadProgressState | null;
  offlineRecords: OfflineBookRecord[];
  offlineStorageMB: number;
  dataSource: 'supabase' | 'local_fallback';
  dbStatus: SupabaseConnectionStatus | null;
  isSyncing: boolean;
  // Actions
  toggleTheme: () => void;
  toggleFavorite: (bookId: string) => void;
  downloadBook: (book: Book, format?: 'pdf' | 'epub') => Promise<void>;
  cancelDownload: (bookId?: string) => void;
  openDownloadedFile: (bookId: string) => Promise<boolean>;
  deleteDownload: (bookId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  addRecentBook: (bookId: string) => void;
  addBook: (book: Book) => Promise<void>;
  updateBook: (book: Book) => void;
  deleteBook: (bookId: string) => Promise<boolean>;
  deleteBookPermanent: (bookId: string) => Promise<{ success: boolean; error?: string }>;
  toggleBookTrending: (bookId: string) => Promise<void>;
  toggleBookNew: (bookId: string) => Promise<void>;
  setBookOfTheDay: (bookId: string) => Promise<void>;
  updateBookStatus: (bookId: string, status: BookStatus) => Promise<void>;
  createBookWithFiles: (payload: CompleteBookPayload, onProgress?: (p: SequentialUploadProgress) => void) => Promise<{ success: boolean; book?: Book; error?: string }>;
  // Author Actions
  addAuthor: (author: Author) => Promise<{ success: boolean; error?: string }>;
  updateAuthor: (author: Author) => Promise<{ success: boolean; error?: string }>;
  deleteAuthor: (authorId: string) => Promise<{ success: boolean; error?: string }>;
  // Category Actions
  addCategory: (category: CategoryItem) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (category: CategoryItem) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (categoryId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  // Book Requests
  bookRequests: BookRequest[];
  submitNewBookRequest: (title: string) => Promise<{ success: boolean; error?: string }>;
  loadBookRequests: () => Promise<void>;
  updateRequestStatus: (id: string, status: 'pending' | 'fulfilled' | 'rejected') => Promise<void>;
  removeBookRequest: (id: string) => Promise<void>;
  // Misc
  updateUser: (user: Partial<UserProfile>) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
  refreshLoading: (durationMs?: number) => void;
  refetchBooks: () => Promise<void>;
  checkConnection: () => Promise<SupabaseConnectionStatus>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'alwadi_theme',
  FAVORITES: 'alwadi_favorites',
  DOWNLOADS: 'alwadi_downloads',
  RECENT: 'alwadi_recent',
  CUSTOM_BOOKS: 'alwadi_custom_books',
  AUTHORS: 'alwadi_authors',
  CATEGORIES: 'alwadi_categories',
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isGuest, isAdmin, checkProtectedAction, updateProfile } = useAuth();
  const { navigateTo, currentRoute } = useRouter();

  // 1. Theme with instant localStorage initialization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('localStorage not accessible for theme', e);
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // 2. All Books State (Admin view & Master source)
  const [allBooksState, setAllBooksState] = useState<Book[]>(() => {
    try {
      const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_BOOKS);
      if (savedCustom) {
        const parsed: Book[] = JSON.parse(savedCustom);
        const existingIds = new Set(INITIAL_BOOKS.map((b) => b.id));
        const newOnes = parsed.filter((b) => !existingIds.has(b.id));
        return [...newOnes, ...INITIAL_BOOKS];
      }
    } catch (e) {
      console.warn('Failed to parse custom books', e);
    }
    return INITIAL_BOOKS;
  });

  // Public books: only Published books (Drafts & Hidden books MUST NOT appear in public views)
  const publicBooks = useMemo(() => {
    return allBooksState.filter((b) => b.status === undefined || b.status === 'published');
  }, [allBooksState]);

  // If in Admin Dashboard view, books provides all books; otherwise publicBooks
  const activeBooks = useMemo(() => {
    return currentRoute.view === 'admin' ? allBooksState : publicBooks;
  }, [currentRoute.view, allBooksState, publicBooks]);

  // 3. Authors State
  const [authors, setAuthors] = useState<Author[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTHORS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse authors', e);
    }
    return Object.values(MOCK_AUTHORS);
  });

  // 4. Categories State
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse categories', e);
    }
    return INITIAL_CATEGORIES.filter(c => c.id !== 'all').map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      description: c.description,
    }));
  });

  // 5. Data Source & Supabase Connection State
  const [dataSource, setDataSource] = useState<'supabase' | 'local_fallback'>('local_fallback');
  const [dbStatus, setDbStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    title: string, 
    message?: string, 
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 6. Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read favorites', e);
    }
    return INITIAL_FAVORITES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed to save favorites', e);
    }
  }, [favorites]);

  useEffect(() => {
    if (isAuthenticated && user?.id && isSupabaseConfigured()) {
      supabase
        .from('user_favorites')
        .select('book_id')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const dbFavs = data.map((row: any) => row.book_id);
            setFavorites((prev) => Array.from(new Set([...prev, ...dbFavs])));
          }
        });
    }
  }, [isAuthenticated, user?.id]);

  // 7. Recent Books
  const [recentBooks, setRecentBooks] = useState<RecentBookItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read recent books', e);
    }
    return [
      { bookId: 'book-1', viewedAt: '2026-10-12T07:30:00Z', readingProgress: 35 },
      { bookId: 'book-5', viewedAt: '2026-10-11T16:15:00Z', readingProgress: 80 },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentBooks));
    } catch (e) {
      console.warn('Failed to save recent books', e);
    }
  }, [recentBooks]);

  // 8. Downloads & Offline Storage
  const [downloads, setDownloads] = useState<DownloadItem[]>(INITIAL_DOWNLOADS);
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadState, setDownloadState] = useState<DownloadProgressState | null>(null);
  const [offlineRecords, setOfflineRecords] = useState<OfflineBookRecord[]>([]);
  const [offlineStorageMB, setOfflineStorageMB] = useState<number>(0);
  const activeEngineRef = useRef<BookDownloadEngine | null>(null);

  // Sync offline records from IndexedDB on startup
  const syncOfflineStorage = useCallback(async () => {
    try {
      const records = await getOfflineBooks();
      setOfflineRecords(records);
      const usage = await getOfflineStorageUsage();
      setOfflineStorageMB(usage.totalMB);

      if (records.length > 0) {
        const dbDownloads: DownloadItem[] = records.map((rec) => ({
          bookId: rec.bookId,
          progress: 100,
          status: 'completed',
          downloadDate: rec.downloadDate.split('T')[0],
          sizeMB: rec.fileSizeMB,
        }));

        setDownloads((prev) => {
          const merged = [...dbDownloads];
          for (const item of prev) {
            if (!merged.some((m) => m.bookId === item.bookId)) {
              merged.push(item);
            }
          }
          return merged;
        });
      }
    } catch (e) {
      console.warn('Failed to sync offline storage on mount:', e);
    }
  }, []);

  useEffect(() => {
    syncOfflineStorage();
  }, [syncOfflineStorage]);

  // 9. Loading indicator
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshLoading = useCallback((durationMs: number = 400) => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), durationMs);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Connection Checker
  const checkConnection = useCallback(async (): Promise<SupabaseConnectionStatus> => {
    const status = await testSupabaseConnection();
    setDbStatus(status);
    return status;
  }, []);

  // Books Refetcher
  const refetchBooks = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await fetchBooks();
      setDataSource(result.source);
      if (result.source === 'supabase' && result.data.length > 0) {
        setAllBooksState(result.data);
      }
      
      // Also fetch authors and categories from Supabase
      const authorsResult = await fetchAuthors();
      if (authorsResult.source === 'supabase' && authorsResult.data.length > 0) {
        setAuthors(authorsResult.data);
        localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(authorsResult.data));
      }

      const categoriesResult = await fetchCategories();
      if (categoriesResult.source === 'supabase' && categoriesResult.data.length > 0) {
        setCategoriesList(categoriesResult.data);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categoriesResult.data));
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    checkConnection().then((status) => {
      if (status.isConnected && status.tablesFound.books) {
        refetchBooks();
      }
    });
  }, [checkConnection, refetchBooks]);

  // Favorites Toggle
  const toggleFavorite = (bookId: string) => {
    if (isGuest) {
      const allowed = checkProtectedAction(
        { type: 'favorite', targetId: bookId },
        (msg) => {
          showToast('تسجيل الدخول مطلوب', msg, 'warning');
          navigateTo('login');
        }
      );
      if (!allowed) return;
    }

    const isFav = favorites.includes(bookId);
    const targetBook = allBooksState.find((b) => b.id === bookId);

    if (isFav) {
      setFavorites((prev) => prev.filter((id) => id !== bookId));
      showToast('تمت الإزالة من المفضلة', targetBook ? `أزيل "${targetBook.title}" من قائمتك` : undefined, 'info');
      if (isSupabaseConfigured() && user?.id) {
        supabase.from('user_favorites').delete().match({ user_id: user.id, book_id: bookId }).then();
      }
    } else {
      setFavorites((prev) => [bookId, ...prev]);
      showToast('تمت الإضافة إلى المفضلة', targetBook ? `تم حفظ "${targetBook.title}" في قائمتك المفضلة` : undefined, 'success');
      if (isSupabaseConfigured() && user?.id) {
        supabase.from('user_favorites').insert({ user_id: user.id, book_id: bookId }).then();
      }
    }
  };

  // Downloads
  // Downloads Engine Execution (Direct Supabase Storage URL Architecture)
  const downloadBook = async (book: Book, format: 'pdf' | 'epub' = 'pdf') => {
    if (isGuest) {
      const allowed = checkProtectedAction(
        { type: 'download', book, targetId: book.id },
        (msg) => {
          showToast('تسجيل الدخول مطلوب', msg, 'warning');
          navigateTo('login');
        }
      );
      if (!allowed) return;
    }

    setDownloadingBookId(book.id);
    setDownloadProgress(30);

    try {
      showToast(
        'جارٍ تحضير رابط التحميل',
        `يتم استخراج رابط تنزيل "${book.title}" بصيغة ${format.toUpperCase()}...`,
        'info'
      );

      const result = await downloadBookDirectly(book, format);

      if (result.success && result.url) {
        setDownloadProgress(100);

        // Update book format URLs in state cache
        setAllBooksState((prev) =>
          prev.map((b) => {
            if (b.id !== book.id) return b;
            const updated = { ...b };
            if (format === 'epub') {
              updated.epubUrl = result.url;
              if (!updated.formats.includes('epub')) updated.formats = [...updated.formats, 'epub'];
            } else {
              updated.fileUrl = result.url;
              if (!updated.formats.includes('pdf')) updated.formats = [...updated.formats, 'pdf'];
            }
            return updated;
          })
        );

        // Update downloads list
        const estimatedMB = parseFloat(book.fileSize) || 8.5;
        setDownloads((prev) => {
          const filtered = prev.filter((d) => d.bookId !== book.id);
          return [
            {
              bookId: book.id,
              progress: 100,
              status: 'completed',
              downloadDate: new Date().toLocaleDateString('ar-EG'),
              sizeMB: estimatedMB,
            },
            ...filtered,
          ];
        });

        await syncOfflineStorage();

        // Record verified download in local tracking & Supabase
        recordBookDownload(book.id, format);
        setAllBooksState((prev) =>
          prev.map((b) => (b.id === book.id ? { ...b, downloadsCount: (b.downloadsCount || 0) + 1 } : b))
        );

        showToast(
          'بدأ التنزيل المباشر',
          `تم توجيه رابط تحميل "${book.title}" مباشرة إلى مدير تنزيلات جهازك`,
          'success'
        );
      } else {
        showToast('الملف غير متوفر', result.error || 'لم يتم العثور على رابط الملف على الخادم', 'warning');
      }
    } catch (err: any) {
      showToast('خطأ في التنزيل', err?.message || 'تعذر إتمام عملية التوجيه للتنزيل', 'error');
    } finally {
      setDownloadingBookId(null);
      setDownloadProgress(0);
      setDownloadState(null);
    }
  };

  const cancelDownload = (_bookId?: string) => {
    setDownloadingBookId(null);
    setDownloadProgress(0);
    setDownloadState(null);
  };

  const openDownloadedFile = async (bookId: string): Promise<boolean> => {
    const offlineRec = await getOfflineBook(bookId);
    if (offlineRec?.fileUrl) {
      openDirectDownloadUrl(offlineRec.fileUrl, offlineRec.fileName);
      showToast('فتح الملف', `تم فتح رابط "${offlineRec.title}" عبر المتصفح / مدير التنزيلات`, 'success');
      return true;
    }

    if (offlineRec && offlineRec.fileBlob) {
      await openOrShareFile(offlineRec.fileBlob, offlineRec.fileName);
      showToast('فتح الملف', `تم فتح "${offlineRec.title}" عبر تطبيق القراءة بجهازك`, 'success');
      return true;
    }

    // Fallback: If in allBooks, resolve and open direct link
    const targetBook = allBooksState.find((b) => b.id === bookId);
    if (targetBook) {
      showToast('تحميل الملف للفتح', `جارٍ توجيهك لرابط "${targetBook.title}"...`, 'info');
      await downloadBook(targetBook);
      return true;
    }

    showToast('الملف غير متوفر', 'لم يتم العثور على نسخة محفوظة أو رابط متاح لهذا الكتاب', 'error');
    return false;
  };

  const deleteDownload = async (bookId: string) => {
    const targetBook = allBooksState.find((b) => b.id === bookId);
    await deleteOfflineBook(bookId);
    setDownloads((prev) => prev.filter((d) => d.bookId !== bookId));
    await syncOfflineStorage();
    showToast('تم حذف التنزيل', targetBook ? `أزيلت نسخة "${targetBook.title}" من ذاكرة الجهاز` : undefined, 'info');
  };

  const clearAllDownloads = async () => {
    await clearAllOfflineBooks();
    setDownloads([]);
    setOfflineRecords([]);
    setOfflineStorageMB(0);
    showToast('تم إفراغ التنزيلات', 'تم حذف كافة الكتب المحفوظة وإخلاء مساحة التخزين', 'info');
  };

  const addRecentBook = (bookId: string) => {
    setRecentBooks((prev) => {
      const filtered = prev.filter((item) => item.bookId !== bookId);
      const existing = prev.find((item) => item.bookId === bookId);
      return [
        {
          bookId,
          viewedAt: new Date().toISOString(),
          readingProgress: existing?.readingProgress || Math.floor(Math.random() * 40) + 10,
        },
        ...filtered,
      ].slice(0, 8);
    });
  };

  // Add Book
  const addBook = async (newBook: Book) => {
    if (!isAdmin) {
      showToast('غير مصرح لك', 'إضافة الكتب مقتصرة على مديري النظام فقط.', 'error');
      return;
    }

    if (isSupabaseConfigured()) {
      const saveResult = await saveBookToSupabase(newBook);
      if (!saveResult.success) {
        showToast('تعذر حفظ الكتاب في Supabase', saveResult.error || 'فشلت عملية الإدراج في قاعدة البيانات السحابية.', 'error');
        return;
      }
      
      setAllBooksState((prev) => [newBook, ...prev]);
      showToast('تم نشر الكتاب في Supabase', `أضيف "${newBook.title}" إلى قاعدة البيانات السحابية بنجاح.`, 'success');
      return;
    }

    // Only if Supabase is completely unconfigured (offline / demo local mode)
    setAllBooksState((prev) => {
      const updated = [newBook, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BOOKS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist book to localStorage', e);
      }
      return updated;
    });

    showToast('تم حفظ الكتاب بنجاح', `أضيف "${newBook.title}" في المكتبة محلياً.`, 'info');
  };

  // Update Book
  const updateBook = (updatedBook: Book) => {
    if (!isAdmin) {
      showToast('غير مصرح لك', 'تعديل الكتب مقتصر على مديري النظام فقط.', 'error');
      return;
    }

    setAllBooksState((prev) => {
      const updated = prev.map((b) => (b.id === updatedBook.id ? updatedBook : b));
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BOOKS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist updated book', e);
      }
      return updated;
    });

    if (isSupabaseConfigured()) {
      saveBookToSupabase(updatedBook).then();
    }

    showToast('تم تحديث بيانات الكتاب', `حُفظت التعديلات على "${updatedBook.title}"`, 'success');
  };

  // Delete Book (Simple and Permanent with confirmation)
  const deleteBookPermanent = async (bookId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      showToast('غير مصرح لك', 'حذف الكتب مقتصر على مديري النظام فقط.', 'error');
      return { success: false, error: 'غير مصرح' };
    }

    const targetBook = allBooksState.find((b) => b.id === bookId);
    
    // Update local state immediately
    setAllBooksState((prev) => {
      const updated = prev.filter((b) => b.id !== bookId);
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_BOOKS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist deletion', e);
      }
      return updated;
    });

    // Delete from Supabase
    if (isSupabaseConfigured()) {
      const res = await deleteBookFromSupabase(bookId);
      if (!res.success) {
        showToast('تنبيه أثناء الحذف من سوبابيس', res.error, 'warning');
      } else {
        showToast('تم حذف الكتاب نهائياً', `تمت إزالة "${targetBook?.title || bookId}" وسجلاته من قاعدة البيانات`, 'success');
      }
      return res;
    }

    showToast('تم حذف الكتاب', `أزيل "${targetBook?.title || bookId}" من المكتبة`, 'info');
    return { success: true };
  };

  const deleteBook = async (bookId: string): Promise<boolean> => {
    const res = await deleteBookPermanent(bookId);
    return res.success;
  };

  // Book Curation Methods
  const toggleBookTrending = async (bookId: string) => {
    if (!isAdmin) return;
    const target = allBooksState.find((b) => b.id === bookId);
    if (!target) return;
    const nextVal = !target.isTrending;

    setAllBooksState((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, isTrending: nextVal } : b))
    );

    if (isSupabaseConfigured()) {
      await updateBookCurationInSupabase(bookId, { isTrending: nextVal });
    }

    showToast(
      nextVal ? 'تمت إضافة الكتاب للرائجة' : 'أزيل الكتاب من قائمة الرائجة',
      `"${target.title}" ${nextVal ? 'يظهر الآن في شريط الكتب الرائجة' : ''}`,
      'success'
    );
  };

  const toggleBookNew = async (bookId: string) => {
    if (!isAdmin) return;
    const target = allBooksState.find((b) => b.id === bookId);
    if (!target) return;
    const nextVal = !target.isNew;

    setAllBooksState((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, isNew: nextVal } : b))
    );

    if (isSupabaseConfigured()) {
      await updateBookCurationInSupabase(bookId, { isNew: nextVal });
    }

    showToast(
      nextVal ? 'تم تمييز الكتاب كإصدار حديث' : 'أزيلت شارة أحدث الإضافات',
      `"${target.title}"`,
      'success'
    );
  };

  const setBookOfTheDay = async (bookId: string) => {
    if (!isAdmin) return;
    const target = allBooksState.find((b) => b.id === bookId);
    if (!target) return;

    setAllBooksState((prev) =>
      prev.map((b) => ({
        ...b,
        isBookOfTheDay: b.id === bookId,
      }))
    );

    if (isSupabaseConfigured()) {
      await updateBookCurationInSupabase(bookId, { isBookOfTheDay: true });
    }

    showToast('تم تعيين كتاب اليوم', `تم اختيار "${target.title}" ليكون كتاب اليوم المميز في الرئيسية`, 'success');
  };

  const updateBookStatus = async (bookId: string, status: BookStatus) => {
    if (!isAdmin) return;
    const target = allBooksState.find((b) => b.id === bookId);
    if (!target) return;

    setAllBooksState((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, status } : b))
    );

    if (isSupabaseConfigured()) {
      await updateBookCurationInSupabase(bookId, { status });
    }

    const statusLabels: Record<BookStatus, string> = {
      published: 'منشور (يظهر للعامة)',
      draft: 'مسودة (مخفي عن القراء)',
      hidden: 'مخفي مؤقتاً',
    };

    showToast('تم تحديث حالة الكتاب', `أصبحت حالة "${target.title}": ${statusLabels[status]}`, 'info');
  };

  // Transactional Sequential Book Creation (Module 2)
  const createBookWithFiles = async (
    payload: CompleteBookPayload,
    onProgress?: (p: SequentialUploadProgress) => void
  ): Promise<{ success: boolean; book?: Book; error?: string }> => {
    if (!isAdmin) {
      showToast('غير مصرح لك', 'إضافة الكتب وتصعيد الملفات مقتصرة على المشرفين فقط.', 'error');
      return { success: false, error: 'غير مصرح لك' };
    }

    const result = await createCompleteBookTransactional(payload, onProgress);
    if (result.success && result.book) {
      const newBook = result.book;
      setAllBooksState((prev) => {
        const updated = [newBook, ...prev];
        try {
          localStorage.setItem(STORAGE_KEYS.CUSTOM_BOOKS, JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to persist book to localStorage', e);
        }
        return updated;
      });

      // Update author in local authors list if new
      if (payload.authorId && payload.authorName) {
        setAuthors((prev) => {
          if (prev.some((a) => a.id === payload.authorId)) return prev;
          return [...prev, { id: payload.authorId, name: payload.authorName!, bio: payload.authorBio }];
        });
      }

      showToast('تمت إضافة ونشر الكتاب بنجاح!', `أصبح "${newBook.title}" متاحاً الآن في المكتبة.`, 'success');
      return { success: true, book: newBook };
    } else {
      showToast('تعذر إكمال الرفع', result.error || 'حدث خطأ غير متوقع أثناء الرفع', 'error');
      return { success: false, error: result.error };
    }
  };

  // Authors CRUD
  const addAuthor = async (author: Author): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'غير مصرح' };

    setAuthors((prev) => {
      const next = [author, ...prev.filter((a) => a.id !== author.id)];
      try {
        localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (isSupabaseConfigured()) {
      const res = await saveAuthorToSupabase(author);
      if (!res.success) {
        showToast('تم الحفظ محلياً مع تنبيه Supabase', res.error, 'warning');
        return res;
      }
    }

    showToast('تمت إضافة المؤلف بنجاح', `أضيف "${author.name}" إلى دليل المؤلفين`, 'success');
    return { success: true };
  };

  const updateAuthor = async (author: Author): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'غير مصرح' };

    setAuthors((prev) => {
      const next = prev.map((a) => (a.id === author.id ? author : a));
      try {
        localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    // Also update author name in all books of this author
    setAllBooksState((prev) =>
      prev.map((b) => (b.author?.id === author.id ? { ...b, author } : b))
    );

    if (isSupabaseConfigured()) {
      await saveAuthorToSupabase(author);
    }

    showToast('تم تحديث بيانات المؤلف', `حُفظت التعديلات على "${author.name}"`, 'success');
    return { success: true };
  };

  const deleteAuthor = async (authorId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'غير مصرح' };

    const attachedBooks = allBooksState.filter((b) => b.author?.id === authorId);
    if (attachedBooks.length > 0) {
      const msg = `لا يمكن حذف هذا المؤلف لارتباط ${attachedBooks.length} كتاب به في المكتبة.`;
      showToast('تعذر الحذف', msg, 'warning');
      return { success: false, error: msg };
    }

    if (isSupabaseConfigured()) {
      const res = await deleteAuthorFromSupabase(authorId);
      if (!res.success) {
        showToast('تعذر حذف المؤلف من سوبابيس', res.error, 'warning');
        return res;
      }
    }

    setAuthors((prev) => {
      const next = prev.filter((a) => a.id !== authorId);
      try {
        localStorage.setItem(STORAGE_KEYS.AUTHORS, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    showToast('تم حذف المؤلف', 'أزيل المؤلف بنجاح من الدليل', 'info');
    return { success: true };
  };

  // Categories CRUD
  const addCategory = async (cat: CategoryItem): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'غير مصرح' };

    if (categoriesList.some((c) => c.name.trim() === cat.name.trim())) {
      const msg = 'يوجد تصنيف بهذا الاسم مسبقاً.';
      showToast('خطأ في البيانات', msg, 'error');
      return { success: false, error: msg };
    }

    setCategoriesList((prev) => {
      const next = [...prev, cat];
      try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (isSupabaseConfigured()) {
      await saveCategoryToSupabase(cat);
    }

    showToast('تمت إضافة التصنيف', `أضيف تصنيف "${cat.name}" للمكتبة`, 'success');
    return { success: true };
  };

  const updateCategory = async (cat: CategoryItem): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'غير مصرح' };

    setCategoriesList((prev) => {
      const next = prev.map((c) => (c.id === cat.id ? cat : c));
      try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    if (isSupabaseConfigured()) {
      await saveCategoryToSupabase(cat);
    }

    showToast('تم تحديث التصنيف', `حُفظت تعديلات "${cat.name}"`, 'success');
    return { success: true };
  };

  const deleteCategory = async (catId: string, catName: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) return { success: false, error: 'غير مصرح' };

    const attachedBooks = allBooksState.filter((b) => b.category === catName || b.category === catId);
    if (attachedBooks.length > 0) {
      const msg = `لا يمكن حذف التصنيف لارتباط ${attachedBooks.length} كتاب به حالياً.`;
      showToast('تعذر الحذف', msg, 'warning');
      return { success: false, error: msg };
    }

    if (isSupabaseConfigured()) {
      const res = await deleteCategoryFromSupabase(catId, catName);
      if (!res.success) {
        showToast('تعذر حذف التصنيف من سوبابيس', res.error, 'warning');
        return res;
      }
    }

    setCategoriesList((prev) => {
      const next = prev.filter((c) => c.id !== catId);
      try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });

    showToast('تم حذف التصنيف', `أزيل "${catName}" من قائمة التصنيفات`, 'info');
    return { success: true };
  };

  // Book Requests Management
  const [bookRequests, setBookRequests] = useState<BookRequest[]>([]);

  const loadBookRequests = useCallback(async () => {
    try {
      const res = await fetchBookRequests();
      setBookRequests(res.data);
    } catch (e) {
      console.warn('Failed to load book requests:', e);
    }
  }, []);

  useEffect(() => {
    loadBookRequests();
  }, [loadBookRequests]);

  const submitNewBookRequest = async (title: string): Promise<{ success: boolean; error?: string }> => {
    const res = await submitBookRequest(title, user?.id ? { id: user.id, name: user.name } : undefined);
    if (res.success && res.request) {
      setBookRequests((prev) => [res.request!, ...prev]);
      showToast('تم إرسال الطلب بنجاح', `تم استلام اقتراحك لإضافة "${title}". سنعمل على مراجعته وتوفيره.`, 'success');
      return { success: true };
    }
    showToast('تعذر إرسال الطلب', res.error || 'حدث خطأ أثناء حفظ الطلب', 'error');
    return { success: false, error: res.error };
  };

  const updateRequestStatus = async (id: string, status: 'pending' | 'fulfilled' | 'rejected') => {
    await updateBookRequestStatus(id, status);
    setBookRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    showToast('تم تحديث حالة الطلب', undefined, 'info');
  };

  const removeBookRequest = async (id: string) => {
    await deleteBookRequest(id);
    setBookRequests((prev) => prev.filter((r) => r.id !== id));
    showToast('تم حذف الطلب', undefined, 'info');
  };

  const updateUser = (updated: Partial<UserProfile>) => {
    updateProfile(updated);
  };

  return (
    <LibraryContext.Provider
      value={{
        books: activeBooks,
        allBooks: allBooksState,
        authors,
        categoriesList,
        categories: INITIAL_CATEGORIES,
        user,
        downloads,
        favorites,
        recentBooks,
        theme,
        isLoading,
        toasts,
        downloadingBookId,
        downloadProgress,
        downloadState,
        offlineRecords,
        offlineStorageMB,
        dataSource,
        dbStatus,
        isSyncing,
        bookRequests,
        submitNewBookRequest,
        loadBookRequests,
        updateRequestStatus,
        removeBookRequest,
        toggleTheme,
        toggleFavorite,
        downloadBook,
        cancelDownload,
        openDownloadedFile,
        deleteDownload,
        clearAllDownloads,
        addRecentBook,
        addBook,
        updateBook,
        deleteBook,
        deleteBookPermanent,
        toggleBookTrending,
        toggleBookNew,
        setBookOfTheDay,
        updateBookStatus,
        createBookWithFiles,
        addAuthor,
        updateAuthor,
        deleteAuthor,
        addCategory,
        updateCategory,
        deleteCategory,
        updateUser,
        showToast,
        dismissToast,
        refreshLoading,
        refetchBooks,
        checkConnection,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
