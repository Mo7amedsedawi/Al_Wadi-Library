import React, { useState, useMemo } from 'react';
import { Author } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { 
  Users, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  BookOpen, 
  X, 
  AlertTriangle, 
  Check, 
  UserCheck
} from 'lucide-react';

export const AuthorsManagement: React.FC = () => {
  const { authors, allBooks, addAuthor, updateAuthor, deleteAuthor, showToast } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [born, setBorn] = useState('');
  const [nationality, setNationality] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  // Map author to books count
  const authorBooksCount = useMemo(() => {
    const counts: Record<string, number> = {};
    allBooks.forEach((b) => {
      if (b.author?.id) {
        counts[b.author.id] = (counts[b.author.id] || 0) + 1;
      }
    });
    return counts;
  }, [allBooks]);

  const filteredAuthors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return authors;
    return authors.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.nationality && a.nationality.toLowerCase().includes(q))
    );
  }, [authors, searchQuery]);

  const handleOpenCreate = () => {
    setEditingAuthor(null);
    setName('');
    setBio('');
    setAvatarUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');
    setBorn('');
    setNationality('');
    setFormError('');
    setModalMode('create');
  };

  const handleOpenEdit = (author: Author) => {
    setEditingAuthor(author);
    setName(author.name);
    setBio(author.bio || '');
    setAvatarUrl(author.avatarUrl || '');
    setBorn(author.born || '');
    setNationality(author.nationality || '');
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('اسم المؤلف مطلوب');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const newAuthor: Author = {
          id: `author-${Date.now()}`,
          name: name.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          born: born.trim() || undefined,
          nationality: nationality.trim() || undefined,
        };
        const res = await addAuthor(newAuthor);
        if (res.success) {
          setModalMode(null);
        }
      } else if (modalMode === 'edit' && editingAuthor) {
        const updated: Author = {
          ...editingAuthor,
          name: name.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          born: born.trim() || undefined,
          nationality: nationality.trim() || undefined,
        };
        const res = await updateAuthor(updated);
        if (res.success) {
          setModalMode(null);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!authorToDelete) return;
    const res = await deleteAuthor(authorToDelete.id);
    if (res.success) {
      setAuthorToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">دليل المؤلفين والكتّاب</h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            إدارة {authors.length} مؤلفاً وباحثاً موثقاً في قاعدة بيانات المكتبة.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة مؤلف جديد</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المؤلف، الجنسية، أو الكلمات المفتاحية..."
            className="w-full h-11 pr-10 pl-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
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
      </div>

      {/* Authors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAuthors.map((author) => {
          const count = authorBooksCount[author.id] || 0;
          return (
            <div
              key={author.id}
              className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shrink-0">
                    {author.avatarUrl ? (
                      <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[var(--brand-primary)] bg-[var(--brand-primary)]/10">
                        {author.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-[var(--text-primary)] truncate">{author.name}</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {author.nationality || author.born || 'مؤلف معتمد'}
                    </p>
                  </div>
                </div>

                {author.bio && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {author.bio}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>{count} كتب بالمكتبة</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(author)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    title="تعديل بيانات المؤلف"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthorToDelete(author)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="حذف المؤلف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-black text-[var(--text-primary)]">
                {modalMode === 'create' ? 'إضافة مؤلف جديد' : `تعديل بيانات: ${editingAuthor?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  اسم المؤلف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: عباس محمود العقاد"
                  className="w-full h-11 px-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                />
                {formError && <p className="text-[11px] text-rose-500 font-medium">{formError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">سنة ومكان الميلاد</label>
                  <input
                    type="text"
                    value={born}
                    onChange={(e) => setBorn(e.target.value)}
                    placeholder="مثال: 1889 م (أسوان، مصر)"
                    className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">الجنسية</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="مثال: مصري"
                    className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">رابط الصورة الشخصية (Avatar URL)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">السيرة الذاتية ونبذة عن المؤلف</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="أديب ومفكر وشاعر، عضو مجمع اللغة العربية..."
                  className="w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[42px] px-6 py-2 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all shadow-sm"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Relational Integrity */}
      {authorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  تأكيد حذف المؤلف
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  هل أنت متأكد من حذف "{authorToDelete.name}" من الدليل؟
                </p>
              </div>
            </div>

            {/* Relational check warning */}
            {(authorBooksCount[authorToDelete.id] || 0) > 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed">
                تنبيه أمني: يوجد حالياً <strong>{authorBooksCount[authorToDelete.id]} كتب</strong> مرتبطة بهذا المؤلف في المكتبة. لن تتمكن من الحذف إلا بعد تعديل أو حذف تلك الكتب لضمان سلامة الروابط العلائقية.
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                لا توجد كتب مرتبطة بهذا المؤلف حالياً، يمكن حذفه بأمان.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuthorToDelete(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="min-h-[42px] px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
