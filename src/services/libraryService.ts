import { Book, Author, BookCategory, CategoryItem, BookStatus, BookRequest, RegisteredUser, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_BOOKS, MOCK_AUTHORS, INITIAL_CATEGORIES } from '../data/mockBooks';

export interface DataFetchResult<T> {
  data: T;
  source: 'supabase' | 'local_fallback';
  error?: string;
}

export interface SequentialUploadProgress {
  step: 'validating' | 'uploading_cover' | 'saving_metadata' | 'uploading_files' | 'saving_formats' | 'saving_keywords' | 'completed' | 'failed';
  percentage: number;
  message: string;
}

export interface CompleteBookPayload {
  title: string;
  authorId: string;
  authorName?: string;
  authorBio?: string;
  categoryId?: string;
  category: BookCategory;
  description: string;
  fullExcerpt?: string;
  pages: number;
  status: BookStatus;
  isTrending: boolean;
  isNew: boolean;
  isBookOfTheDay: boolean;
  keywords: string[];
  coverFile?: File | null;
  coverUrlFallback?: string;
  pdfFile?: File | null;
  epubFile?: File | null;
  seriesName?: string;
  series?: string;
  seriesPart?: number;
}

/**
 * Normalizes any category string into one of the 5 official library categories
 */
export function normalizeBookCategory(catName?: string, bookTitle?: string): BookCategory {
  if (catName) {
    const trimmed = catName.trim();
    if (trimmed === 'فانتازيا' || trimmed === 'غموض' || trimmed === 'جاسوسية' || trimmed === 'رومانسي' || trimmed === 'كتب غير روائية') {
      return trimmed as BookCategory;
    }
    if (trimmed === 'فانتازي') {
      return 'فانتازيا';
    }
    if (trimmed === 'تاريخ' || trimmed === 'فلسفة' || trimmed === 'علوم' || trimmed === 'تكنولوجيا') {
      return 'كتب غير روائية';
    }
  }

  if (bookTitle) {
    const t = bookTitle.trim();
    if (t.includes('الرمادي') || t.includes('الهدف')) {
      return 'جاسوسية';
    }
    if (t.includes('انتقام') || t.includes('الزميلة') || t.includes('جريمة') || t.includes('لغز')) {
      return 'غموض';
    }
    if (t.includes('حب') || t.includes('عشق') || t.includes('رومانس')) {
      return 'رومانسي';
    }
    if (t.includes('تاريخ') || t.includes('حضارة') || t.includes('علم') || t.includes('فلسف') || t.includes('سيرة')) {
      return 'كتب غير روائية';
    }
    if (t.includes('الظلال') || t.includes('العظام') || t.includes('الغربان') || t.includes('اللصوص') || t.includes('الخراب')) {
      return 'فانتازيا';
    }
  }

  return 'فانتازيا';
}

/**
 * Maps Supabase raw database row into our typed frontend Book object
 */
export function mapDatabaseRowToBook(row: any): Book {
  const authorData: Author = row.authors || {
    id: row.author_id || 'unknown',
    name: row.author_name || 'مؤلف غير معروف',
    bio: row.author_bio || '',
    avatarUrl: row.author_avatar || '',
  };

  const formats: ('pdf' | 'epub')[] = Array.isArray(row.book_formats) && row.book_formats.length > 0
    ? row.book_formats.map((f: any) => f.format as 'pdf' | 'epub')
    : (row.primary_format ? [row.primary_format as 'pdf' | 'epub'] : ['pdf']);

  const keywords: string[] = Array.isArray(row.book_keywords) && row.book_keywords.length > 0
    ? row.book_keywords.map((k: any) => k.keyword)
    : [row.category_name || 'عام'];

  const pdfFormat = Array.isArray(row.book_formats) ? row.book_formats.find((f: any) => f.format === 'pdf') : null;
  const epubFormat = Array.isArray(row.book_formats) ? row.book_formats.find((f: any) => f.format === 'epub') : null;

  const category = normalizeBookCategory(row.category_name, row.title);

  // Series name directly from Supabase column books.series_name (or books.series)
  const rawSeries = row.series_name ?? row.series;
  const seriesName = rawSeries && String(rawSeries).trim() ? String(rawSeries).trim() : undefined;
  const seriesPart = row.series_part !== null && row.series_part !== undefined ? Number(row.series_part) : undefined;

  return {
    id: String(row.id),
    title: row.title,
    author: authorData,
    description: row.description || '',
    fullExcerpt: row.full_excerpt || row.description || '',
    category,
    coverImage: row.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80',
    formats,
    publishDate: row.publish_date || new Date().toISOString(),
    keywords,
    pages: Number(row.pages) || 120,
    rating: Number(row.rating) || 4.5,
    ratingsCount: Number(row.ratings_count) || 10,
    isTrending: Boolean(row.is_trending),
    isNew: Boolean(row.is_new),
    isBookOfTheDay: Boolean(row.is_book_of_the_day),
    status: (row.status || 'published') as BookStatus,
    fileSize: pdfFormat?.file_size || epubFormat?.file_size || row.file_size || '8.5 MB',
    format: (formats[0]?.toUpperCase() as 'PDF' | 'EPUB') || 'PDF',
    fileUrl: pdfFormat?.file_url || row.file_url,
    epubUrl: epubFormat?.file_url,
    readTimeHours: Math.ceil((Number(row.pages) || 120) / 35),
    downloadsCount: Number(row.downloads_count) || getLocalDownloadsCount(String(row.id)),
    seriesName,
    series: seriesName, // Alias for backward compatibility
    seriesPart,
  };
}

/**
 * Fetches all books from Supabase with graceful fallback
 */
export async function fetchBooks(): Promise<DataFetchResult<Book[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: INITIAL_BOOKS,
      source: 'local_fallback',
      error: 'لم يتم تهيئة متغيرات VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY',
    };
  }

  try {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        authors (*),
        book_formats (format, file_url, file_size),
        book_keywords (keyword)
      `)
      .order('publish_date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch returned error, falling back to local dataset:', error.message);
      return {
        data: INITIAL_BOOKS,
        source: 'local_fallback',
        error: `تعذر جلب البيانات من سوبابيس (${error.message}). يعمل التطبيق في الوضع المحلي.`,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: INITIAL_BOOKS,
        source: 'local_fallback',
        error: 'جدول books موجود في Supabase ولكنه فارغ حالياً. تم تحميل البيانات الأولية للعرض.',
      };
    }

    const mappedBooks: Book[] = data.map(mapDatabaseRowToBook);

    // Auto-resolve real PDF and EPUB files from Supabase Storage if book_formats is empty or unlinked
    const booksNeedingFiles = mappedBooks.filter((b) => !b.fileUrl);
    if (booksNeedingFiles.length > 0) {
      try {
        const { data: storageFiles, error: storageErr } = await supabase.storage
          .from('book-files')
          .list('documents', { limit: 100 });

        if (!storageErr && storageFiles && storageFiles.length > 0) {
          const backfillRows: any[] = [];

          mappedBooks.forEach((book) => {
            if (!book.fileUrl) {
              const idMatch = book.id.match(/^book-(\d+)/);
              const bookTimestamp = idMatch ? parseInt(idMatch[1], 10) : (book.publishDate ? new Date(book.publishDate).getTime() : 0);

              if (bookTimestamp > 0) {
                // Find matching PDF (file created within 45 seconds of book ID timestamp)
                const matchingPdf = storageFiles.find((f) => {
                  if (!f.name.toLowerCase().endsWith('.pdf')) return false;
                  const fMatch = f.name.match(/^(\d+)-/);
                  if (!fMatch) return false;
                  return Math.abs(parseInt(fMatch[1], 10) - bookTimestamp) < 45000;
                });

                if (matchingPdf) {
                  const { data: pUrl } = supabase.storage.from('book-files').getPublicUrl(`documents/${matchingPdf.name}`);
                  book.fileUrl = pUrl.publicUrl;
                  if (!book.formats.includes('pdf')) book.formats.push('pdf');
                  backfillRows.push({
                    id: crypto.randomUUID(),
                    book_id: book.id,
                    format: 'pdf',
                    file_url: pUrl.publicUrl,
                    file_size: book.fileSize || '8.5 MB',
                  });
                }

                // Find matching EPUB
                const matchingEpub = storageFiles.find((f) => {
                  if (!f.name.toLowerCase().endsWith('.epub')) return false;
                  const fMatch = f.name.match(/^(\d+)-/);
                  if (!fMatch) return false;
                  return Math.abs(parseInt(fMatch[1], 10) - bookTimestamp) < 45000;
                });

                if (matchingEpub) {
                  const { data: eUrl } = supabase.storage.from('book-files').getPublicUrl(`documents/${matchingEpub.name}`);
                  book.epubUrl = eUrl.publicUrl;
                  if (!book.formats.includes('epub')) book.formats.push('epub');
                  backfillRows.push({
                    id: crypto.randomUUID(),
                    book_id: book.id,
                    format: 'epub',
                    file_url: eUrl.publicUrl,
                    file_size: book.fileSize || '8.5 MB',
                  });
                }
              }
            }
          });

          // Opportunistic background sync to book_formats in Supabase
          if (backfillRows.length > 0) {
            Promise.resolve(supabase.from('book_formats').insert(backfillRows))
              .then(({ error: syncErr }) => {
                if (syncErr) {
                  console.warn('Background sync to book_formats notice:', syncErr.message);
                } else {
                  console.log(`Successfully synced ${backfillRows.length} formats to book_formats table.`);
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Storage files auto-resolution warning:', err);
      }
    }

    return {
      data: mappedBooks,
      source: 'supabase',
    };
  } catch (err: any) {
    return {
      data: INITIAL_BOOKS,
      source: 'local_fallback',
      error: err?.message || 'خطأ في الاتصال بالشبكة مع سوبابيس',
    };
  }
}

/**
 * Saves or updates book record in Supabase
 */
export async function saveBookToSupabase(book: Book): Promise<{ success: boolean; source: 'supabase' | 'local'; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, source: 'local' };
  }

  try {
    // 1. Upsert Author
    if (book.author?.id) {
      await supabase.from('authors').upsert({
        id: book.author.id,
        name: book.author.name,
        bio: book.author.bio || '',
        avatar_url: book.author.avatarUrl || '',
      });
    }

    // 2. Insert/Update Book row
    const upsertPayload: any = {
      id: book.id,
      title: book.title,
      author_id: book.author?.id || null,
      category_name: book.category,
      description: book.description,
      full_excerpt: book.fullExcerpt || '',
      cover_image: book.coverImage,
      pages: book.pages,
      rating: book.rating || 4.5,
      ratings_count: book.ratingsCount || 1,
      publish_date: book.publishDate,
      is_trending: book.isTrending || false,
      is_new: book.isNew || false,
      is_book_of_the_day: book.isBookOfTheDay || false,
      status: book.status || 'published',
      file_size: book.fileSize || '10 MB',
      primary_format: book.format?.toLowerCase() || 'pdf',
    };

    // Save series_name in books.series_name (NULL if empty/cleared)
    const trimmedSeriesName = (book.seriesName ?? book.series)?.trim() || null;
    upsertPayload.series_name = trimmedSeriesName;
    if (book.seriesPart !== undefined && book.seriesPart !== null) {
      upsertPayload.series_part = Number(book.seriesPart);
    }

    let { error: bookError } = await supabase.from('books').upsert(upsertPayload);
    if (bookError && (bookError.message?.includes('series_name') || bookError.message?.includes('series') || bookError.message?.includes('column'))) {
      delete upsertPayload.series_name;
      delete upsertPayload.series;
      delete upsertPayload.series_part;
      const retry = await supabase.from('books').upsert(upsertPayload);
      bookError = retry.error;
    }

    if (bookError) throw bookError;

    // 3. Formats
    if (book.formats && book.formats.length > 0) {
      const formatRows = book.formats.map((fmt) => ({
        id: crypto.randomUUID(),
        book_id: book.id,
        format: fmt,
        file_url: fmt === 'pdf' ? book.fileUrl : book.epubUrl,
        file_size: book.fileSize || '8.5 MB',
      }));
      const { error: fmtErr } = await supabase.from('book_formats').upsert(formatRows, { onConflict: 'book_id,format' });
      if (fmtErr) {
        console.warn('Upsert to book_formats returned notice, trying delete-insert fallback:', fmtErr.message);
        await supabase.from('book_formats').delete().eq('book_id', book.id);
        const { error: insErr } = await supabase.from('book_formats').insert(formatRows);
        if (insErr) {
          console.warn('Direct insert to book_formats notice:', insErr.message);
        }
      }
    }

    // 4. Keywords
    if (book.keywords && book.keywords.length > 0) {
      const keywordRows = book.keywords.map((kw) => ({
        book_id: book.id,
        keyword: kw,
      }));
      await supabase.from('book_keywords').upsert(keywordRows, { onConflict: 'book_id,keyword' });
    }

    return { success: true, source: 'supabase' };
  } catch (err: any) {
    console.warn('Failed to save book to Supabase:', err.message);
    return { success: false, source: 'local', error: err.message };
  }
}

/**
 * Deletes a book and all associated relational records from Supabase
 */
export async function deleteBookFromSupabase(bookId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    // Delete associated formats and keywords first (in case of manual cascade setup)
    await supabase.from('book_formats').delete().eq('book_id', bookId);
    await supabase.from('book_keywords').delete().eq('book_id', bookId);
    await supabase.from('user_favorites').delete().eq('book_id', bookId);
    await supabase.from('user_reading_history').delete().eq('book_id', bookId);

    // Delete the primary book record
    const { error, count } = await supabase.from('books').delete({ count: 'exact' }).eq('id', bookId);
    if (error) throw error;
    if (count === 0) {
      return { success: false, error: 'تعذر الحذف: لا تملك صلاحية مدير النظام في قاعدة البيانات أو أن الكتاب غير موجود.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Updates curation flags for a book (is_trending, is_new, is_book_of_the_day, status)
 */
export async function updateBookCurationInSupabase(
  bookId: string, 
  updates: { isTrending?: boolean; isNew?: boolean; isBookOfTheDay?: boolean; status?: BookStatus }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    // If setting as book of the day, unset any existing book of the day first
    if (updates.isBookOfTheDay) {
      await supabase.from('books').update({ is_book_of_the_day: false }).neq('id', bookId);
    }

    const dbUpdates: any = {};
    if (updates.isTrending !== undefined) dbUpdates.is_trending = updates.isTrending;
    if (updates.isNew !== undefined) dbUpdates.is_new = updates.isNew;
    if (updates.isBookOfTheDay !== undefined) dbUpdates.is_book_of_the_day = updates.isBookOfTheDay;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { error, count } = await supabase.from('books').update(dbUpdates, { count: 'exact' }).eq('id', bookId);
    if (error) throw error;
    if (count === 0) {
      return { success: false, error: 'تعذر تعديل الكتاب: لا تملك صلاحية مدير النظام في قاعدة البيانات أو أن الكتاب غير موجود.' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all authors from Supabase with fallback to mock authors
 */
export async function fetchAuthors(): Promise<DataFetchResult<Author[]>> {
  const fallbackList = Object.values(MOCK_AUTHORS);
  if (!isSupabaseConfigured()) {
    return { data: fallbackList, source: 'local_fallback' };
  }

  try {
    const { data, error } = await supabase.from('authors').select('*').order('name', { ascending: true });
    if (error || !data || data.length === 0) {
      return { data: fallbackList, source: 'local_fallback', error: error?.message };
    }

    const mapped: Author[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      bio: row.bio || '',
      avatarUrl: row.avatar_url || '',
      born: row.born || '',
      nationality: row.nationality || '',
    }));

    return { data: mapped, source: 'supabase' };
  } catch (err: any) {
    return { data: fallbackList, source: 'local_fallback', error: err.message };
  }
}

/**
 * Upserts an author in Supabase
 */
export async function saveAuthorToSupabase(author: Author): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase.from('authors').upsert({
      id: author.id,
      name: author.name,
      bio: author.bio || '',
      avatar_url: author.avatarUrl || '',
      born: author.born || '',
      nationality: author.nationality || '',
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Deletes an author from Supabase, checking for existing book associations
 */
export async function deleteAuthorFromSupabase(authorId: string): Promise<{ success: boolean; error?: string; attachedBooksCount?: number }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    // Check if books are attached to this author
    const { data: books, error: checkError } = await supabase
      .from('books')
      .select('id, title')
      .eq('author_id', authorId);

    if (!checkError && books && books.length > 0) {
      return { 
        success: false, 
        attachedBooksCount: books.length, 
        error: `لا يمكن حذف هذا المؤلف لوجود ${books.length} كتاب مرتبط به. يُرجى نقل أو حذف الكتب أولاً.` 
      };
    }

    const { error } = await supabase.from('authors').delete().eq('id', authorId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all categories
 */
export async function fetchCategories(): Promise<DataFetchResult<CategoryItem[]>> {
  const officialCategories: CategoryItem[] = [
    { id: 'فانتازيا', name: 'فانتازيا', icon: 'Sparkles', description: 'عوالم خيالية، سحر، ومغامرات ملحمية' },
    { id: 'غموض', name: 'غموض', icon: 'Compass', description: 'أسرار، تحقيقات، وقضايا غامضة تحبس الأنفاس' },
    { id: 'جاسوسية', name: 'جاسوسية', icon: 'Shield', description: 'مهمات سرية، عملاء، ومطاردات استخباراتية' },
    { id: 'رومانسي', name: 'رومانسي', icon: 'Heart', description: 'روايات عاطفية، حب، ومشاعر إنسانية عميقة' },
    { id: 'كتب غير روائية', name: 'كتب غير روائية', icon: 'BookOpen', description: 'فكر، مذكرات، علوم، وسير واقعية ومعرفية' },
  ];

  if (!isSupabaseConfigured()) {
    return { data: officialCategories, source: 'local_fallback' };
  }

  try {
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error || !data || data.length === 0) {
      return { data: officialCategories, source: 'local_fallback', error: error?.message };
    }

    // Filter to only match the 5 official categories
    const validNames = new Set(['فانتازيا', 'فانتازي', 'غموض', 'جاسوسية', 'رومانسي', 'كتب غير روائية']);
    const dbOfficial = data.filter((row: any) => validNames.has(row.name?.trim()));

    if (dbOfficial.length === 5) {
      return {
        data: dbOfficial.map((row: any) => ({
          id: row.id,
          name: row.name,
          icon: row.icon || 'BookOpen',
          description: row.description || '',
        })),
        source: 'supabase',
      };
    }

    return { data: officialCategories, source: 'supabase' };
  } catch (err: any) {
    return { data: officialCategories, source: 'local_fallback', error: err.message };
  }
}

/**
 * Upserts a category in Supabase
 */
export async function saveCategoryToSupabase(category: CategoryItem): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { error } = await supabase.from('categories').upsert({
      id: category.id,
      name: category.name,
      icon: category.icon || 'BookOpen',
      description: category.description || '',
    });
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Deletes a category from Supabase, checking for existing book associations
 */
export async function deleteCategoryFromSupabase(categoryId: string, categoryName: string): Promise<{ success: boolean; error?: string; attachedBooksCount?: number }> {
  if (!isSupabaseConfigured()) return { success: true };

  try {
    const { data: books, error: checkError } = await supabase
      .from('books')
      .select('id, title')
      .or(`category_id.eq.${categoryId},category_name.eq.${categoryName}`);

    if (!checkError && books && books.length > 0) {
      return {
        success: false,
        attachedBooksCount: books.length,
        error: `لا يمكن حذف هذا التصنيف لارتباط ${books.length} كتاب به في المكتبة.`
      };
    }

    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Uploads a book cover image to Supabase Storage 'book-covers' bucket
 */
export async function uploadBookCoverToStorage(file: File): Promise<{ url: string | null; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: 'سوبابيس غير مهيأ' };
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('book-covers').getPublicUrl(filePath);
    return { url: data.publicUrl };
  } catch (err: any) {
    return { url: null, error: err.message };
  }
}

/**
 * Uploads a book document file to Supabase Storage 'book-files' bucket
 */
export async function uploadBookDocumentToStorage(file: File): Promise<{ url: string | null; filePath?: string; fileName?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: 'سوبابيس غير مهيأ' };
  }

  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}-${cleanName || 'document'}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('book-files')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('Storage upload error for book-files:', uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('book-files').getPublicUrl(filePath);
    return { url: data.publicUrl, filePath, fileName };
  } catch (err: any) {
    return { url: null, error: err.message };
  }
}

/**
 * Resolves original book file URL directly from Supabase Storage 'book-files' bucket
 * if relational formats are missing or unlinked.
 */
export async function resolveBookFileUrlFromStorage(
  book: { id: string; title?: string; publishDate?: string; formats?: string[] },
  format: 'pdf' | 'epub' = 'pdf'
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: files, error } = await supabase.storage
      .from('book-files')
      .list('documents', { limit: 100 });

    if (error || !files || files.length === 0) return null;

    const targetExt = format.toLowerCase();
    const candidateFiles = files.filter((f) => f.name.toLowerCase().endsWith(`.${targetExt}`));
    if (candidateFiles.length === 0) return null;

    const idMatch = book.id.match(/^book-(\d+)/);
    const bookTimestamp = idMatch
      ? parseInt(idMatch[1], 10)
      : (book.publishDate ? new Date(book.publishDate).getTime() : 0);

    if (bookTimestamp > 0) {
      let bestMatch: any = null;
      let minDiff = Infinity;

      for (const f of candidateFiles) {
        const fileTimeMatch = f.name.match(/^(\d+)-/);
        if (fileTimeMatch) {
          const fileTime = parseInt(fileTimeMatch[1], 10);
          const diff = Math.abs(fileTime - bookTimestamp);
          if (diff < 45000 && diff < minDiff) {
            minDiff = diff;
            bestMatch = f;
          }
        }
      }

      if (bestMatch) {
        const { data } = supabase.storage.from('book-files').getPublicUrl(`documents/${bestMatch.name}`);
        return data.publicUrl;
      }
    }

    if (candidateFiles.length === 1) {
      const { data } = supabase.storage.from('book-files').getPublicUrl(`documents/${candidateFiles[0].name}`);
      return data.publicUrl;
    }

    return null;
  } catch (err) {
    console.warn('Failed to resolve file URL from storage:', err);
    return null;
  }
}

/**
 * Helper to format byte count into clean MB string
 */
export function formatBytesToMB(bytes: number): string {
  if (!bytes || bytes <= 0) return '8.5 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/**
 * Sequential & Transactional Book Creation Flow (Phase 6 Architecture)
 * 1. Upload Cover to 'book-covers' bucket
 * 2. Insert Book record into 'books' table
 * 3. Upload PDF / EPUB files to 'book-files' bucket
 * 4. Insert records into 'book_formats' table
 * 5. Insert records into 'book_keywords' table
 */
export async function createCompleteBookTransactional(
  payload: CompleteBookPayload,
  onProgress?: (progress: SequentialUploadProgress) => void
): Promise<{ success: boolean; book?: Book; error?: string }> {
  const updateProgress = (step: SequentialUploadProgress['step'], percentage: number, message: string) => {
    if (onProgress) {
      onProgress({ step, percentage, message });
    }
  };

  try {
    // Stage 0: Validation
    updateProgress('validating', 5, 'التحقق من صحة الملفات والحقول المطلوبة...');

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (payload.pdfFile && payload.pdfFile.size > MAX_FILE_SIZE) {
      throw new Error(`حجم ملف PDF (${formatBytesToMB(payload.pdfFile.size)}) يتجاوز الحد الأقصى المسموح به (50 ميجابايت).`);
    }
    if (payload.epubFile && payload.epubFile.size > MAX_FILE_SIZE) {
      throw new Error(`حجم ملف EPUB (${formatBytesToMB(payload.epubFile.size)}) يتجاوز الحد الأقصى المسموح به (50 ميجابايت).`);
    }

    const newBookId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let finalCoverUrl = payload.coverUrlFallback || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80';

    // Stage 1: Upload Cover
    if (payload.coverFile) {
      updateProgress('uploading_cover', 20, 'جارٍ رفع صورة الغلاف إلى حاوية book-covers...');
      const coverResult = await uploadBookCoverToStorage(payload.coverFile);
      if (coverResult.url) {
        finalCoverUrl = coverResult.url;
      } else if (isSupabaseConfigured()) {
        console.warn('Cover upload returned warning/fallback:', coverResult.error);
      }
    }

    // Stage 2: Save author if custom/new
    updateProgress('saving_metadata', 35, 'جارٍ توثيق بيانات المؤلف والتصنيف...');
    const authorId = payload.authorId;
    if (authorId && payload.authorName) {
      await saveAuthorToSupabase({
        id: authorId,
        name: payload.authorName,
        bio: payload.authorBio || '',
      });
    }

    // Stage 3: Insert Book record
    updateProgress('saving_metadata', 50, 'جارٍ إدراج بيانات الكتاب في جدول books...');

    let calculatedFileSize = '8.5 MB';
    if (payload.pdfFile) {
      calculatedFileSize = formatBytesToMB(payload.pdfFile.size);
    } else if (payload.epubFile) {
      calculatedFileSize = formatBytesToMB(payload.epubFile.size);
    }

    const formatsList: ('pdf' | 'epub')[] = [];
    if (payload.pdfFile) formatsList.push('pdf');
    if (payload.epubFile) formatsList.push('epub');
    if (formatsList.length === 0) formatsList.push('pdf');

    const createdBook: Book = {
      id: newBookId,
      title: payload.title,
      author: {
        id: authorId,
        name: payload.authorName || 'مؤلف معتمد',
        bio: payload.authorBio,
      },
      category: payload.category,
      description: payload.description,
      fullExcerpt: payload.fullExcerpt || payload.description,
      coverImage: finalCoverUrl,
      pages: payload.pages || 150,
      rating: 5.0,
      ratingsCount: 1,
      publishDate: new Date().toISOString(),
      keywords: payload.keywords.length > 0 ? payload.keywords : [payload.category, 'كتاب'],
      formats: formatsList,
      status: payload.status,
      isTrending: payload.isTrending,
      isNew: payload.isNew,
      isBookOfTheDay: payload.isBookOfTheDay,
      fileSize: calculatedFileSize,
      format: (formatsList[0]?.toUpperCase() as 'PDF' | 'EPUB') || 'PDF',
      readTimeHours: Math.ceil((payload.pages || 150) / 35),
      downloadsCount: 0,
      seriesName: (payload.seriesName ?? payload.series)?.trim() || undefined,
      series: (payload.seriesName ?? payload.series)?.trim() || undefined,
      seriesPart: payload.seriesPart !== undefined && payload.seriesPart !== null ? Number(payload.seriesPart) : undefined,
    };

    if (isSupabaseConfigured()) {
      if (payload.isBookOfTheDay) {
        await supabase.from('books').update({ is_book_of_the_day: false }).neq('id', newBookId);
      }

      const insertPayload: any = {
        id: newBookId,
        title: createdBook.title,
        author_id: authorId || null,
        category_name: createdBook.category,
        description: createdBook.description,
        full_excerpt: createdBook.fullExcerpt,
        cover_image: finalCoverUrl,
        pages: createdBook.pages,
        rating: 5.0,
        ratings_count: 1,
        publish_date: createdBook.publishDate,
        is_trending: createdBook.isTrending,
        is_new: createdBook.isNew,
        is_book_of_the_day: createdBook.isBookOfTheDay,
        status: createdBook.status,
        file_size: calculatedFileSize,
        primary_format: formatsList[0] || 'pdf',
      };

      const sName = (payload.seriesName ?? payload.series)?.trim() || null;
      insertPayload.series_name = sName;
      if (payload.seriesPart !== undefined && payload.seriesPart !== null) {
        insertPayload.series_part = Number(payload.seriesPart);
      }

      let { error: insertError } = await supabase.from('books').insert(insertPayload);
      if (insertError && (insertError.message?.includes('series_name') || insertError.message?.includes('series') || insertError.message?.includes('column'))) {
        delete insertPayload.series_name;
        delete insertPayload.series;
        delete insertPayload.series_part;
        const retry = await supabase.from('books').insert(insertPayload);
        insertError = retry.error;
      }

      if (insertError) {
        console.error('Failed to insert book to Supabase:', insertError);
        throw new Error(`فشل حفظ سجل الكتاب في قاعدة بيانات Supabase: ${insertError.message}`);
      }
    }

    // Stage 4: Upload PDF and EPUB files
    let uploadedPdfUrl: string | undefined;
    let uploadedEpubUrl: string | undefined;

    if (payload.pdfFile) {
      updateProgress('uploading_files', 65, 'جارٍ رفع ملف PDF إلى حاوية book-files...');
      const pdfUpload = await uploadBookDocumentToStorage(payload.pdfFile);
      if (pdfUpload.url) {
        uploadedPdfUrl = pdfUpload.url;
        createdBook.fileUrl = uploadedPdfUrl;
      } else if (pdfUpload.error) {
        throw new Error(`فشل رفع ملف PDF إلى حاوية التخزين book-files: ${pdfUpload.error}`);
      }
    }

    if (payload.epubFile) {
      updateProgress('uploading_files', 80, 'جارٍ رفع ملف EPUB إلى حاوية book-files...');
      const epubUpload = await uploadBookDocumentToStorage(payload.epubFile);
      if (epubUpload.url) {
        uploadedEpubUrl = epubUpload.url;
        createdBook.epubUrl = uploadedEpubUrl;
      } else if (epubUpload.error) {
        throw new Error(`فشل رفع ملف EPUB إلى حاوية التخزين book-files: ${epubUpload.error}`);
      }
    }

    // Stage 5: Save book_formats & book_keywords
    updateProgress('saving_formats', 90, 'جارٍ تسجيل صيغ التحميل والكلمات المفتاحية...');
    if (isSupabaseConfigured()) {
      const formatRows: any[] = [];
      if (payload.pdfFile && uploadedPdfUrl) {
        formatRows.push({
          id: crypto.randomUUID(),
          book_id: newBookId,
          format: 'pdf',
          file_url: uploadedPdfUrl,
          file_size: formatBytesToMB(payload.pdfFile.size),
        });
      }
      if (payload.epubFile && uploadedEpubUrl) {
        formatRows.push({
          id: crypto.randomUUID(),
          book_id: newBookId,
          format: 'epub',
          file_url: uploadedEpubUrl,
          file_size: formatBytesToMB(payload.epubFile.size),
        });
      }

      if (formatRows.length > 0) {
        const { error: upsertErr } = await supabase.from('book_formats').upsert(formatRows, { onConflict: 'book_id,format' });
        if (upsertErr) {
          console.warn('Upsert to book_formats returned notice, attempting direct insert:', upsertErr.message);
          const { error: insertErr } = await supabase.from('book_formats').insert(formatRows);
          if (insertErr) {
            console.warn('Direct insert to book_formats notice:', insertErr.message);
          }
        }
      }

      if (createdBook.keywords && createdBook.keywords.length > 0) {
        const keywordRows = createdBook.keywords.map((kw) => ({
          id: crypto.randomUUID(),
          book_id: newBookId,
          keyword: kw,
        }));
        const { error: kwErr } = await supabase.from('book_keywords').upsert(keywordRows, { onConflict: 'book_id,keyword' });
        if (kwErr) {
          await supabase.from('book_keywords').insert(keywordRows);
        }
      }
    }

    updateProgress('completed', 100, 'تمت إضافة ونشر الكتاب بنجاح!');
    return { success: true, book: createdBook };
  } catch (err: any) {
    updateProgress('failed', 0, `حدث خطأ: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ==============================================================================
// إحصائيات التحميلات والمستخدمين (Downloads & Users Analytics)
// ==============================================================================

const DOWNLOADS_COUNT_STORAGE_KEY = 'alwadi_book_downloads_counts';

export function getLocalDownloadsCount(bookId: string): number {
  try {
    const saved = localStorage.getItem(DOWNLOADS_COUNT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return Number(parsed[bookId]) || 0;
    }
  } catch (e) {
    // ignore
  }
  return 0;
}

export function getAllLocalDownloadsCounts(): Record<string, number> {
  try {
    const saved = localStorage.getItem(DOWNLOADS_COUNT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {};
}

/**
 * Records a successful download event without collecting unnecessary personal data
 */
export async function recordBookDownload(bookId: string, format: string = 'pdf'): Promise<void> {
  // 1. Update local storage counter immediately
  try {
    const currentCounts = getAllLocalDownloadsCounts();
    currentCounts[bookId] = (currentCounts[bookId] || 0) + 1;
    localStorage.setItem(DOWNLOADS_COUNT_STORAGE_KEY, JSON.stringify(currentCounts));
  } catch (e) {
    console.warn('Failed to record local download count:', e);
  }

  // 2. Try recording in Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('book_downloads').insert({
        book_id: bookId,
        format: format.toLowerCase(),
      });
    } catch {
      // Table might not be migrated yet
    }

    try {
      const { data: b } = await supabase.from('books').select('downloads_count').eq('id', bookId).single();
      if (b) {
        const nextCount = (Number(b.downloads_count) || 0) + 1;
        await supabase.from('books').update({ downloads_count: nextCount }).eq('id', bookId);
      }
    } catch {
      // Column might not exist yet
    }
  }
}

/**
 * Fetches download stats for Admin dashboard
 */
export async function fetchBookDownloadsStats(): Promise<{
  totalDownloads: number;
  downloadsPerBook: Record<string, number>;
}> {
  const localCounts = getAllLocalDownloadsCounts();
  let totalDownloads = Object.values(localCounts).reduce((a, b) => a + b, 0);
  const downloadsPerBook: Record<string, number> = { ...localCounts };

  if (isSupabaseConfigured()) {
    try {
      const { data: dlData, error: dlErr } = await supabase.from('book_downloads').select('book_id');
      if (!dlErr && dlData && dlData.length > 0) {
        totalDownloads = dlData.length;
        dlData.forEach((row: any) => {
          if (row.book_id) {
            downloadsPerBook[row.book_id] = (downloadsPerBook[row.book_id] || 0) + 1;
          }
        });
      }
    } catch {
      // fallback to local counts
    }
  }

  return { totalDownloads, downloadsPerBook };
}

/**
 * Fetches real registered user accounts from Supabase for Admin only
 */
export async function fetchRegisteredUsersStats(): Promise<{
  totalCount: number;
  users: RegisteredUser[];
  source: 'supabase' | 'local';
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      totalCount: 1,
      users: [
        {
          id: 'admin-local',
          name: 'مدير المكتبة',
          email: 'admin@alwadi-library.com',
          role: 'admin',
          membershipTier: 'مدير النظام',
          joinedDate: new Date().toLocaleDateString('ar-EG'),
        },
      ],
      source: 'local',
    };
  }

  try {
    const { data, count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      return {
        totalCount: 0,
        users: [],
        source: 'supabase',
        error: `تعذر جلب بيانات المستخدمين من Supabase (${error.message}).`,
      };
    }

    const mappedUsers: RegisteredUser[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name || 'قارئ مسجل',
      email: row.email || `حساب مسجل (${row.id.substring(0, 8)})`,
      role: (row.role || 'user') as UserRole,
      membershipTier: row.membership_tier || (row.role === 'admin' ? 'مدير النظام' : 'عضو قارئ مميز'),
      joinedDate: row.created_at ? new Date(row.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
    }));

    return {
      totalCount: count ?? mappedUsers.length,
      users: mappedUsers,
      source: 'supabase',
    };
  } catch (err: any) {
    return {
      totalCount: 0,
      users: [],
      source: 'supabase',
      error: err?.message || 'خطأ في الاتصال بقاعدة البيانات',
    };
  }
}

// ==============================================================================
// نظام طلبات الكتب (Book Requests System)
// ==============================================================================

const BOOK_REQUESTS_STORAGE_KEY = 'alwadi_book_requests';

export async function fetchBookRequests(): Promise<{ data: BookRequest[]; error?: string }> {
  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('book_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: BookRequest[] = data.map((r: any) => ({
          id: r.id,
          bookTitle: r.book_title,
          createdAt: r.created_at || new Date().toISOString(),
          userId: r.user_id,
          userName: r.user_name,
          status: (r.status || 'pending') as 'pending' | 'fulfilled' | 'rejected',
          notes: r.notes,
        }));
        return { data: mapped };
      }
    } catch {
      // Table might not be migrated yet, fallback to local storage
    }
  }

  // 2. Local fallback
  try {
    const saved = localStorage.getItem(BOOK_REQUESTS_STORAGE_KEY);
    if (saved) return { data: JSON.parse(saved) };
  } catch {
    // ignore
  }

  return { data: [] };
}

export async function submitBookRequest(
  bookTitle: string,
  user?: { id?: string; name?: string }
): Promise<{ success: boolean; request?: BookRequest; error?: string }> {
  const cleanTitle = bookTitle.trim();
  if (!cleanTitle) {
    return { success: false, error: 'يرجى كتابة اسم الكتاب المطلوب أولاً.' };
  }

  const newRequest: BookRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    bookTitle: cleanTitle,
    createdAt: new Date().toISOString(),
    userId: user?.id,
    userName: user?.name,
    status: 'pending',
  };

  // Local storage save
  try {
    const current = (await fetchBookRequests()).data;
    const updated = [newRequest, ...current];
    localStorage.setItem(BOOK_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save book request locally:', e);
  }

  // Supabase save
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('book_requests').insert({
        id: newRequest.id,
        book_title: cleanTitle,
        user_id: user?.id || null,
        user_name: user?.name || null,
        status: 'pending',
      });
      if (error) {
        console.warn('Supabase book_requests notice:', error.message);
      }
    } catch (e) {
      console.warn('Supabase book_requests error:', e);
    }
  }

  return { success: true, request: newRequest };
}

export async function updateBookRequestStatus(
  requestId: string,
  status: 'pending' | 'fulfilled' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = (await fetchBookRequests()).data;
    const updated = current.map((r) => (r.id === requestId ? { ...r, status } : r));
    localStorage.setItem(BOOK_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('book_requests').update({ status }).eq('id', requestId);
    } catch {
      // ignore
    }
  }

  return { success: true };
}

export async function deleteBookRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const current = (await fetchBookRequests()).data;
    const updated = current.filter((r) => r.id !== requestId);
    localStorage.setItem(BOOK_REQUESTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('book_requests').delete().eq('id', requestId);
    } catch {
      // ignore
    }
  }

  return { success: true };
}

