/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CommentReport } from '../../types';
import { fetchPendingReports, resolveReport, deleteComment } from '../../services/communityService';
import { useLibrary } from '../../context/LibraryContext';
import { 
  ShieldAlert, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';

export const ModerationManagement: React.FC = () => {
  const { showToast } = useLibrary();
  const [reports, setReports] = useState<CommentReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPendingReports();
      setReports(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDeleteComment = async (report: CommentReport) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التعليق نهائياً؟')) return;

    setProcessingId(report.id);
    try {
      await deleteComment(report.comment_id, 'admin');
      await resolveReport(report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      showToast('تم حذف التعليق', 'تمت إزالة التعليق المخالف وإغلاق البلاغ', 'success');
    } catch {
      showToast('خطأ', 'فشل حذف التعليق', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await resolveReport(reportId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      showToast('تم تجاهل البلاغ', 'تم حفظ التقرير كـ مكتمل دون حذف التعليق', 'info');
    } catch {
      showToast('خطأ', 'فشل تحديث حالة البلاغ', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            لوحة الإشراف وإدارة البلاغات
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            مراجعة التعليقات والنقاشات المبلغ عنها من قبل القراء للحفاظ على بيئة أدبية راقية
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={isLoading}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center gap-2 self-start sm:self-auto transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث البلاغات</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse">
          جارٍ جلب البلاغات المعلقة...
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            لا توجد بلاغات معلقة حالياً
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            مجتمع القراء نظيف ولا توجد أي مخالفات أو تقارير تتطلب مراجعة المشرف في الوقت الراهن.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const isProcessing = processingId === report.id;

            return (
              <div
                key={report.id}
                className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-red-200 dark:border-red-900/40 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold font-mono">
                      بلاغ جديد
                    </span>
                    <span className="text-[var(--text-muted)]">
                      مُقدَّم من: <strong className="text-[var(--text-primary)]">{report.reporter_name}</strong>
                    </span>
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(report.created_at).toLocaleString('ar-EG')}</span>
                  </span>
                </div>

                {/* Reason */}
                <div className="p-3 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-700 dark:text-red-300 space-y-1">
                  <span className="font-bold block">سبب الإبلاغ المذكور:</span>
                  <p>{report.reason}</p>
                </div>

                {/* Comment content */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[var(--text-muted)] block">
                    نص التعليق المبلغ عنه:
                  </span>
                  <blockquote className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed italic">
                    "{report.comment_content || 'نص التعليق'}"
                  </blockquote>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDismissReport(report.id)}
                    className="min-h-[40px] px-4 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] transition-colors disabled:opacity-50"
                  >
                    تجاهل البلاغ (سليم)
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDeleteComment(report)}
                    className="min-h-[40px] px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف التعليق وإغلاق البلاغ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
