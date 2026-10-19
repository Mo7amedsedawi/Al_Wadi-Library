import React from 'react';
import { Book } from '../../types';
import { CategoryBadge } from './CategoryBadge';
import { useRouter } from '../../context/RouterContext';
import { Star, Heart, Bookmark, BookOpen, Download } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (bookId: string, e: React.MouseEvent) => void;
  variant?: 'grid' | 'carousel' | 'compact';
  readingProgress?: number; // 10 - 90 % for "Continue Reading" section
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
  variant = 'grid',
  readingProgress,
  className = '',
}) => {
  const { navigateTo } = useRouter();
  const isCarousel = variant === 'carousel';
  const isCompact = variant === 'compact';

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.author?.id) {
      navigateTo('author', { 
        authorId: book.author.id, 
        authorName: book.author.name 
      });
    }
  };

  const handleCategoryClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigateTo('browse', { category: book.category });
  };

  // Compact variant for search suggestions / downloads list
  if (isCompact) {
    return (
      <div
        onClick={() => onSelect(book)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect(book);
        }}
        className={`group flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer active:scale-[0.99] select-none ${className}`}
      >
        <div className="relative w-14 h-20 shrink-0 rounded-xl overflow-hidden shadow-sm bg-[var(--bg-muted)] border border-black/5">
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CategoryBadge 
              category={book.category} 
              onClick={handleCategoryClick}
            />
            <span aria-hidden="true" className="text-[11px] text-[var(--text-muted)]">·</span>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              {new Date(book.publishDate).getFullYear() || book.publishDate}
            </span>
          </div>
          <h4 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--brand-primary)] transition-colors">
            {book.title}
          </h4>
          <button
            type="button"
            onClick={handleAuthorClick}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:underline truncate mt-0.5 block text-start font-medium"
          >
            {book.author?.name}
          </button>
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)] mt-1.5 font-medium">
            <span className="flex items-center gap-1 text-amber-500 font-bold text-[11px] font-mono">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              {book.rating.toFixed(1)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{book.pages} صفحة</span>
          </div>
        </div>

        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => onToggleFavorite(book.id, e)}
            className="min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'fill-red-500 text-red-500' : ''
              }`}
            />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(book);
      }}
      className={`group flex flex-col cursor-pointer transition-all active:scale-[0.98] select-none ${
        isCarousel ? 'w-40 sm:w-48 shrink-0' : 'w-full'
      } ${className}`}
    >
      {/* Book Cover Container with realistic spine & shadow */}
      <div className="relative aspect-[3/4.4] w-full rounded-2xl overflow-hidden bg-[var(--bg-muted)] border border-[var(--border-subtle)] group-hover:border-[var(--brand-primary)]/50 transition-all duration-300 shadow-sm group-hover:shadow-md">
        <img
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Realistic book spine gradient shadow on right side (since RTL book binding) */}
        <div 
          className="absolute inset-y-0 start-0 w-3.5 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" 
        />

        {/* Favorite Icon Button - Minimum 44x44px touch target */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => onToggleFavorite(book.id, e)}
            className={`absolute top-1.5 end-1.5 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90 ${
              isFavorite
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-white' : ''
              }`}
            />
          </button>
        )}

        {/* Formats Badges Indicator */}
        <div className="absolute bottom-2.5 start-2.5 flex items-center gap-1">
          {(book.formats || ['pdf']).map((fmt) => (
            <span 
              key={fmt}
              className="px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-sm text-[9px] font-mono uppercase text-white/95"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Reading Progress bar if in "Continue Reading" section */}
      {readingProgress !== undefined && (
        <div className="mt-2 space-y-1">
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div 
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
            <span>تم إنجاز {readingProgress}%</span>
            <span>متابعة</span>
          </div>
        </div>
      )}

      {/* Book Metadata & Title */}
      <div className="mt-2.5 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-medium mb-1">
          <CategoryBadge 
            category={book.category} 
            onClick={handleCategoryClick}
          />
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-0.5 text-amber-500 font-bold font-mono">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {book.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors line-clamp-1 leading-snug">
          {book.title}
        </h3>
        
        {/* Clickable Author Name everywhere in the app */}
        <button
          type="button"
          onClick={handleAuthorClick}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:underline line-clamp-1 mt-0.5 font-medium text-start"
        >
          {book.author?.name}
        </button>

        {!isCarousel && (
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span className="font-mono">{book.pages} صفحة</span>
            <span className="font-mono">
              {new Date(book.publishDate).getFullYear() || book.publishDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
