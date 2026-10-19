import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BookRequest } from '../../types';
import { 
  BookPlus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Calendar, 
  User, 
  Search,
  Filter,
  Check,
  AlertCircle
} from 'lucide-react';

export const BookRequestsManagement: React.FC = () => {
  const { bookRequests, updateRequestStatus, removeBookRequest, loadBookRequests, showToast } = useLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled' | 'rejected'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRequests = bookRequests.filter((req) => {
    const matchesSearch = req.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.userName && req.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'fulfilled' | 'rejected') => {
    await updateRequestStatus(id, newStatus);
    showToast('تم تحديث حالة الطلب', undefined, 'success');
  };

  const handleDelete = async (id: string) => {
    await removeBookRequest(id);
    setDeletingId(null);
    showToast('تم حذف الطلب', undefined, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            طلبات واقتراحات الكتب
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            متابعة وإدارة عناوين الكتب المقترحة من قبل رواد المكتبة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 font-mono">
            {bookRequests.length} طلب إجمالي
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث في عناوين الكتب المطلوبة..."
            className="w-full min-h-[44px] ps-10 pe-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'fulfilled', 'rejected'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {st === 'all' && 'الكل'}
              {st === 'pending' && 'قيد المراجعة'}
              {st === 'fulfilled' && 'تم توفيره'}
              {st === 'rejected' && 'معتذر عنه'}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
          <BookPlus className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            لا توجد طلبات كتب مطابقة
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            عندما يقدم الزوار طلبات لإضافة كتب، ستظهر هنا للإدارة.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    {req.bookTitle}
                  </h3>
                  
                  {req.status === 'pending' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      قيد المراجعة
                    </span>
                  )}
                  {req.status === 'fulfilled' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      تم توفيره في المكتبة
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30">
                      معتذر عنه
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {req.userName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{req.userName}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(req.createdAt).toLocaleDateString('ar-EG')}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {req.status !== 'fulfilled' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(req.id, 'fulfilled')}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1 active:scale-95"
                    title="تحديد كـ تم التوفير"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم التوفير</span>
                  </button>
                )}

                {req.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(req.id, 'rejected')}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1 active:scale-95"
                    title="تحديد كـ اعتذار"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>اعتذار</span>
                  </button>
                )}

                {req.status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(req.id, 'pending')}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1 active:scale-95"
                    title="إعادة للمراجعة"
                  >
                    <Clock className="w-4 h-4" />
                    <span>مراجعة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(req.id)}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors flex items-center justify-center active:scale-95"
                  title="حذف الطلب نهائياً"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
