import React, { useState, useMemo, useEffect } from 'react';
import { Book, BookCategory } from '../../types';
import { BookCard } from '../common/BookCard';
import { CategoryBadge } from '../common/CategoryBadge';
import { EmptyState } from '../common/EmptyState';
import { SkeletonGrid } from '../common/SkeletonCard';
import { matchBookSearch } from '../../utils/search';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { Search, ArrowUpDown, X, Filter, User, BookOpen } from 'lucide-react';

type SortOption = 'newest' | 'title_asc' | 'title_desc' | 'rating' | 'pages';

export const BrowseScreen: React.FC = () => {
  const { books, favorites, toggleFavorite, isLoading, refreshLoading } = useLibrary();
  const { currentRoute, navigateTo } = useRouter();

  // Search input and debounced search query
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentRoute.params?.category || 'all'
  );
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'epub'>('all');
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Synchronize category if changed from external navigation (e.g. clicking badge in home)
  useEffect(() => {
    if (currentRoute.params?.category) {
      setSelectedCategory(currentRoute.params.category);
    }
  }, [currentRoute.params?.category]);

  // Extract unique authors from books
  const authorsList = useMemo(() => {
    const map = new Map<string, string>();
    books.forEach((b) => {
      if (b.author?.id && b.author?.name) {
        map.set(b.author.id, b.author.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [books]);

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'فانتازيا', label: 'فانتازيا' },
    { id: 'غموض', label: 'غموض' },
    { id: 'جاسوسية', label: 'جاسوسية' },
    { id: 'رومانسي', label: 'رومانسي' },
    { id: 'كتب غير روائية', label: 'كتب غير روائية' },
  ];

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    refreshLoading(250);
  };

  const handleSelectBook = (book: Book) => {
    navigateTo('details', { bookId: book.id });
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedCategory('all');
    setFormatFilter('all');
    setSelectedAuthorId('all');
    setSortBy('newest');
  };

  // Advanced Multi-criteria Filter & Sort Engine
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // 1. Category Filter
        const matchCategory =
          selectedCategory === 'all' ||
          book.category === selectedCategory ||
          (selectedCategory === 'فانتازيا' && (book.category === 'فانتازي' || book.category === 'روايات')) ||
          (selectedCategory === 'كتب غير روائية' && ['تاريخ', 'فلسفة', 'علوم', 'تكنولوجيا'].includes(book.category));

        // 2. Format Filter
        const bookFormats = book.formats || [(book.format?.toLowerCase() || 'pdf') as 'pdf' | 'epub'];
        const matchFormat =
          formatFilter === 'all' || bookFormats.includes(formatFilter);

        // 3. Author Filter
        const matchAuthor =
          selectedAuthorId === 'all' || book.author?.id === selectedAuthorId;

        // 4. Substring & Keyword Search with Arabic normalization
        const matchSearch = matchBookSearch(book, debouncedQuery);

        return matchCategory && matchFormat && matchAuthor && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        }
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title, 'ar');
        }
        if (sortBy === 'title_desc') {
          return b.title.localeCompare(a.title, 'ar');
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'pages') {
          return b.pages - a.pages;
        }
        return 0;
      });
  }, [books, selectedCategory, formatFilter, selectedAuthorId, debouncedQuery, sortBy]);

  const activeFiltersCount = 
    (selectedCategory !== 'all' ? 1 : 0) +
    (formatFilter !== 'all' ? 1 : 0) +
    (selectedAuthorId !== 'all' ? 1 : 0) +
    (debouncedQuery ? 1 : 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Search & Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            تصفح مكتبة الوادي
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            محرك بحث واستكشاف ذكي لأكثر من {books.length} من أندر الكتب والمصادر العربية
          </p>
        </div>

        {/* Global Search Input with 300ms Debounce Indicator */}
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ابحث بالعنوان، اسم الكاتب، أو الكلمات المفتاحية (مثل: نوبل، فلك، أندلس)..."
            className="w-full h-12 pe-12 ps-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all outline-none"
          />
          <div className="absolute inset-y-0 end-0 pe-4 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Search className="w-5 h-5" />
          </div>
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setDebouncedQuery('');
              }}
              className="absolute inset-y-0 start-0 ps-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] min-h-[44px]"
              aria-label="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <CategoryBadge
              key={cat.id}
              category={cat.label}
              variant="interactive"
              isSelected={selectedCategory === cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              count={
                cat.id === 'all'
                  ? books.length
                  : books.filter((b) => b.category === cat.id).length
              }
            />
          ))}
        </div>

        {/* Advanced Filters & Sorting Bar */}
        <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Filter by Format */}
            <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl">
              <span className="text-[11px] font-bold text-[var(--text-muted)] px-2">الصيغة:</span>
              <button
                type="button"
                onClick={() => setFormatFilter('all')}
                className={`min-h-[32px] px-2.5 rounded-lg font-bold transition-all ${
                  formatFilter === 'all'
                    ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('pdf')}
                className={`min-h-[32px] px-2.5 rounded-lg font-bold transition-all uppercase ${
                  formatFilter === 'pdf'
                    ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('epub')}
                className={`min-h-[32px] px-2.5 rounded-lg font-bold transition-all uppercase ${
                  formatFilter === 'epub'
                    ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                EPUB
              </button>
            </div>

            {/* Filter by Author Dropdown */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] px-2.5 py-1 rounded-xl">
              <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={selectedAuthorId}
                onChange={(e) => setSelectedAuthorId(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] text-xs font-semibold outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all">جميع الكتّاب ({authorsList.length})</option>
                {authorsList.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] px-2.5 py-1 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-[var(--text-primary)] text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="newest">الأحدث (تاريخ النشر)</option>
                <option value="title_asc">الأبجدي: أ - ي</option>
                <option value="title_desc">الأبجدي: ي - أ</option>
                <option value="rating">الأعلى تقييماً</option>
                <option value="pages">الأكثر صفحات</option>
              </select>
            </div>

            {/* Results Count & Reset button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {filteredBooks.length} كتاب
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="min-h-[32px] px-2 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  إلغاء الفلاتر
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeletons vs Books Grid vs Empty State */}
      {isLoading ? (
        <SkeletonGrid count={10} />
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              variant="grid"
              onSelect={handleSelectBook}
              isFavorite={favorites.includes(book.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          type="search"
          onAction={resetAllFilters}
        />
      )}
    </div>
  );
};
