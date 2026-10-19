/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookComment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { 
  fetchBookComments, 
  addComment, 
  updateComment, 
  deleteComment, 
  reportComment 
} from '../../services/communityService';
import { 
  MessageSquare, 
  Send, 
  CornerDownLeft, 
  Edit3, 
  Trash2, 
  Flag, 
  WifiOff, 
  AlertCircle, 
  Check, 
  X,
  User,
  Radio,
  RefreshCw,
  Clock,
  LogIn,
  Loader2
} from 'lucide-react';

interface BookDiscussionsProps {
  bookId: string;
  bookTitle: string;
}

interface PendingComment {
  tempId: string;
  bookId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  userName: string;
  userAvatar?: string;
  status: 'pending' | 'failed';
  error?: string;
}

const STORAGE_PENDING_KEY = 'alwadi_pending_comments_queue';

export const BookDiscussions: React.FC<BookDiscussionsProps> = ({ bookId, bookTitle }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useLibrary();
  const { navigateTo } = useRouter();

  const [comments, setComments] = useState<BookComment[]>([]);
  const [pendingComments, setPendingComments] = useState<PendingComment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PENDING_KEY);
      if (saved) {
        const parsed: PendingComment[] = JSON.parse(saved);
        return parsed.filter((p) => p.bookId === bookId);
      }
    } catch {}
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);

  // Replying state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // In-app Delete Confirmation Modal state (prevents window.confirm)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Reporting modal state
  const [reportingComment, setReportingComment] = useState<BookComment | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Rate limiting (last comment timestamp)
  const [lastCommentTime, setLastCommentTime] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Sync pending comments to local storage
  const savePendingQueue = (items: PendingComment[]) => {
    try {
      const raw = localStorage.getItem(STORAGE_PENDING_KEY);
      let all: PendingComment[] = raw ? JSON.parse(raw) : [];
      all = all.filter((p) => p.bookId !== bookId);
      all.push(...items);
      localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(all));
    } catch {}
  };

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadComments(false);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [bookId]);

  // Initial and Refresh Fetch from Supabase
  const loadComments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchBookComments(bookId);
      setComments(data);
    } catch (err: any) {
      console.warn('Failed to fetch book comments from Supabase:', err);
      setFetchError('تعذر جلب أحدث النقاشات من الخادم. يرجى التحقق من الاتصال.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadComments(true);
  }, [loadComments]);

  // Re-fetch on Window Focus to ensure no missed messages
  useEffect(() => {
    const handleFocus = () => {
      if (navigator.onLine) {
        loadComments(false);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadComments]);

  // ==============================================================================
  // SUPABASE REALTIME SUBSCRIPTION
  // ==============================================================================
  useEffect(() => {
    if (!isSupabaseConfigured() || !bookId) return;

    let isMounted = true;
    const channelName = `realtime-discussions-${bookId}-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'book_comments',
          filter: `book_id=eq.${bookId}`,
        },
        (payload: any) => {
          if (!isMounted) return;
          const { eventType, new: newRow, old: oldRow } = payload;

          if (eventType === 'INSERT') {
            if (!newRow || newRow.book_id !== bookId) return;

            setComments((prev) => {
              // Idempotent check: prevent adding duplicate if ID already present
              const existsTop = prev.some((c) => c.id === newRow.id);
              const existsReply = prev.some((c) => c.replies?.some((r) => r.id === newRow.id));
              if (existsTop || existsReply) return prev;

              const incomingComment: BookComment = {
                id: newRow.id,
                book_id: newRow.book_id,
                user_id: newRow.user_id,
                parent_id: newRow.parent_id,
                content: newRow.content,
                is_edited: Boolean(newRow.is_edited),
                created_at: newRow.created_at || new Date().toISOString(),
                user_name: newRow.user_name || (newRow.user_id === user?.id ? user.name : 'قارئ الوادي'),
                user_avatar: newRow.user_avatar || (newRow.user_id === user?.id ? user.avatarUrl : undefined),
                replies: [],
              };

              // If reply
              if (incomingComment.parent_id) {
                return prev.map((p) => {
                  if (p.id === incomingComment.parent_id) {
                    const alreadyInReplies = (p.replies || []).some((r) => r.id === incomingComment.id);
                    if (alreadyInReplies) return p;
                    return {
                      ...p,
                      replies: [...(p.replies || []), incomingComment],
                    };
                  }
                  return p;
                });
              }

              // Top-level comment
              return [...prev, incomingComment];
            });
          } else if (eventType === 'UPDATE') {
            if (!newRow) return;

            setComments((prev) =>
              prev.map((c) => {
                if (c.id === newRow.id) {
                  return {
                    ...c,
                    content: newRow.content,
                    is_edited: Boolean(newRow.is_edited),
                  };
                }
                if (c.replies) {
                  return {
                    ...c,
                    replies: c.replies.map((r) =>
                      r.id === newRow.id
                        ? { ...r, content: newRow.content, is_edited: Boolean(newRow.is_edited) }
                        : r
                    ),
                  };
                }
                return c;
              })
            );
          } else if (eventType === 'DELETE') {
            const targetId = oldRow?.id;
            if (!targetId) return;

            setComments((prev) =>
              prev
                .filter((c) => c.id !== targetId)
                .map((c) => ({
                  ...c,
                  replies: c.replies?.filter((r) => r.id !== targetId),
                }))
            );
          }
        }
      )
      .subscribe((status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          setIsRealtimeActive(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeActive(false);
          // On reconnection event or error, perform state reconciliation
          loadComments(false);
        }
      });

    return () => {
      isMounted = false;
      setIsRealtimeActive(false);
      supabase.removeChannel(channel);
    };
  }, [bookId, user?.id, user?.name, user?.avatarUrl, loadComments]);

  // Retry sending an offline/pending comment
  const handleRetryPending = async (item: PendingComment) => {
    if (!isAuthenticated || !user?.id) {
      showToast('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول لإرسال التعليق', 'warning');
      return;
    }
    if (!isOnline) {
      showToast('غير متصل', 'يتطلب الإرسال اتصالاً بالإنترنت', 'warning');
      return;
    }

    const res = await addComment(
      item.bookId,
      user.id,
      user.name || 'قارئ الوادي',
      item.content,
      item.parentId,
      user.avatarUrl
    );

    if (res.success && res.comment) {
      // Remove from pending
      setPendingComments((prev) => {
        const next = prev.filter((p) => p.tempId !== item.tempId);
        savePendingQueue(next);
        return next;
      });

      // Add to confirmed comments
      setComments((prev) => {
        if (item.parentId) {
          return prev.map((c) =>
            c.id === item.parentId
              ? { ...c, replies: [...(c.replies || []).filter((r) => r.id !== res.comment!.id), res.comment!] }
              : c
          );
        }
        if (prev.some((c) => c.id === res.comment!.id)) return prev;
        return [...prev, res.comment!];
      });

      showToast('تم إرسال التعليق', 'تم حفظ التعليق بنجاح في قاعدة البيانات المشتركة', 'success');
    } else {
      showToast('فشل الإرسال', res.error || 'تعذر الإرسال للخادم المشترك', 'error');
    }
  };

  const handleDismissPending = (tempId: string) => {
    setPendingComments((prev) => {
      const next = prev.filter((p) => p.tempId !== tempId);
      savePendingQueue(next);
      return next;
    });
  };

  // POST MAIN COMMENT
  const handlePostComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCommentText.trim();
    if (!clean) return;

    if (!isAuthenticated || !user?.id) {
      showToast('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول للمشاركة في نقاشات الكتاب', 'warning');
      navigateTo('login');
      return;
    }

    // Rate limiting: 5 seconds debounce against accidental spam
    const now = Date.now();
    if (now - lastCommentTime < 5000) {
      const waitSec = Math.ceil((5000 - (now - lastCommentTime)) / 1000);
      showToast('مهلاً قليلاً', `يرجى الانتظار ${waitSec} ثانية قبل إضافة تعليق جديد منعاً للتكرار`, 'warning');
      return;
    }

    // If device is offline, buffer into pending queue
    if (!isOnline) {
      const pendingItem: PendingComment = {
        tempId: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookId,
        content: clean,
        createdAt: new Date().toISOString(),
        userName: user.name || 'قارئ الوادي',
        userAvatar: user.avatarUrl,
        status: 'pending',
      };
      setPendingComments((prev) => {
        const next = [...prev, pendingItem];
        savePendingQueue(next);
        return next;
      });
      setNewCommentText('');
      showToast('بانتظار الاتصال', 'تم حفظ التعليق محلياً وسيتم إرساله تلقائياً فور عودة الإنترنت', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addComment(
        bookId,
        user.id,
        user.name || 'قارئ الوادي',
        clean,
        null,
        user.avatarUrl
      );

      if (res.success && res.comment) {
        const confirmed = res.comment;
        setComments((prev) => {
          if (prev.some((c) => c.id === confirmed.id)) return prev;
          return [...prev, confirmed];
        });
        setNewCommentText('');
        setLastCommentTime(Date.now());
        showToast('تم نشر تعليقك', 'أصبح تعليقك متاحاً لجميع القراء الآن', 'success');
      } else {
        showToast('تعذر نشر التعليق', res.error || 'حدث خطأ أثناء حفظ التعليق على الخادم', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // POST REPLY TO COMMENT
  const handlePostReply = async (parentId: string) => {
    const clean = replyText.trim();
    if (!clean) return;

    if (!isAuthenticated || !user?.id) {
      showToast('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول للرد على التعليق', 'warning');
      navigateTo('login');
      return;
    }

    if (!isOnline) {
      const pendingItem: PendingComment = {
        tempId: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bookId,
        parentId,
        content: clean,
        createdAt: new Date().toISOString(),
        userName: user.name || 'قارئ الوادي',
        userAvatar: user.avatarUrl,
        status: 'pending',
      };
      setPendingComments((prev) => {
        const next = [...prev, pendingItem];
        savePendingQueue(next);
        return next;
      });
      setReplyingToId(null);
      setReplyText('');
      showToast('بانتظار الاتصال', 'تم حفظ ردك محلياً وسيتم إرساله عند الاتصال', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addComment(
        bookId,
        user.id,
        user.name || 'قارئ الوادي',
        clean,
        parentId,
        user.avatarUrl
      );

      if (res.success && res.comment) {
        const confirmed = res.comment;
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              const currentReplies = c.replies || [];
              if (currentReplies.some((r) => r.id === confirmed.id)) return c;
              return {
                ...c,
                replies: [...currentReplies, confirmed],
              };
            }
            return c;
          })
        );
        setReplyingToId(null);
        setReplyText('');
        setLastCommentTime(Date.now());
        showToast('تمت إضافة الرد', 'تم نشر ردك لجميع القراء بنجاح', 'success');
      } else {
        showToast('فشل إرسال الرد', res.error || 'تعذر حفظ الرد على الخادم', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // SAVE EDIT
  const handleSaveEdit = async (commentId: string) => {
    const clean = editText.trim();
    if (!clean) {
      showToast('تنبيه', 'لا يمكن حفظ تعليق فارغ', 'warning');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await updateComment(commentId, user?.id || '', clean);
      if (res.success) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return { ...c, content: clean, is_edited: true };
            }
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, content: clean, is_edited: true } : r
                ),
              };
            }
            return c;
          })
        );
        setEditingId(null);
        setEditText('');
        showToast('تم التعديل', 'تم حفظ التعديلات على تعليقك وتحديثها للجميع', 'success');
      } else {
        showToast('فشل التعديل', res.error || 'تعذر تعديل التعليق على الخادم', 'error');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  // DELETE COMMENT
  const executeDelete = async () => {
    if (!deletingCommentId) return;

    setIsDeleting(true);
    try {
      const res = await deleteComment(deletingCommentId, user?.id || '');
      if (res.success) {
        setComments((prev) =>
          prev
            .filter((c) => c.id !== deletingCommentId)
            .map((c) => ({
              ...c,
              replies: c.replies?.filter((r) => r.id !== deletingCommentId),
            }))
        );
        showToast('تم الحذف', 'حُذف التعليق بنجاح من قاعدة البيانات', 'info');
      } else {
        showToast('فشل الحذف', res.error || 'تعذر حذف التعليق من الخادم', 'error');
      }
    } finally {
      setIsDeleting(false);
      setDeletingCommentId(null);
    }
  };

  // SEND REPORT TO ADMIN
  const handleSendReport = async () => {
    if (!reportingComment || !reportReason.trim()) return;

    setIsSubmittingReport(true);
    try {
      await reportComment(
        reportingComment.id,
        user?.id || 'anon',
        reportReason.trim(),
        reportingComment.content,
        bookTitle
      );
      showToast('تم إرسال البلاغ', 'شكراً لمساعدتنا في الحفاظ على مجتمع قراءة راقٍ، ستتم مراجعة البلاغ من قبل الإدارة', 'success');
      setReportingComment(null);
      setReportReason('');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const totalDiscussionsCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) + pendingComments.length;

  return (
    <div className="space-y-6 pt-6 border-t border-[var(--border-subtle)] animate-in fade-in">
      {/* Header with Title and Live Realtime Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                نقاشات القراء ({totalDiscussionsCount})
              </h2>

              {isRealtimeActive ? (
                <span 
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
                  title="البث المباشر للرسائل نشط بين جميع الأجهزة (Realtime Active)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>مباشر (Realtime)</span>
                </span>
              ) : (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                  title="متصل بقاعدة البيانات السحابية المشتركة"
                >
                  <Radio className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>سحابي متصل</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              مساحة نقاش حية ومتبادلة بين جميع مستخدمي التطبيق ومحبي القراءة
            </p>
          </div>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={() => loadComments(true)}
          disabled={isLoading}
          className="self-start sm:self-auto min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          title="تحديث النقاشات وجلب أحدث الردود"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      {/* Offline Status Warning */}
      {!isOnline && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="font-semibold">
            أنت غير متصل بالإنترنت حالياً. يتم عرض النقاشات المحفوظة، وأي تعليق جديد سيُحفظ بانتظار عودة الاتصال.
          </span>
        </div>
      )}

      {/* Fetch Error Notice */}
      {fetchError && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadComments(true)}
            className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition-colors shrink-0"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Pending Offline Comments Banner */}
      {pendingComments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>تعليقات بانتظار الإرسال إلى السيرفر ({pendingComments.length}):</span>
          </div>

          <div className="space-y-2">
            {pendingComments.map((item) => (
              <div
                key={item.tempId}
                className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-dashed border-amber-300 dark:border-amber-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[var(--text-primary)]">{item.userName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                      بانتظار الإرسال
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] truncate">{item.content}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isOnline && (
                    <button
                      type="button"
                      onClick={() => handleRetryPending(item)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors active:scale-95"
                    >
                      إرسال الآن
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDismissPending(item.tempId)}
                    className="p-1 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors"
                    title="إلغاء التعليق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Comment Box or Login Prompt */}
      {isAuthenticated ? (
        <form onSubmit={handlePostComment} className="space-y-2.5">
          <div className="relative">
            <textarea
              rows={3}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="شارك رأيك أو استفسارك أو تحليلك الأدبي حول هذا الكتاب..."
              disabled={isSubmitting}
              maxLength={1000}
              className="w-full p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none transition-colors disabled:opacity-60"
            />
            <div className="absolute bottom-2.5 end-3 text-[10px] text-[var(--text-muted)] font-mono">
              {newCommentText.length}/1000
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--text-muted)]">
              يصل تعليقك فوراً إلى جميع القراء مع مراعاة الحوار الأدبي الراقي.
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !newCommentText.trim()}
              className="min-h-[42px] px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جارٍ النشر...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر التعليق</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
                انضم إلى حوار القراء ومجتمع مكتبة الوادي
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                سجّل الدخول بحسابك المجاني لتتمكن من كتابة التعليقات، والرد على القراء، ومشاركة آرائك.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('login')}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold transition-all active:scale-95 shadow-xs shrink-0"
          >
            تسجيل الدخول للمشاركة
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--brand-primary)]" />
            <p>جارٍ تحميل نقاشات القراء من قاعدة البيانات...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-[var(--text-muted)]" />
            <p className="font-bold text-[var(--text-primary)]">لا توجد نقاشات بعد حول هذا الكتاب</p>
            <p>كن أول من يفتتح الحوار ويشارك انطباعاته وقراءته النقدية مع رواد المكتبة!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = user?.id === comment.user_id;
            const canDelete = isOwner || isAdmin;
            const isEditing = editingId === comment.id;
            const isReplying = replyingToId === comment.id;

            return (
              <div 
                key={comment.id}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-xs transition-all hover:border-[var(--brand-primary)]/20"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--bg-secondary)] border border-black/5 shrink-0 flex items-center justify-center text-[var(--text-muted)] font-bold text-xs">
                      {comment.user_avatar ? (
                        <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {comment.user_name || 'قارئ مسجل'}
                        </span>
                        {comment.is_edited && (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            (مُعدل)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                        {new Date(comment.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Reply, Edit, Delete, Report) */}
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    {isAuthenticated && isOnline && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(isReplying ? null : comment.id);
                          setReplyText('');
                        }}
                        className="min-h-[32px] px-2 rounded-lg hover:bg-[var(--bg-secondary)] hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1"
                        title="الرد على هذا التعليق"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">رد</span>
                      </button>
                    )}

                    {isOwner && isOnline && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(isEditing ? null : comment.id);
                          setEditText(comment.content);
                        }}
                        className="min-h-[32px] p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] hover:text-amber-500 transition-colors"
                        title="تعديل التعليق"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingCommentId(comment.id)}
                        className="min-h-[32px] p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
                        title="حذف التعليق"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAuthenticated && !isOwner && isOnline && (
                      <button
                        type="button"
                        onClick={() => setReportingComment(comment)}
                        className="min-h-[32px] p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
                        title="إبلاغ عن محتوى غير لائق"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Content or Inline Edit Form */}
                {isEditing ? (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <textarea
                      rows={2}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={1000}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--brand-primary)] text-xs text-[var(--text-primary)] focus:outline-none"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={isSavingEdit}
                        className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSavingEdit || !editText.trim()}
                        className="px-4 py-1.5 rounded-xl text-xs bg-[var(--brand-primary)] text-white font-bold hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isSavingEdit ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}

                {/* Inline Reply Form */}
                {isReplying && isOnline && (
                  <div className="ms-3 sm:ms-6 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2 animate-in fade-in">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      maxLength={1000}
                      placeholder={`الرد على ${comment.user_name || 'القارئ'}...`}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyingToId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-black/5"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePostReply(comment.id)}
                        disabled={!replyText.trim() || isSubmitting}
                        className="px-4 py-1.5 rounded-xl text-xs bg-[var(--brand-primary)] text-white font-bold hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 transition-all"
                      >
                        {isSubmitting ? 'جارٍ الإرسال...' : 'إرسال الرد'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 1-Level Deep Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ms-3 sm:ms-6 border-s-2 border-[var(--brand-primary)]/20 ps-3 sm:ps-4 space-y-3 pt-2">
                    {comment.replies.map((reply) => {
                      const isReplyOwner = user?.id === reply.user_id;
                      const canDeleteReply = isReplyOwner || isAdmin;
                      const isEditingReply = editingId === reply.id;

                      return (
                        <div key={reply.id} className="p-3 rounded-xl bg-[var(--bg-secondary)]/60 border border-[var(--border-subtle)] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] text-[10px]">
                                {reply.user_avatar ? (
                                  <img src={reply.user_avatar} alt={reply.user_name} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-3 h-3" />
                                )}
                              </div>
                              <span className="text-xs font-bold text-[var(--text-primary)]">
                                {reply.user_name || 'قارئ الوادي'}
                              </span>
                              {reply.is_edited && (
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">(معدل)</span>
                              )}
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                · {new Date(reply.created_at).toLocaleDateString('ar-EG')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                              {isReplyOwner && isOnline && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(isEditingReply ? null : reply.id);
                                    setEditText(reply.content);
                                  }}
                                  className="p-1 hover:text-amber-500 rounded"
                                  title="تعديل الرد"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                              {canDeleteReply && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingCommentId(reply.id)}
                                  className="p-1 hover:text-red-500 rounded"
                                  title="حذف الرد"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                              {isAuthenticated && !isReplyOwner && isOnline && (
                                <button
                                  type="button"
                                  onClick={() => setReportingComment(reply)}
                                  className="p-1 hover:text-red-500 rounded"
                                  title="إبلاغ"
                                >
                                  <Flag className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditingReply ? (
                            <div className="space-y-2 animate-in fade-in">
                              <textarea
                                rows={2}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                maxLength={1000}
                                className="w-full p-2 rounded-lg bg-[var(--bg-surface)] border text-xs text-[var(--text-primary)] focus:outline-none"
                              />
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-1 text-xs text-[var(--text-muted)]"
                                >
                                  إلغاء
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(reply.id)}
                                  className="px-3 py-1 text-xs bg-[var(--brand-primary)] text-white font-bold rounded-lg"
                                >
                                  حفظ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                              {reply.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* In-app Delete Confirmation Modal (Zero window.confirm) */}
      {deletingCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="max-w-sm w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                تأكيد حذف التعليق
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا التعليق نهائياً؟ سيتم حذفه من قاعدة البيانات لجميع القراء.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCommentId(null)}
                disabled={isDeleting}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-bold border border-[var(--border-subtle)] bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="flex-1 min-h-[44px] rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جارٍ الحذف...</span>
                  </>
                ) : (
                  <span>نعم، حذف التعليق</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Comment Modal */}
      {reportingComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="max-w-md w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Flag className="w-5 h-5" />
                <h3 className="text-sm font-black">إبلاغ عن محتوى غير لائق</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportingComment(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              سيتم إرسال هذا التعليق إلى لوحة إشراف إدارة مكتبة الوادي للمراجعة واتخاذ الإجراء اللازم.
            </p>

            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] italic line-clamp-2 border border-[var(--border-subtle)]">
              "{reportingComment.content}"
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] block">
                سبب الإبلاغ:
              </label>
              <textarea
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="اكتب توضيحاً مختصراً لسبب البلاغ (محتوى مسيء، حرق أحداث، رسائل مزعجة، إلخ)..."
                className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportingComment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendReport}
                disabled={!reportReason.trim() || isSubmittingReport}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all disabled:opacity-50"
              >
                {isSubmittingReport ? 'جارٍ الإرسال...' : 'إرسال البلاغ للإدارة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
