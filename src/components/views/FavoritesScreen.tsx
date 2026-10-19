import React from 'react';
import { Book } from '../../types';
import { BookCard } from '../common/BookCard';
import { EmptyState } from '../common/EmptyState';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, LogIn } from 'lucide-react';

export const FavoritesScreen: React.FC = () => {
  const { books, favorites, toggleFavorite } = useLibrary();
  const { navigateTo } = useRouter();
  const { isGuest } = useAuth();

  const favoriteBooks = books.filter((b) => favorites.includes(b.id));

  const handleSelectBook = (book: Book) => {
    navigateTo('details', { bookId: book.id });
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            قائمتي المفضلة
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            مجموعتك المختارة من أثمن الكتب للرجوع إليها في أي وقت ({favoriteBooks.length} كتب)
          </p>
        </div>

        {isGuest && (
          <button
            onClick={() => navigateTo('login')}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-100 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>سجّل دخولك لمزامنة المفضلة سحابياً</span>
          </button>
        )}
      </div>

      {favoriteBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {favoriteBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              variant="grid"
              onSelect={handleSelectBook}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          type="favorites"
          onAction={() => navigateTo('browse')}
        />
      )}
    </div>
  );
};
