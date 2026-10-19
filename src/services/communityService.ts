/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  BookComment, 
  CommentReport, 
  BookRating, 
  ReadingList, 
  BookAnalyticsEvent, 
  AnalyticsSummary,
  Book 
} from '../types';

const STORAGE_KEYS = {
  COMMENTS: 'alwadi_book_comments',
  REPORTS: 'alwadi_comment_reports',
  RATINGS: 'alwadi_book_ratings',
  READING_LISTS: 'alwadi_reading_lists',
  ANALYTICS: 'alwadi_book_analytics',
  VIEWED_SESSIONS: 'alwadi_viewed_sessions',
};

// Initial default reading lists
export const INITIAL_READING_LISTS: ReadingList[] = [
  {
    id: 'list-1',
    title: 'روائع الفكر وفلسفة التاريخ',
    description: 'مجموعة من أمهات الكتب التأسيسية التي حللت نشوء الحضارات والوعي الفلسفي الإنساني عبر العصور.',
    book_ids: ['book-1', 'book-3'],
    created_at: new Date('2026-10-01').toISOString(),
  },
  {
    id: 'list-2',
    title: 'أدب المقاومة والذاكرة العربية',
    description: 'أعمال سردية وروائية خالدة خلدت ملاحم الصمود والتجربة الإنسانية العربية الحديثة.',
    book_ids: ['book-4', 'book-5', 'book-6'],
    created_at: new Date('2026-10-05').toISOString(),
  },
  {
    id: 'list-3',
    title: 'آفاق العلم والتكنولوجيا المعاصرة',
    description: 'رحلة مشوقة في كيمياء الفيمتو وثورة الذكاء الاصطناعي وأسرار الفيزياء الكونية.',
    book_ids: ['book-2', 'book-10', 'book-11'],
    created_at: new Date('2026-10-10').toISOString(),
  },
];

// Initial starter comments for demo
export const INITIAL_COMMENTS: BookComment[] = [
  {
    id: 'comm-1',
    book_id: 'book-1',
    user_id: 'user-demo-1',
    content: 'كتاب عظيم جداً، قراءة مقدمة ابن خلدون تفتح آفاقاً غير مسبوقة لفهم حركة التاريخ وتداول الأيام بين الأمم.',
    is_edited: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    user_name: 'د. طارق المنصور',
    user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    replies: [
      {
        id: 'comm-1-1',
        book_id: 'book-1',
        user_id: 'user-demo-2',
        parent_id: 'comm-1',
        content: 'أتفق معك تماماً، خصوصاً في تفصيله الدقيق لأثر العصبية القبلية والمناخ على طبائع العمران البشري.',
        is_edited: false,
        created_at: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
        user_name: 'سارة الأندلسي',
        user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      }
    ]
  },
  {
    id: 'comm-2',
    book_id: 'book-2',
    user_id: 'user-demo-3',
    content: 'سيرة ملهمة للأجيال الشابة، الدكتور أحمد زويل قدم نموذجاً حياً لما يمكن أن يحققه الشغف العلمي الصادق.',
    is_edited: false,
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    user_name: 'عمر الهاشمي',
    user_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    replies: []
  }
];

// ==============================================================================
// 1. BOOK COMMENTS
// ==============================================================================

function getCachedCommentsForBook(bookId: string): BookComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (!raw) return [];
    const all: BookComment[] = JSON.parse(raw);
    return all.filter((c) => c.book_id === bookId);
  } catch {
    return [];
  }
}

function saveCommentsToLocalCache(bookId: string, bookComments: BookComment[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    let all: BookComment[] = raw ? JSON.parse(raw) : [];
    // Remove previous entries for this book
    all = all.filter((c) => c.book_id !== bookId);
    // Append updated comments
    all.push(...bookComments);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(all));
  } catch {}
}

export async function fetchBookComments(bookId: string): Promise<BookComment[]> {
  if (isSupabaseConfigured()) {
    try {
      // Query comments directly without foreign key joins to avoid PGRST200 schema relationship errors
      const { data, error } = await supabase
        .from('book_comments')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetch comments notice:', error.message);
        throw new Error(error.message);
      }

      if (data) {
        // Collect user_ids where user_name is not stored on the row
        const missingUserIds = [
          ...new Set(
            data
              .filter((item: any) => !item.user_name && item.user_id)
              .map((item: any) => item.user_id)
          ),
        ];

        const profileMap = new Map<string, { name?: string; avatar_url?: string }>();
        if (missingUserIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', missingUserIds);
            if (profiles) {
              profiles.forEach((p: any) => profileMap.set(p.id, p));
            }
          } catch (pErr) {
            console.warn('Profiles lookup warning:', pErr);
          }
        }

        const rawComments: BookComment[] = data.map((item: any) => {
          const profile = profileMap.get(item.user_id);
          return {
            id: item.id,
            book_id: item.book_id,
            user_id: item.user_id,
            parent_id: item.parent_id,
            content: item.content,
            is_edited: Boolean(item.is_edited),
            created_at: item.created_at,
            user_name: item.user_name || profile?.name || 'قارئ الوادي',
            user_avatar: item.user_avatar || profile?.avatar_url,
            replies: [],
          };
        });

        // Group into parents and 1-level deep replies
        const parents: BookComment[] = [];
        const replyMap = new Map<string, BookComment[]>();

        for (const comm of rawComments) {
          if (comm.parent_id) {
            const list = replyMap.get(comm.parent_id) || [];
            list.push(comm);
            replyMap.set(comm.parent_id, list);
          } else {
            parents.push(comm);
          }
        }

        for (const parent of parents) {
          parent.replies = replyMap.get(parent.id) || [];
        }

        // Cache authentic Supabase comments locally for offline fallback
        saveCommentsToLocalCache(bookId, parents);
        return parents;
      }
    } catch (err: any) {
      console.warn('Supabase fetch comments error, checking local cache:', err?.message);
      const local = getCachedCommentsForBook(bookId);
      if (local.length > 0) return local;
      throw err;
    }
  }

  // Local fallback if Supabase is unconfigured
  return getCachedCommentsForBook(bookId);
}

export async function addComment(
  bookId: string,
  userId: string,
  userName: string,
  content: string,
  parentId?: string | null,
  userAvatar?: string
): Promise<{ success: boolean; comment?: BookComment; error?: string }> {
  const cleanContent = content.trim();
  if (!cleanContent) {
    return { success: false, error: 'لا يمكن إرسال تعليق فارغ.' };
  }
  if (cleanContent.length > 1000) {
    return { success: false, error: 'الحد الأقصى للتعليق هو 1000 حرف.' };
  }
  if (!userId) {
    return { success: false, error: 'يجب تسجيل الدخول بحساب قارئ لإرسال التعليق.' };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'خدمة Supabase غير مهيأة حالياً.' };
  }

  try {
    let insertedRow: any = null;
    let insertError: any = null;

    // 1. First attempt insert with user_name and user_avatar
    const payloadWithNames = {
      book_id: bookId,
      user_id: userId,
      parent_id: parentId || null,
      content: cleanContent,
      user_name: userName.trim() || 'قارئ الوادي',
      user_avatar: userAvatar || null,
    };

    const res1 = await supabase
      .from('book_comments')
      .insert(payloadWithNames)
      .select()
      .single();

    if (!res1.error && res1.data) {
      insertedRow = res1.data;
    } else if (res1.error?.code === 'PGRST204') {
      // Column 'user_name' does not exist yet in schema cache -> fallback to base columns
      const basePayload = {
        book_id: bookId,
        user_id: userId,
        parent_id: parentId || null,
        content: cleanContent,
      };
      const res2 = await supabase
        .from('book_comments')
        .insert(basePayload)
        .select()
        .single();

      if (!res2.error && res2.data) {
        insertedRow = res2.data;
      } else {
        insertError = res2.error;
      }
    } else {
      insertError = res1.error;
    }

    if (insertError) {
      console.warn('Supabase comment insert failed:', insertError);
      const isRls = insertError.message?.includes('violates row-level security');
      return {
        success: false,
        error: isRls
          ? 'لا تملك صلاحية النشر؛ يرجى التأكد من تسجيل الدخول بحساب نشط.'
          : (insertError.message || 'فشل حفظ التعليق في قاعدة البيانات المشتركة.'),
      };
    }

    if (!insertedRow) {
      return { success: false, error: 'لم يُرجع الخادم بيانات التعليق المحفوظ.' };
    }

    // Background sync user profile if possible
    try {
      supabase.from('profiles').upsert({
        id: userId,
        name: userName.trim() || 'قارئ الوادي',
        avatar_url: userAvatar || null,
      }).then(() => {});
    } catch {}

    const confirmedComment: BookComment = {
      id: insertedRow.id,
      book_id: insertedRow.book_id,
      user_id: insertedRow.user_id,
      parent_id: insertedRow.parent_id,
      content: insertedRow.content,
      is_edited: Boolean(insertedRow.is_edited),
      created_at: insertedRow.created_at,
      user_name: insertedRow.user_name || userName || 'قارئ الوادي',
      user_avatar: insertedRow.user_avatar || userAvatar,
      replies: [],
    };

    // Update local storage cache with confirmed comment
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const stored: BookComment[] = raw ? JSON.parse(raw) : [];
      if (parentId) {
        const parent = stored.find((c) => c.id === parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          if (!parent.replies.some((r) => r.id === confirmedComment.id)) {
            parent.replies.push(confirmedComment);
          }
        } else {
          stored.push(confirmedComment);
        }
      } else {
        if (!stored.some((c) => c.id === confirmedComment.id)) {
          stored.push(confirmedComment);
        }
      }
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(stored));
    } catch {}

    return { success: true, comment: confirmedComment };
  } catch (err: any) {
    console.warn('Network exception while adding comment:', err);
    return { success: false, error: err?.message || 'تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.' };
  }
}

export async function updateComment(
  commentId: string,
  userId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  const cleanContent = newContent.trim();
  if (!cleanContent) {
    return { success: false, error: 'لا يمكن حفظ تعليق فارغ.' };
  }
  if (cleanContent.length > 1000) {
    return { success: false, error: 'الحد الأقصى للتعليق هو 1000 حرف.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('book_comments')
        .update({
          content: cleanContent,
          is_edited: true,
        })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select();

      if (error) {
        console.warn('Supabase comment update error:', error.message);
        return { success: false, error: error.message };
      }
      if (!data || data.length === 0) {
        return { success: false, error: 'لم يتم العثور على التعليق أو أنك لا تملك صلاحية تعديله.' };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'فشل الاتصال بالخادم.' };
    }
  }

  // Update local cache
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (raw) {
      const stored: BookComment[] = JSON.parse(raw);
      const updateInTree = (list: BookComment[]): boolean => {
        for (const item of list) {
          if (item.id === commentId) {
            item.content = cleanContent;
            item.is_edited = true;
            return true;
          }
          if (item.replies && updateInTree(item.replies)) return true;
        }
        return false;
      };
      updateInTree(stored);
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(stored));
    }
  } catch {}

  return { success: true };
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('book_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.warn('Supabase comment delete error:', error.message);
        return { success: false, error: error.message };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'فشل حذف التعليق من الخادم.' };
    }
  }

  // Delete in local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    if (raw) {
      let stored: BookComment[] = JSON.parse(raw);
      stored = stored.filter((c) => {
        if (c.id === commentId) return false;
        if (c.replies) {
          c.replies = c.replies.filter((r) => r.id !== commentId);
        }
        return true;
      });
      localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(stored));
    }
  } catch {}

  return { success: true };
}

// ==============================================================================
// 2. COMMENT REPORTS & MODERATION
// ==============================================================================

export async function reportComment(
  commentId: string,
  reporterId: string,
  reason: string,
  commentSnippet?: string,
  bookTitle?: string
): Promise<{ success: boolean; error?: string }> {
  const newReport: CommentReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    comment_id: commentId,
    reporter_id: reporterId,
    reason: reason.trim(),
    status: 'pending',
    created_at: new Date().toISOString(),
    comment_content: commentSnippet,
    book_title: bookTitle,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('comment_reports')
        .insert({
          comment_id: commentId,
          reporter_id: reporterId,
          reason: reason.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        newReport.id = data.id;
      }
    } catch (e) {
      console.warn('Failed to insert report in Supabase', e);
    }
  }

  // Local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    const list: CommentReport[] = raw ? JSON.parse(raw) : [];
    list.unshift(newReport);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }

  return { success: true };
}

export async function fetchPendingReports(): Promise<CommentReport[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('comment_reports')
        .select(`
          *,
          comment:comment_id (content, book_id)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const reporterIds = [...new Set(data.map((r: any) => r.reporter_id).filter(Boolean))];
        const profileMap = new Map<string, string>();
        if (reporterIds.length > 0) {
          try {
            const { data: pData } = await supabase
              .from('profiles')
              .select('id, name')
              .in('id', reporterIds);
            if (pData) {
              pData.forEach((p: any) => profileMap.set(p.id, p.name));
            }
          } catch {}
        }

        return data.map((row: any) => ({
          id: row.id,
          comment_id: row.comment_id,
          reporter_id: row.reporter_id,
          reason: row.reason,
          status: row.status,
          created_at: row.created_at,
          comment_content: row.comment?.content || 'تم حذف نص التعليق أو غير متوفر',
          reporter_name: profileMap.get(row.reporter_id) || 'مستخدم مسجل',
          book_title: row.comment?.book_id ? `كتاب #${row.comment.book_id}` : undefined,
        }));
      }
    } catch (e) {
      console.warn('Error fetching reports from Supabase:', e);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (raw) {
      const list: CommentReport[] = JSON.parse(raw);
      return list.filter((r) => r.status === 'pending');
    }
  } catch {}

  return [];
}

export async function resolveReport(reportId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('comment_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);
    } catch (e) {
      console.warn(e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (raw) {
      const list: CommentReport[] = JSON.parse(raw);
      const target = list.find((r) => r.id === reportId);
      if (target) target.status = 'resolved';
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
    }
  } catch (e) {
    console.warn(e);
  }

  return { success: true };
}

// ==============================================================================
// 3. BOOK RATINGS (1-5 STARS UPSERT)
// ==============================================================================

export async function upsertBookRating(
  bookId: string,
  userId: string,
  ratingValue: number
): Promise<{ success: boolean; averageRating?: number; count?: number; error?: string }> {
  const safeVal = Math.max(1, Math.min(5, Math.round(ratingValue)));

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('book_ratings')
        .upsert(
          {
            book_id: bookId,
            user_id: userId,
            rating_value: safeVal,
          },
          { onConflict: 'book_id,user_id' }
        );

      if (error) {
        console.warn('Supabase rating upsert error:', error.message);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // Local storage update
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RATINGS);
    let list: BookRating[] = raw ? JSON.parse(raw) : [];
    list = list.filter((r) => !(r.book_id === bookId && r.user_id === userId));
    list.push({
      book_id: bookId,
      user_id: userId,
      rating_value: safeVal,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(list));

    const bookRatings = list.filter((r) => r.book_id === bookId);
    const sum = bookRatings.reduce((acc, curr) => acc + curr.rating_value, 0);
    const avg = Number((sum / bookRatings.length).toFixed(1));

    return {
      success: true,
      averageRating: avg,
      count: bookRatings.length,
    };
  } catch {
    return { success: true };
  }
}

export async function fetchUserRating(bookId: string, userId: string): Promise<number | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('book_ratings')
        .select('rating_value')
        .eq('book_id', bookId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data.rating_value;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RATINGS);
    if (raw) {
      const list: BookRating[] = JSON.parse(raw);
      const found = list.find((r) => r.book_id === bookId && r.user_id === userId);
      return found ? found.rating_value : null;
    }
  } catch (e) {
    console.warn(e);
  }

  return null;
}

// ==============================================================================
// 4. CURATED READING LISTS
// ==============================================================================

export async function fetchReadingLists(): Promise<ReadingList[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('reading_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          book_ids: Array.isArray(item.book_ids) ? item.book_ids : [],
          created_at: item.created_at,
        }));
      }
    } catch (e) {
      console.warn('Error fetching reading lists from Supabase:', e);
    }
  }

  // Local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READING_LISTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }

  return INITIAL_READING_LISTS;
}

export async function saveReadingList(
  title: string,
  description: string,
  bookIds: string[]
): Promise<{ success: boolean; list?: ReadingList; error?: string }> {
  const newList: ReadingList = {
    id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description.trim(),
    book_ids: bookIds,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('reading_lists')
        .insert({
          title: title.trim(),
          description: description.trim(),
          book_ids: bookIds,
        })
        .select()
        .single();

      if (!error && data) {
        newList.id = data.id;
      }
    } catch (e) {
      console.warn('Failed to insert reading list in Supabase:', e);
    }
  }

  // Local storage
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READING_LISTS);
    const existing: ReadingList[] = raw ? JSON.parse(raw) : INITIAL_READING_LISTS;
    const updated = [newList, ...existing];
    localStorage.setItem(STORAGE_KEYS.READING_LISTS, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }

  return { success: true, list: newList };
}

export async function deleteReadingList(listId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('reading_lists').delete().eq('id', listId);
    } catch (e) {
      console.warn(e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.READING_LISTS);
    if (raw) {
      const existing: ReadingList[] = JSON.parse(raw);
      const filtered = existing.filter((l) => l.id !== listId);
      localStorage.setItem(STORAGE_KEYS.READING_LISTS, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn(e);
  }

  return { success: true };
}

// ==============================================================================
// 5. ANONYMOUS TELEMETRY & ADMIN ANALYTICS
// ==============================================================================

/**
 * Records an anonymous usage event (view or download) without user ID
 */
export async function trackAnalyticsEvent(bookId: string, eventType: 'view' | 'download'): Promise<void> {
  // Session debounce for views: only 1 view per book per browser session
  if (eventType === 'view') {
    try {
      const sessionKey = `viewed_${bookId}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already viewed this session
      }
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      // ignore sessionStorage failure
    }
  }

  // 1. Supabase background call
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('book_analytics').insert({
        book_id: bookId,
        event_type: eventType,
      });
    } catch (e) {
      // Non-blocking telemetry
    }
  }

  // 2. Local storage telemetry counter for instant offline aggregation
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    const events: BookAnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    events.push({
      book_id: bookId,
      event_type: eventType,
      created_at: new Date().toISOString(),
    });
    // Cap stored local events to last 1000
    if (events.length > 1000) events.splice(0, events.length - 1000);
    localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(events));
  } catch (e) {
    // ignore
  }
}

/**
 * Aggregates analytics summary for the Admin Dashboard
 */
export async function getAnalyticsSummary(books: Book[]): Promise<AnalyticsSummary> {
  let events: BookAnalyticsEvent[] = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('book_analytics')
        .select('*');

      if (!error && data && data.length > 0) {
        events = data;
      }
    } catch (e) {
      console.warn('Error querying analytics from Supabase:', e);
    }
  }

  if (events.length === 0) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (raw) events = JSON.parse(raw);
    } catch {
      events = [];
    }
  }

  // Fallback initial baseline stats if brand new
  if (events.length === 0) {
    events = [
      { book_id: 'book-1', event_type: 'download' },
      { book_id: 'book-1', event_type: 'view' },
      { book_id: 'book-1', event_type: 'view' },
      { book_id: 'book-2', event_type: 'download' },
      { book_id: 'book-2', event_type: 'view' },
      { book_id: 'book-3', event_type: 'download' },
      { book_id: 'book-4', event_type: 'view' },
      { book_id: 'book-5', event_type: 'download' },
      { book_id: 'book-6', event_type: 'download' },
    ];
  }

  const downloadMap = new Map<string, number>();
  const viewMap = new Map<string, number>();
  let totalViews = 0;
  let totalDownloads = 0;

  for (const ev of events) {
    if (ev.event_type === 'download') {
      totalDownloads++;
      downloadMap.set(ev.book_id, (downloadMap.get(ev.book_id) || 0) + 1);
    } else if (ev.event_type === 'view') {
      totalViews++;
      viewMap.set(ev.book_id, (viewMap.get(ev.book_id) || 0) + 1);
    }
  }

  const bookMap = new Map(books.map((b) => [b.id, b]));

  const mostDownloadedBooks = Array.from(downloadMap.entries())
    .map(([bookId, count]) => {
      const book = bookMap.get(bookId);
      return {
        bookId,
        title: book?.title || `كتاب #${bookId}`,
        count,
        coverImage: book?.coverImage,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostViewedBooks = Array.from(viewMap.entries())
    .map(([bookId, count]) => {
      const book = bookMap.get(bookId);
      return {
        bookId,
        title: book?.title || `كتاب #${bookId}`,
        count,
        coverImage: book?.coverImage,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalViews,
    totalDownloads,
    mostDownloadedBooks,
    mostViewedBooks,
  };
}
