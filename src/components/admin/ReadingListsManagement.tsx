/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ReadingList, Book } from '../../types';
import { fetchReadingLists, saveReadingList, deleteReadingList } from '../../services/communityService';
import { useLibrary } from '../../context/LibraryContext';
import { 
  BookMarked, 
  Plus, 
  Trash2, 
  Check, 
  Search, 
  Layers, 
  Calendar,
  X
} from 'lucide-react';

export const ReadingListsManagement: React.FC = () => {
  const { allBooks, showToast } = useLibrary();
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadLists = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReadingLists();
      setLists(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const toggleBookSelection = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('حقول مطلوبة', 'يرجى كتابة عنوان ووصف قائمة القراءة', 'warning');
      return;
    }

    if (selectedBookIds.length === 0) {
      showToast('اختيار الكتب مطلوب', 'يرجى اختيار كتاب واحد على الأقل لإضافته للقائمة', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveReadingList(title, description, selectedBookIds);
      if (res.success && res.list) {
        setLists((prev) => [res.list!, ...prev]);
        showToast('تم إنشاء قائمة القراءة', `أضيفت "${title}" بنجاح وتظهر الآن لرواد المكتبة`, 'success');
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setSelectedBookIds([]);
        setBookSearchQuery('');
      }
    } catch {
      showToast('خطأ', 'فشل حفظ قائمة القراءة', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (listId: string, listTitle: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف قائمة "${listTitle}"؟`)) return;

    try {
      await deleteReadingList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
      showToast('تم حذف القائمة', `أزيلت قائمة "${listTitle}" بنجاح`, 'info');
    } catch {
      showToast('خطأ', 'فشل حذف القائمة', 'error');
    }
  };

  const filteredBooksForPicker = allBooks.filter((b) => {
    if (!bookSearchQuery.trim()) return true;
    const q = bookSearchQuery.toLowerCase();
    return b.title.toLowerCase().includes(q) || b.author?.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            إدارة قوائم القراءة المختارة (Curated Lists)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            إنشاء وتخصيص مجموعات كتب موضوعية تظهر كـ مسارات قراءة موجهة لزوار الصفحة الرئيسية
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="min-h-[44px] px-5 rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء قائمة قراءة جديدة</span>
        </button>
      </div>

      {/* Lists Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-[var(--text-muted)] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse">
          جارٍ تحميل قوائم القراءة...
        </div>
      ) : lists.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center mx-auto">
            <BookMarked className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            لا توجد قوائم قراءة حالياً
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            ابدأ بإنشاء أول قائمة قراءة مختارة (مثل: "مقدمة في الفلسفة" أو "روائع الأدب العربي") لتظهر في الصفحة الرئيسية.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => {
            const listBooks = allBooks.filter((b) => list.book_ids.includes(b.id));

            return (
              <div
                key={list.id}
                className="p-5 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[var(--brand-surface)] text-[var(--brand-primary)] font-mono">
                      {list.book_ids.length} كتب
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteList(list.id, list.title)}
                      className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="حذف القائمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    {list.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {list.description}
                  </p>
                </div>

                {/* Books Cover Preview Strip */}
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-2">
                    الكتب المشمولة في هذه القائمة:
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {listBooks.map((b) => (
                      <div
                        key={b.id}
                        className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-black/10 shadow-sm relative group"
                        title={b.title}
                      >
                        <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Reading List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
          <div className="max-w-2xl w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center">
                  <BookMarked className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  إنشاء قائمة قراءة مختارة جديدة
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] block">
                  عنوان القائمة (بالعربية): *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: روائع التاريخ والحضارة، مدخل إلى الفلسفة، إلخ..."
                  className="w-full h-11 px-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)] block">
                  وصف القائمة والهدف منها: *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب نبذة مختصرة تشرح للقارئ محتوى وأهمية هذه القائمة..."
                  className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none resize-none"
                />
              </div>

              {/* Books Multi-Select Section */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    اختر الكتب المشمولة ({selectedBookIds.length} كتب مختارة): *
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    انقر لاختيار أو إلغاء اختيار الكتاب
                  </span>
                </div>

                {/* Search in books */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute end-3.5 top-3 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    placeholder="ابحث بالعنوان أو اسم الكاتب لتسهيل الاختيار..."
                    className="w-full h-10 ps-3.5 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                {/* Books grid picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
                  {filteredBooksForPicker.map((b) => {
                    const isSelected = selectedBookIds.includes(b.id);

                    return (
                      <div
                        key={b.id}
                        onClick={() => toggleBookSelection(b.id)}
                        className={`p-2 rounded-xl border flex items-center gap-3 cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'bg-[var(--brand-surface)] border-[var(--brand-primary)]'
                            : 'bg-[var(--bg-secondary)]/50 border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        <img
                          src={b.coverImage}
                          alt={b.title}
                          className="w-9 h-12 rounded-lg object-cover border border-black/5 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {b.title}
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)] truncate block">
                            {b.author?.name} · {b.category}
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedBookIds.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ ونشر القائمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
