import React, { useState, useEffect } from 'react';
import { Book } from '../../types';
import { BookCard } from '../common/BookCard';
import { CategoryBadge } from '../common/CategoryBadge';
import { NotFoundScreen } from '../common/NotFoundScreen';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { 
  ArrowRight, 
  Star, 
  Heart, 
  Download, 
  CheckCircle2, 
  User, 
  Tag, 
  Calendar,
  Layers,
  BookOpen,
  FileText,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { StarRatingWidget } from '../common/StarRatingWidget';
import { BookDiscussions } from '../common/BookDiscussions';
import { trackAnalyticsEvent } from '../../services/communityService';

interface BookDetailsScreenProps {}

export const BookDetailsScreen: React.FC<BookDetailsScreenProps> = () => {
  const { 
    books, 
    favorites, 
    downloads, 
    toggleFavorite, 
    downloadBook, 
    cancelDownload,
    openDownloadedFile,
    deleteDownload,
    downloadState,
    addRecentBook,
    downloadingBookId, 
    downloadProgress,
    showToast 
  } = useLibrary();
  const { currentRoute, goBack, navigateTo } = useRouter();

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const bookId = currentRoute.params?.bookId;
  const book = books.find((b) => b.id === bookId);

  // Automatically record this view in recent history & anonymous telemetry
  useEffect(() => {
    if (book) {
      addRecentBook(book.id);
      trackAnalyticsEvent(book.id, 'view');
    }
  }, [book?.id]);

  if (!book) {
    return (
      <NotFoundScreen
        title="الكتاب غير متوفر"
        message="لم نتمكن من العثور على الكتاب المطلوب في قاعدة البيانات. قد يكون قد حُذف أو تم نقله."
        onGoHome={() => navigateTo('home')}
      />
    );
  }

  const isFavorite = favorites.includes(book.id);
  const isDownloaded = downloads.some((d) => d.bookId === book.id && d.status === 'completed');
  const isDownloading = downloadingBookId === book.id;

  // Similar Books Heuristic: shares same category OR overlapping keywords (excluding current book, 5-10 books)
  const relatedBooks = books
    .filter((b) => b.id !== book.id)
    .map((b) => {
      let score = 0;
      if (b.category === book.category) score += 4;
      if (b.keywords && book.keywords) {
        const matches = b.keywords.filter((k) => book.keywords.includes(k)).length;
        score += matches * 2;
      }
      if (b.author?.id && b.author.id === book.author?.id) score += 3;
      return { item: b, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.item);

  const handleDownload = (format: 'pdf' | 'epub' = 'pdf') => {
    trackAnalyticsEvent(book.id, 'download');
    downloadBook(book, format);
  };

  const handleAuthorClick = () => {
    if (book.author?.id) {
      navigateTo('author', { 
        authorId: book.author.id, 
        authorName: book.author.name 
      });
    }
  };

  const formattedPublishDate = (() => {
    try {
      const date = new Date(book.publishDate);
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
    } catch {
      return book.publishDate;
    }
  })();

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Top Navigation & Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)]/40 transition-all active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(book.id)}
            className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition-all ${
              isFavorite
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-500'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-500'
            }`}
            title={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Book Details Card */}
      <div className="p-5 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start">
          {/* Large Book Cover with Realistic Depth */}
          <div className="w-48 sm:w-56 md:w-64 shrink-0 aspect-[3/4.4] rounded-2xl overflow-hidden shadow-xl border border-black/10 relative group">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-y-0 start-0 w-3.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none" />
          </div>

          {/* Metadata & Actions */}
          <div className="flex-1 text-center md:text-start flex flex-col items-center md:items-start w-full">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <CategoryBadge 
                category={book.category} 
                onClick={() => navigateTo('browse', { category: book.category })}
              />
              {(book.seriesName || book.series) && (
                <button
                  type="button"
                  onClick={() => navigateTo('series', { seriesName: (book.seriesName || book.series)!.trim() })}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
                  title="استعراض جميع كتب السلسلة"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>سلسلة: {book.seriesName || book.series} {book.seriesPart ? `(الجزء ${book.seriesPart})` : ''}</span>
                </button>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-tight">
              {book.title}
            </h1>

            {/* Clickable Author Name everywhere */}
            <button
              type="button"
              onClick={handleAuthorClick}
              className="min-h-[44px] inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-[var(--brand-primary)] hover:underline mt-1"
            >
              <User className="w-4 h-4" />
              <span>بقلم: {book.author?.name}</span>
            </button>

            {/* Rating Stars & Count */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(book.rating)
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-stone-300 dark:text-stone-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-[var(--text-primary)] font-mono">{book.rating.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">({book.ratingsCount} تقييم)</span>
            </div>

            {/* Formats Badges */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-[var(--text-muted)] font-medium">الصيغ المتوفرة:</span>
              {(book.formats || ['pdf']).map((fmt) => (
                <span 
                  key={fmt}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20"
                >
                  {fmt}
                </span>
              ))}
            </div>

            {/* Spec Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full my-5 p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center">
              <div>
                <span className="block text-[11px] text-[var(--text-muted)]">عدد الصفحات</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block font-mono">{book.pages} ص</span>
              </div>
              <div>
                <span className="block text-[11px] text-[var(--text-muted)]">تاريخ النشر</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block">{formattedPublishDate}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[var(--text-muted)]">حجم الملف</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block font-mono">{book.fileSize}</span>
              </div>
              <div>
                <span className="block text-[11px] text-[var(--text-muted)]">وقت القراءة المقدر</span>
                <span className="text-xs font-bold text-[var(--text-primary)] mt-0.5 block font-mono">~ {book.readTimeHours || 10} ساعات</span>
              </div>
            </div>

            {/* Interactive User Rating Widget */}
            <div className="w-full my-2">
              <StarRatingWidget 
                bookId={book.id} 
                initialRating={book.rating} 
                initialCount={book.ratingsCount} 
              />
            </div>

            {/* Action Buttons & Download Management Engine */}
            <div className="w-full space-y-3.5 my-2">
              {isDownloading ? (
                <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--brand-primary)]/30 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--brand-primary)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] animate-ping" />
                    <span>جارٍ استخراج وتجهيز رابط التنزيل المباشر...</span>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">يرجى الانتظار</span>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  <div className="flex flex-wrap items-center gap-3 w-full justify-center md:justify-start">
                    {isDownloaded ? (
                      <>
                        {/* Single Clear Open Book Button */}
                        <button
                          type="button"
                          onClick={() => openDownloadedFile(book.id)}
                          className="min-h-[44px] flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                          title="فتح الكتاب عبر عارض الملفات بجهازك"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>فتح الكتاب</span>
                        </button>

                        {/* Remove Downloaded Book Button */}
                        <button
                          type="button"
                          onClick={() => setShowRemoveConfirm(true)}
                          className="min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-sm bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 transition-all flex items-center justify-center gap-2 active:scale-95"
                          title="إزالة النسخة المحلية من جهازك"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>إزالة الكتاب</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Primary Format Download Button (PDF) */}
                        <button
                          type="button"
                          onClick={() => handleDownload('pdf')}
                          className="min-h-[44px] flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          <span>تحميل الكتاب {book.formats?.includes('epub') ? '(PDF)' : ''}</span>
                        </button>

                        {/* Secondary Format Download Button (EPUB if available) */}
                        {(book.formats?.includes('epub') || book.epubUrl) && (
                          <button
                            type="button"
                            onClick={() => handleDownload('epub')}
                            className="min-h-[44px] flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-all border border-[var(--border-subtle)] flex items-center justify-center gap-2 active:scale-95"
                          >
                            <FileText className="w-4 h-4" />
                            <span>تحميل الكتاب (EPUB)</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Removal Confirmation Dialog */}
                  {showRemoveConfirm && (
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-right space-y-3 animate-in fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>هل أنت متأكد من رغبتك في إزالة النسخة المحملة من هذا الكتاب من جهازك؟</span>
                      </div>
                      <p className="text-[11px] text-red-600/80 dark:text-red-300/80 leading-relaxed">
                        (سيتم حذف النسخة المحلية المحفوظة على جهازك فقط لتوفير المساحة، ولن يتم حذف الكتاب من المكتبة العامة).
                      </p>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteDownload(book.id);
                            setShowRemoveConfirm(false);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                        >
                          نعم، إزالة النسخة
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRemoveConfirm(false)}
                          className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Informative Guidance Banner */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] text-[var(--text-muted)] border border-black/5">
                <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--brand-primary)]" />
                <span>
                  تنزيل مباشر لجهازك · يتم استخراج وتوجيه الرابط الأصلي مباشرة من السيرفر لحفظ الملف كـ PDF أو EPUB كامل في مجلد التنزيلات بجهازك.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis / Book Description (At least 3 paragraphs rendered) */}
        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] space-y-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            نبذة ووصف الكتاب
          </h2>
          <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-3 font-cairo">
            {book.description.split('\n\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Keywords / Tags list */}
          {book.keywords && book.keywords.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] mb-2">
                <Tag className="w-3.5 h-3.5" />
                <span>الكلمات المفتاحية والمواضيع:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {book.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Books in Category */}
      {relatedBooks.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              كتب مشابهة في قسم {book.category}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              عناوين أخرى قد تنال إعجابك وتثري مكتبتك
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedBooks.map((relBook) => (
              <BookCard
                key={relBook.id}
                book={relBook}
                variant="grid"
                onSelect={(b) => navigateTo('details', { bookId: b.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reader Discussions & Community Forum */}
      <BookDiscussions bookId={book.id} bookTitle={book.title} />
    </div>
  );
};
