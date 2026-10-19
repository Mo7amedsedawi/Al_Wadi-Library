import { createClient } from '@supabase/supabase-js';

// Canonical project credentials for Al-Wadi Library Supabase instance
const DEFAULT_SUPABASE_URL = 'https://unxsmgatnsmioddqzsmp.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_bCOywQgzJ5eF5kwlPEuqxg_zqMdAb2s';

// Resolve URL and anon publishable key with fallback to ensure web and client builds never run with empty strings
export const supabaseUrl: string =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const supabaseAnonKey: string =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseUrl.startsWith('https://')
  );
};

// Safe initialization log for client console diagnosis (never logs secret or passwords)
if (typeof window !== 'undefined') {
  console.info('[Supabase Client] Initialized:', {
    configured: isSupabaseConfigured(),
    url: supabaseUrl,
    keyPrefix: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 15)}...` : 'missing',
  });
}

// Create single shared Supabase client
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  url: string;
  tablesFound: Record<string, boolean>;
  bucketsFound?: Record<string, boolean>;
  error?: string;
  latencyMs?: number;
}

/**
 * Performs a real live network test against the configured Supabase instance
 * without throwing errors, returning detailed connection diagnostics.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const defaultTables: Record<string, boolean> = {
    books: false,
    authors: false,
    categories: false,
    book_formats: false,
    book_keywords: false,
    profiles: false,
    user_favorites: false,
    book_requests: false,
    book_comments: false,
  };

  const defaultBuckets: Record<string, boolean> = {
    'book-covers': false,
    'book-files': false,
  };

  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      isConnected: false,
      url: supabaseUrl || 'غير محدد',
      tablesFound: defaultTables,
      bucketsFound: defaultBuckets,
      error: 'إعدادات VITE_SUPABASE_URL أو VITE_SUPABASE_ANON_KEY غير مكتملة في ملف .env',
    };
  }

  const startTime = performance.now();
  const tablesFound: Record<string, boolean> = { ...defaultTables };
  const bucketsFound: Record<string, boolean> = { ...defaultBuckets };

  try {
    // 1. Check books table
    const { error: booksError } = await supabase
      .from('books')
      .select('id')
      .limit(1);

    if (!booksError) {
      tablesFound.books = true;
    }

    // 2. Check authors table
    const { error: authorsError } = await supabase
      .from('authors')
      .select('id')
      .limit(1);

    if (!authorsError) {
      tablesFound.authors = true;
    }

    // 3. Check categories table
    const { error: catError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (!catError) {
      tablesFound.categories = true;
    }

    // 4. Check profiles table
    const { error: profError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!profError) {
      tablesFound.profiles = true;
    }

    // 5. Check book_formats table
    const { error: fmtError } = await supabase
      .from('book_formats')
      .select('id')
      .limit(1);

    if (!fmtError) {
      tablesFound.book_formats = true;
    }

    // 6. Check book_keywords table
    const { error: kwError } = await supabase
      .from('book_keywords')
      .select('id')
      .limit(1);

    if (!kwError) {
      tablesFound.book_keywords = true;
    }

    // 7. Check book_requests table
    const { error: reqError } = await supabase
      .from('book_requests')
      .select('id')
      .limit(1);

    if (!reqError) {
      tablesFound.book_requests = true;
    }

    // 8. Check book_comments table
    const { error: commError } = await supabase
      .from('book_comments')
      .select('id')
      .limit(1);

    if (!commError) {
      tablesFound.book_comments = true;
    }

    // Check storage buckets
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets && Array.isArray(buckets)) {
        buckets.forEach((b) => {
          if (b.name in bucketsFound) {
            bucketsFound[b.name] = true;
          }
        });
      }
    } catch {
      // buckets list could be restricted by policy
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // If at least one check returned without network error, connection is valid
    const isConnected = !booksError || ['PGRST205', 'PGRST116', '42P01'].includes(booksError?.code || '');

    let diagnosticMessage: string | undefined = undefined;
    if (!tablesFound.books) {
      if (booksError?.code === 'PGRST205' || booksError?.message?.includes('schema cache')) {
        diagnosticMessage = 'الاتصال بمشروع Supabase ناجح والمفاتيح صحيحة! الجداول غير منشأة بعد في قاعدة البيانات. استخدم زر "نسخ كود SQL للجداول" ثم اضغط Run في Supabase SQL Editor.';
      } else {
        diagnosticMessage = booksError?.message || 'الاتصال بالمشروع ناجح، ولكن جدول books لم يُنشأ بعد.';
      }
    }

    return {
      isConfigured: true,
      isConnected,
      url: supabaseUrl,
      tablesFound,
      bucketsFound,
      latencyMs,
      error: diagnosticMessage,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      isConnected: false,
      url: supabaseUrl,
      tablesFound,
      bucketsFound,
      error: err?.message || 'تعذر الاتصال بخادم Supabase (تحقق من الاتصال بالشبكة أو صلاحية المفتاح)',
    };
  }
}
