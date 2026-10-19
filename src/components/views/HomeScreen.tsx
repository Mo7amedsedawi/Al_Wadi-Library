import React, { useState, useEffect, useMemo } from 'react';
import { Book, BookCategory } from '../../types';
import { BookCard } from '../common/BookCard';
import { CategoryBadge, getCategoryIcon } from '../common/CategoryBadge';
import { SkeletonCard } from '../common/SkeletonCard';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { 
  BookOpen, 
  Sparkles, 
  Flame, 
  Clock, 
  Star, 
  ChevronLeft,
  RotateCcw,
  Download,
  BookMarked,
  ThumbsUp
} from 'lucide-react';
import { fetchReadingLists } from '../../services/communityService';
import { ReadingList } from '../../types';

interface HomeScreenProps {}

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const { books, favorites, toggleFavorite, recentBooks, isLoading } = useLibrary();
  const { navigateTo } = useRouter();
  const [readingLists, setReadingLists] = useState<ReadingList[]>([]);

  useEffect(() => {
    fetchReadingLists().then(setReadingLists);
  }, []);

  const bookOfTheDay = books.find((b) => b.isBookOfTheDay) || books[0] || null;
  const trendingBooks = books.filter((b) => b.isTrending);
  const newBooks = books.filter((b) => b.isNew);

  const categories = [
    { id: 'فانتازيا' as BookCategory, name: 'فانتازيا', count: books.filter(b => b.category === 'فانتازيا' || b.category === 'فانتازي').length },
    { id: 'غموض' as BookCategory, name: 'غموض', count: books.filter(b => b.category === 'غموض').length },
    { id: 'جاسوسية' as BookCategory, name: 'جاسوسية', count: books.filter(b => b.category === 'جاسوسية').length },
    { id: 'رومانسي' as BookCategory, name: 'رومانسي', count: books.filter(b => b.category === 'رومانسي').length },
    { id: 'كتب غير روائية' as BookCategory, name: 'كتب غير روائية', count: books.filter(b => b.category === 'كتب غير روائية').length },
  ];

  // Module 2: "You Might Also Like" Heuristic
  const recommendedBooks = useMemo(() => {
    const recentCategories = new Set<string>();
    recentBooks.forEach((item) => {
      const b = books.find((x) => x.id === item.bookId);
      if (b) recentCategories.add(b.category);
    });
    favorites.forEach((favId) => {
      const b = books.find((x) => x.id === favId);
      if (b) recentCategories.add(b.category);
    });

    const recentBookIds = new Set([
      ...recentBooks.map((r) => r.bookId),
      bookOfTheDay?.id || '',
    ]);

    let list = books.filter(
      (b) => recentCategories.has(b.category) && !recentBookIds.has(b.id)
    );

    if (list.length < 3) {
      list = books
        .filter((b) => !recentBookIds.has(b.id))
        .sort((a, b) => b.rating - a.rating);
    }

    return list.slice(0, 6);
  }, [books, recentBooks, favorites, bookOfTheDay]);

  const handleSelectBook = (book: Book) => {
    navigateTo('details', { bookId: book.id });
  };

  const handleNavigateToCategory = (cat: string) => {
    navigateTo('browse', { category: cat });
  };

  const handleAuthorClick = (authorId?: string, authorName?: string) => {
    if (authorId) {
      navigateTo('author', { authorId, authorName });
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* 1. Hero Section: "كتاب اليوم" (Book of the Day) */}
      {bookOfTheDay && (
        <section className="relative overflow-hidden rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
          <div 
            className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          <div className="relative p-5 sm:p-8 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Cover image with 3D book shadow */}
            <div 
              onClick={() => handleSelectBook(bookOfTheDay)}
              className="w-36 sm:w-48 md:w-56 shrink-0 aspect-[3/4.4] rounded-2xl overflow-hidden shadow-lg border border-black/10 cursor-pointer group relative active:scale-95 transition-transform"
            >
              <img
                src={bookOfTheDay.coverImage}
                alt={bookOfTheDay.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-y-0 start-0 w-3 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none" />
            </div>

            {/* Book Details & Actions */}
            <div className="flex-1 text-center md:text-start flex flex-col items-center md:items-start">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                <Sparkles className="w-4 h-4 shrink-0 fill-current" />
                <span>كتاب اليوم المختار</span>
                <span aria-hidden="true">·</span>
                <CategoryBadge 
                  category={bookOfTheDay.category} 
                  onClick={() => handleNavigateToCategory(bookOfTheDay.category)}
                />
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-primary)] leading-tight">
                {bookOfTheDay.title}
              </h1>

              {/* Author link */}
              <button
                type="button"
                onClick={() => handleAuthorClick(bookOfTheDay.author?.id, bookOfTheDay.author?.name)}
                className="text-sm font-semibold text-[var(--brand-primary)] hover:underline mt-1"
              >
                المؤلف: {bookOfTheDay.author?.name}
              </button>

              {/* Zero-pill unboxed metadata */}
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)] mt-2 font-medium">
                <span className="flex items-center gap-1 text-amber-500 font-bold font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {bookOfTheDay.rating.toFixed(1)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{bookOfTheDay.pages} صفحة</span>
                <span aria-hidden="true">·</span>
                <span>
                  {new Date(bookOfTheDay.publishDate).getFullYear() || bookOfTheDay.publishDate}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-3 mt-3 leading-relaxed max-w-xl">
                {bookOfTheDay.description}
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-wrap items-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => handleSelectBook(bookOfTheDay)}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-sm bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل وقراءة الكتاب</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectBook(bookOfTheDay)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-all border border-[var(--border-subtle)] flex items-center gap-1.5 active:scale-95"
                >
                  <span>تفاصيل الكتاب</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid (أقسام المكتبة) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
              أقسام المكتبة
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              استكشف آلاف العناوين المصنفة بعناية
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleNavigateToCategory('all')}
            className="min-h-[44px] px-2 text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleNavigateToCategory(cat.id)}
                className="min-h-[56px] p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-all text-start flex items-center gap-3 group active:scale-[0.98] shadow-sm hover:shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors truncate">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)] block mt-0.5 font-mono">
                    {cat.count} كتب
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Horizontal Carousel: Trending Books (الكتب الرائجة) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                الكتب الرائجة
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                الأكثر قراءة وتداولاً بين رواد مكتبة الوادي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavigateToCategory('all')}
            className="min-h-[44px] px-2 text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            <span>المزيد</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} variant="carousel" />
              ))
            : trendingBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="carousel"
                  onSelect={handleSelectBook}
                  isFavorite={favorites.includes(book.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
        </div>
      </section>

      {/* 5. Horizontal Carousel: New Arrivals (أحدث الإضافات) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                أحدث الإضافات
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                عناوين جديدة أضيفت مؤخراً إلى رفوفنا الرقمية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleNavigateToCategory('all')}
            className="min-h-[44px] px-2 text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
          >
            <span>المزيد</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} variant="carousel" />
              ))
            : newBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  variant="carousel"
                  onSelect={handleSelectBook}
                  isFavorite={favorites.includes(book.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
        </div>
      </section>

      {/* 6. Section: "قد يعجبك" (You Might Also Like) */}
      {recommendedBooks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                  قد يعجبك
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  ترشيحات ذكية منتقاة بناءً على سجل قراءاتك وتصنيفاتك المفضلة
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {recommendedBooks.map((book) => (
              <BookCard
                key={`rec-${book.id}`}
                book={book}
                variant="carousel"
                onSelect={handleSelectBook}
                isFavorite={favorites.includes(book.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. Section: Curated Reading Lists (قوائم القراءة المختارة) */}
      {readingLists.map((list: ReadingList) => {
        const listBooks = books.filter((b) => list.book_ids.includes(b.id));
        if (listBooks.length === 0) return null;

        return (
          <section key={list.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {list.title}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                    {list.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {listBooks.map((book) => (
                <BookCard
                  key={`curated-${list.id}-${book.id}`}
                  book={book}
                  variant="carousel"
                  onSelect={handleSelectBook}
                  isFavorite={favorites.includes(book.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </section>
        );
      })}

      {/* 8. Inspirational Literary Quote */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-[var(--brand-surface)] to-[var(--bg-secondary)] border border-[var(--border-subtle)] text-center relative overflow-hidden">
        <p className="text-base sm:text-lg font-tajawal font-bold text-[var(--text-primary)] leading-relaxed">
          «خير جليس في الزمان كتاب، وتسلو به إن خانك الأصحاب»
        </p>
        <span className="text-xs text-[var(--text-muted)] block mt-1">
          — أبو الطيب المتنبي
        </span>
      </section>
    </div>
  );
};
