/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { BookCard } from '../common/BookCard';
import { EmptyState } from '../common/EmptyState';
import { ArrowRight, Layers, BookOpen, Sparkles } from 'lucide-react';

export const SeriesScreen: React.FC = () => {
  const { books } = useLibrary();
  const { currentRoute, goBack, navigateTo } = useRouter();

  const seriesName = currentRoute.params?.seriesName?.trim() || '';

  // Filter and sort books belonging to this series
  const seriesBooks = useMemo(() => {
    if (!seriesName) return [];

    const matched = books.filter((b) => {
      const bookSeries = (b.seriesName || b.series)?.trim();
      return bookSeries && bookSeries.toLowerCase() === seriesName.toLowerCase();
    });

    // Logical sort: By seriesPart if available, otherwise by publish date / title
    return matched.sort((a, b) => {
      if (a.seriesPart !== undefined && b.seriesPart !== undefined) {
        return a.seriesPart - b.seriesPart;
      }
      if (a.seriesPart !== undefined) return -1;
      if (b.seriesPart !== undefined) return 1;
      return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
    });
  }, [books, seriesName]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)]/40 transition-all active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
      </div>

      {/* Series Hero Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-[var(--bg-surface)] to-emerald-500/10 border border-amber-500/20 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Layers className="w-3.5 h-3.5" />
              <span>سلسلة كتب أدبية ومعرفية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight">
              {seriesName || 'سلسلة كتب'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
              جميع الأجزاء والمؤلفات المرتبطة بهذه السلسلة، مرتبة تسلسلياً حسب أجزائها لتجربة قراءة متكاملة.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-[var(--bg-surface)]/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
              {seriesBooks.length} {seriesBooks.length === 1 ? 'كتاب' : 'كتب / أجزاء'}
            </span>
          </div>
        </div>
      </div>

      {/* Series Books Grid */}
      {seriesBooks.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>أجزاء السلسلة المتوفرة</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {seriesBooks.map((book) => (
              <div key={book.id} className="relative group">
                {book.seriesPart !== undefined && (
                  <div className="absolute top-2 start-2 z-20 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono bg-black/75 text-amber-300 backdrop-blur-md shadow-sm border border-amber-500/30">
                    الجزء {book.seriesPart}
                  </div>
                )}
                <BookCard
                  book={book}
                  variant="grid"
                  onSelect={(b) => navigateTo('details', { bookId: b.id })}
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          type="books"
          onAction={() => navigateTo('browse')}
        />
      )}
    </div>
  );
};
