import React, { useState, useMemo } from 'react';
import { Book, BookCategory, BookStatus } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { 
  Search, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Flame, 
  Sparkles, 
  Star, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Check, 
  X,
  Filter,
  FileText,
  ExternalLink
} from 'lucide-react';

interface BooksManagementProps {
  onAddNewBook: () => void;
  onEditBook: (book: Book) => void;
}

export const BooksManagement: React.FC<BooksManagementProps> = ({
  onAddNewBook,
  onEditBook,
}) => {
  const { 
    allBooks, 
    deleteBookPermanent, 
    toggleBookTrending, 
    toggleBookNew, 
    setBookOfTheDay, 
    updateBookStatus,
    categoriesList
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Delete modal state
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return allBooks.filter((book) => {
      // 1. Text Search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        book.title.toLowerCase().includes(q) ||
        (book.author?.name && book.author.name.toLowerCase().includes(q)) ||
        book.keywords?.some((k) => k.toLowerCase().includes(q));

      // 2. Category Filter
      const matchesCat = selectedCategory === 'all' || book.category === selectedCategory;

      // 3. Status Filter
      const currentStatus = book.status || 'published';
      const matchesStatus = selectedStatus === 'all' || currentStatus === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [allBooks, searchQuery, selectedCategory, selectedStatus]);

  const confirmDelete = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    try {
      await deleteBookPermanent(bookToDelete.id);
      setBookToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const statusMap: Record<BookStatus, { label: string; bg: string; text: string; icon: React.FC<{ className?: string }> }> = {
    published: { label: 'منشور', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', icon: Eye },
    draft: { label: 'مسودة', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: FileText },
    hidden: { label: 'مخفي', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-700 dark:text-rose-400', icon: EyeOff },
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">إدارة الكتب والمحتوى</h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            إدارة {allBooks.length} كتاباً في المكتبة، التحكم في حالات النشر، وتحديد الكتب الرائجة وكتاب اليوم.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewBook}
          className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة كتاب جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بعنوان الكتاب، اسم المؤلف، أو الكلمات الدلالية..."
            className="w-full h-11 pr-10 pl-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--brand-primary)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium focus:outline-hidden focus:border-[var(--brand-primary)]"
          >
            <option value="all">جميع التصنيفات ({allBooks.length})</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium focus:outline-hidden focus:border-[var(--brand-primary)]"
          >
            <option value="all">كافة الحالات</option>
            <option value="published">منشور فقط (عام)</option>
            <option value="draft">مسودات (Draft)</option>
            <option value="hidden">مخفي مؤقتاً</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-bold">
              <tr>
                <th className="py-3.5 px-4 w-16">الغلاف</th>
                <th className="py-3.5 px-4 min-w-[200px]">الكتاب والمؤلف</th>
                <th className="py-3.5 px-4">التصنيف</th>
                <th className="py-3.5 px-4">حالة النشر</th>
                <th className="py-3.5 px-4">إعدادات العرض والتنسيق</th>
                <th className="py-3.5 px-4 text-center w-28">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    <p className="text-sm font-bold">لا توجد كتب مطابقة لمعايير البحث والفلترة.</p>
                    <p className="text-xs mt-1">جرب تغيير الكلمات المفتاحية أو التصنيف المختار.</p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const status = book.status || 'published';
                  const statusConfig = statusMap[status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr 
                      key={book.id} 
                      className={`hover:bg-[var(--bg-secondary)]/50 transition-colors ${
                        book.isBookOfTheDay ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Cover Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-16 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shadow-xs border border-[var(--border-subtle)] shrink-0">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        </div>
                      </td>

                      {/* Title & Author */}
                      <td className="py-3 px-4">
                        <div className="font-black text-[var(--text-primary)] text-sm line-clamp-1">
                          {book.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          بقلم: <span className="font-bold">{book.author?.name || 'مؤلف غير معروف'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1">
                          <span>{book.pages} صفحة</span>
                          <span>·</span>
                          <span>{book.fileSize}</span>
                          {book.formats && book.formats.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="uppercase">{book.formats.join(' / ')}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                          {book.category}
                        </span>
                      </td>

                      {/* Status Dropdown/Selector */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={status}
                            onChange={(e) => updateBookStatus(book.id, e.target.value as BookStatus)}
                            className={`h-8 px-2.5 rounded-lg text-[11px] font-bold border transition-colors focus:outline-hidden ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            <option value="published">منشور (عام)</option>
                            <option value="draft">مسودة (Draft)</option>
                            <option value="hidden">مخفي مؤقتاً</option>
                          </select>
                        </div>
                      </td>

                      {/* Curation Toggles */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Trending Flag */}
                          <button
                            type="button"
                            onClick={() => toggleBookTrending(book.id)}
                            className={`h-7 px-2 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all border ${
                              book.isTrending
                                ? 'bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}
                            title={book.isTrending ? 'إلغاء وسم الرائجة' : 'إضافة إلى الكتب الرائجة'}
                          >
                            <Flame className={`w-3 h-3 ${book.isTrending ? 'fill-current' : ''}`} />
                            <span>رائج</span>
                          </button>

                          {/* New Flag */}
                          <button
                            type="button"
                            onClick={() => toggleBookNew(book.id)}
                            className={`h-7 px-2 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all border ${
                              book.isNew
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}
                            title={book.isNew ? 'إلغاء وسم جديد' : 'تمييز كإصدار حديث'}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>جديد</span>
                          </button>

                          {/* Book of the Day Flag */}
                          <button
                            type="button"
                            onClick={() => setBookOfTheDay(book.id)}
                            className={`h-7 px-2 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all border ${
                              book.isBookOfTheDay
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300 font-black'
                                : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}
                            title={book.isBookOfTheDay ? 'كتاب اليوم الحالي' : 'تعيين كـ كتاب اليوم في الرئيسية'}
                          >
                            <Star className={`w-3 h-3 ${book.isBookOfTheDay ? 'fill-amber-500 text-amber-500' : ''}`} />
                            <span>كتاب اليوم</span>
                          </button>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditBook(book)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                            title="تعديل بيانات الكتاب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setBookToDelete(book)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            title="حذف الكتاب نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  تأكيد حذف الكتاب نهائياً
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  هذا الإجراء سيحذف الكتاب وملفاته وسجلاته من قاعدة البيانات.
                </p>
              </div>
            </div>

            {/* Target Book Info Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3">
              <img
                src={bookToDelete.coverImage}
                alt=""
                className="w-12 h-16 rounded-lg object-cover shadow-xs border border-[var(--border-subtle)]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-[var(--text-primary)] truncate">{bookToDelete.title}</p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">المؤلف: {bookToDelete.author?.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">التصنيف: {bookToDelete.category}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              تنبيه: سيتم حذف كافة الصيغ المرتبطة (PDF/EPUB) والكلمات المفتاحية وسجلات المفضلة المتعلقة بهذا الكتاب تلقائياً (Cascading Delete).
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBookToDelete(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
              >
                إلغاء التراجع
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>جارٍ الحذف...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الحذف نهائياً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
