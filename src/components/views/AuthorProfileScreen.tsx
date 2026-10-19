import React from 'react';
import { Book, Author } from '../../types';
import { BookCard } from '../common/BookCard';
import { EmptyState } from '../common/EmptyState';
import { MOCK_AUTHORS } from '../../data/mockBooks';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { 
  ArrowRight, 
  BookOpen, 
  User, 
  MapPin, 
  Calendar, 
  Award,
  Sparkles 
} from 'lucide-react';

interface AuthorProfileScreenProps {}

export const AuthorProfileScreen: React.FC<AuthorProfileScreenProps> = () => {
  const { books, favorites, toggleFavorite } = useLibrary();
  const { currentRoute, goBack, navigateTo } = useRouter();

  const authorId = currentRoute.params?.authorId;

  // Find author from MOCK_AUTHORS dictionary or from any book's author object
  const authorFromDict = authorId ? MOCK_AUTHORS[authorId] : null;
  const bookWithAuthor = books.find((b) => b.author?.id === authorId);
  const author: Author = authorFromDict || bookWithAuthor?.author || {
    id: authorId || 'unknown',
    name: currentRoute.params?.authorName || 'المؤلف',
    bio: 'أحد كبار الكتّاب والباحثين الذين أثروا المكتبة العربية بالعديد من المؤلفات القيمة في الفكر والأدب والعلوم.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  };

  // Dynamically filter all books by this author
  const authorBooks = books.filter(
    (b) => b.author?.id === author.id || b.author?.name === author.name
  );

  const totalPages = authorBooks.reduce((sum, b) => sum + b.pages, 0);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={goBack}
          className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)]/40 transition-all active:scale-95"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع</span>
        </button>
      </div>

      {/* Author Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm relative overflow-hidden">
        <div 
          className="absolute -top-20 -start-20 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-start relative">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-[var(--bg-secondary)] border-2 border-[var(--brand-primary)]/30 shadow-md">
              {author.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--brand-primary)]">
                  <User className="w-10 h-10" />
                </div>
              )}
            </div>
            <span className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold flex items-center justify-center shadow-sm">
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] bg-[var(--brand-surface)] px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>كاتب ومؤلف معتمد</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              {author.name}
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              {author.bio}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[var(--text-muted)] pt-2 font-medium">
              {author.born && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{author.born}</span>
                </div>
              )}
              {author.nationality && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{author.nationality}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[var(--brand-primary)] font-bold font-mono">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{authorBooks.length} مؤلفات في المكتبة</span>
              </div>
              <div className="font-mono">
                {totalPages.toLocaleString()} صفحة موثقة
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Author Books Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              جميع مؤلفات {author.name}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              تصفح وقراءة الكتب المتوفرة في المكتبة الرقمية
            </p>
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)] font-mono">
            {authorBooks.length} كتب
          </span>
        </div>

        {authorBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {authorBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="grid"
                onSelect={(b) => navigateTo('details', { bookId: b.id })}
                isFavorite={favorites.includes(book.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا توجد كتب مضافة لهذا الكاتب حالياً"
            description="سيتم إدراج مؤلفات جديدة قريباً ضمن التحديثات القادمة لمكتبة الوادي."
            actionText="العودة للتصفح"
            onAction={() => navigateTo('browse')}
          />
        )}
      </div>
    </div>
  );
};
