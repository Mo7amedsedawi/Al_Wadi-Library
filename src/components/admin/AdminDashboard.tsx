import React, { useState, useEffect } from 'react';
import { Book } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar, AdminTab } from './AdminSidebar';
import { BooksManagement } from './BooksManagement';
import { BookFormView } from './BookFormView';
import { AuthorsManagement } from './AuthorsManagement';
import { CategoriesManagement } from './CategoriesManagement';
import { DatabaseSettings } from './DatabaseSettings';
import { ReadingListsManagement } from './ReadingListsManagement';
import { ModerationManagement } from './ModerationManagement';
import { BookRequestsManagement } from './BookRequestsManagement';
import { getAnalyticsSummary } from '../../services/communityService';
import { AnalyticsSummary } from '../../types';
import { 
  Menu, 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  Users, 
  Tags, 
  Database, 
  ArrowLeft,
  Flame,
  Sparkles,
  Star,
  FileText,
  Eye,
  CheckCircle2,
  HardDrive,
  BookMarked,
  ShieldAlert,
  ArrowDownToLine,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { allBooks, authors, categoriesList, downloads } = useLibrary();
  const { navigateTo } = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Phase 8: Telemetry & Analytics
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      setIsLoadingAnalytics(true);
      getAnalyticsSummary(allBooks)
        .then((data) => setAnalytics(data))
        .finally(() => setIsLoadingAnalytics(false));
    }
  }, [activeTab, allBooks]);

  // Quick stats
  const totalBooks = allBooks.length;
  const publishedBooks = allBooks.filter((b) => b.status === undefined || b.status === 'published').length;
  const draftBooks = allBooks.filter((b) => b.status === 'draft').length;
  const trendingCount = allBooks.filter((b) => b.isTrending).length;
  const bookOfTheDayObj = allBooks.find((b) => b.isBookOfTheDay);

  const handleAddNewBook = () => {
    setEditingBook(null);
    setActiveTab('book_form');
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setActiveTab('book_form');
  };

  const handleExitAdmin = () => {
    navigateTo('home');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex" dir="rtl">
      {/* 1. RTL Sidebar (Desktop Fixed / Mobile Off-canvas) */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'book_form') setEditingBook(null);
          setActiveTab(tab);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onExitAdmin={handleExitAdmin}
      />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 lg:mr-72 min-w-0 flex flex-col">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              title="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                  {activeTab === 'overview' && 'لوحة المعلومات والتحليلات'}
                  {activeTab === 'books' && 'إدارة الكتب والمحتوى'}
                  {activeTab === 'book_form' && (editingBook ? 'تعديل بيانات الكتاب' : 'إضافة كتاب جديد')}
                  {activeTab === 'reading_lists' && 'قوائم القراءة المختارة'}
                  {activeTab === 'moderation' && 'إدارة البلاغات والإشراف'}
                  {activeTab === 'authors' && 'دليل المؤلفين والكتّاب'}
                  {activeTab === 'categories' && 'تصنيفات وأقسام المكتبة'}
                  {activeTab === 'database' && 'إعدادات قاعدة البيانات والتخزين'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick button to add book */}
            {activeTab !== 'book_form' && (
              <button
                type="button"
                onClick={handleAddNewBook}
                className="hidden sm:flex min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>إضافة كتاب</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExitAdmin}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all flex items-center gap-1.5"
            >
              <span>المكتبة العامة</span>
              <ArrowLeft className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                    مرحباً بك، {user?.name || 'مدير النظام'} 👋
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
                    أهلاً بك في نظام إدارة المحتوى (CMS) الخاص بمكتبة الوادي. يمكنك إضافة الكتب وتعديلها وإدارة المؤلفين والتصنيفات والتخزين السحابي.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewBook}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-2 shadow-sm shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>إضافة كتاب جديد</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Books */}
                <div 
                  onClick={() => setActiveTab('books')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">إجمالي الكتب</span>
                    <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[var(--text-primary)]">{totalBooks}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {publishedBooks} منشور · {draftBooks} مسودة
                  </div>
                </div>

                {/* Authors */}
                <div 
                  onClick={() => setActiveTab('authors')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">المؤلفون والكتّاب</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[var(--text-primary)]">{authors.length}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    مؤلفون موثقون في قاعدة البيانات
                  </div>
                </div>

                {/* Categories */}
                <div 
                  onClick={() => setActiveTab('categories')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">الأقسام والتصنيفات</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Tags className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[var(--text-primary)]">{categoriesList.length}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    أقسام وفهارس رئيسية
                  </div>
                </div>

                {/* Curation Highlights */}
                <div 
                  onClick={() => setActiveTab('books')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-muted)]">الكتب الرائجة</span>
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[var(--text-primary)]">{trendingCount}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">
                    كتاب اليوم: {bookOfTheDayObj?.title || 'غير محدد'}
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setActiveTab('book_form')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">رفع كتاب جديد</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    إضافة عنوان ووصف وغلاف وملفات PDF/EPUB إلى التخزين السحابي مع فحص تلقائي.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('authors')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">إدارة المؤلفين</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    إضافة سير المؤلفين، الصور الشخصية، وتوثيق بطاقات الكتّاب في الدليل.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('database')}
                  className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">فحص قاعدة البيانات</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    مراقبة جداول وحاويات Supabase وتشغيل أوامر SQL وترقية المديرين.
                  </p>
                </div>
              </div>

              {/* Recent Books Mini List */}
              <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[var(--text-primary)]">أحدث الكتب في المكتبة</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('books')}
                    className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                  >
                    عرض كافة الكتب ({allBooks.length}) ←
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allBooks.slice(0, 6).map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleEditBook(book)}
                      className="p-3 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] transition-all flex items-center gap-3 cursor-pointer border border-[var(--border-subtle)]"
                    >
                      <img
                        src={book.coverImage}
                        alt=""
                        className="w-10 h-14 rounded-lg object-cover shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[var(--text-primary)] truncate">{book.title}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">{book.author?.name}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                          <span>{book.category}</span>
                          <span>·</span>
                          <span className={book.status === 'draft' ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                            {book.status === 'draft' ? 'مسودة' : 'منشور'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phase 8: Telemetry & Usage Analytics Cards */}
              <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[var(--text-primary)]">
                        تحليلات التفاعل والاستخدام (مجهولة الهوية)
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        إحصائيات فورية للمشاهدات والتنزيلات المحفوظة في قاعدة بيانات Supabase
                      </p>
                    </div>
                  </div>
                  {isLoadingAnalytics && (
                    <span className="text-xs text-[var(--text-muted)] animate-pulse">جارٍ التحديث...</span>
                  )}
                </div>

                {/* Telemetry Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">إجمالي المشاهدات</span>
                      <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                        {analytics?.totalViews ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowDownToLine className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--text-muted)] block">إجمالي التنزيلات</span>
                      <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
                        {analytics?.totalDownloads ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Most Viewed & Most Downloaded Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Most Viewed Books */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)]">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span>الكتب الأكثر مشاهدة</span>
                    </div>
                    <div className="space-y-2">
                      {analytics?.mostViewedBooks && analytics.mostViewedBooks.length > 0 ? (
                        analytics.mostViewedBooks.map((item, index) => (
                          <div 
                            key={`view-${item.bookId}`}
                            className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                {index + 1}
                              </span>
                              <span className="font-bold text-[var(--text-primary)] truncate">{item.title}</span>
                            </div>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold shrink-0 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40">
                              {item.count} مشاهدة
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] py-3 text-center">لا توجد بيانات مشاهدات حتى الآن</p>
                      )}
                    </div>
                  </div>

                  {/* Most Downloaded Books */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)]">
                      <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
                      <span>الكتب الأكثر تحميلاً</span>
                    </div>
                    <div className="space-y-2">
                      {analytics?.mostDownloadedBooks && analytics.mostDownloadedBooks.length > 0 ? (
                        analytics.mostDownloadedBooks.map((item, index) => (
                          <div 
                            key={`dl-${item.bookId}`}
                            className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                {index + 1}
                              </span>
                              <span className="font-bold text-[var(--text-primary)] truncate">{item.title}</span>
                            </div>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                              {item.count} تنزيل
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] py-3 text-center">لا توجد بيانات تنزيل حتى الآن</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKS MANAGEMENT */}
          {activeTab === 'books' && (
            <BooksManagement
              onAddNewBook={handleAddNewBook}
              onEditBook={handleEditBook}
            />
          )}

          {/* TAB 3: ADD / EDIT BOOK COMPLEX FORM */}
          {activeTab === 'book_form' && (
            <BookFormView
              editingBook={editingBook}
              onCancel={() => {
                setEditingBook(null);
                setActiveTab('books');
              }}
              onSuccess={() => {
                setEditingBook(null);
                setActiveTab('books');
              }}
            />
          )}

          {/* TAB: BOOK REQUESTS MANAGEMENT */}
          {activeTab === 'book_requests' && <BookRequestsManagement />}

          {/* TAB 4: READING LISTS MANAGEMENT */}
          {activeTab === 'reading_lists' && <ReadingListsManagement />}

          {/* TAB 5: COMMENT MODERATION & REPORTS */}
          {activeTab === 'moderation' && <ModerationManagement />}

          {/* TAB 6: AUTHORS MANAGEMENT */}
          {activeTab === 'authors' && <AuthorsManagement />}

          {/* TAB 7: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && <CategoriesManagement />}

          {/* TAB 8: DATABASE & SETTINGS */}
          {activeTab === 'database' && <DatabaseSettings />}
        </main>
      </div>
    </div>
  );
};
