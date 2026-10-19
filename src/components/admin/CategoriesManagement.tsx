import React, { useState, useMemo } from 'react';
import { CategoryItem } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { 
  Tags, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  BookOpen, 
  X, 
  AlertTriangle, 
  Check,
  Feather,
  Landmark,
  Compass,
  Atom,
  Cpu,
  Bookmark,
  Sparkles,
  Flame,
  Globe
} from 'lucide-react';

const ICON_OPTIONS = [
  { id: 'BookOpen', label: 'كتاب مفتوح', icon: BookOpen },
  { id: 'Feather', label: 'ريشة أدب', icon: Feather },
  { id: 'Landmark', label: 'تاريخ وحضارة', icon: Landmark },
  { id: 'Compass', label: 'بوصلة وفلسفة', icon: Compass },
  { id: 'Atom', label: 'ذرة وعلوم', icon: Atom },
  { id: 'Cpu', label: 'تقنية وذكاء', icon: Cpu },
  { id: 'Globe', label: 'عالم وفضاء', icon: Globe },
  { id: 'Flame', label: 'لهب وشغف', icon: Flame },
];

export const CategoriesManagement: React.FC = () => {
  const { categoriesList, allBooks, addCategory, updateCategory, deleteCategory } = useLibrary();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [catToDelete, setCatToDelete] = useState<CategoryItem | null>(null);

  // Category books count
  const categoryBooksCount = useMemo(() => {
    const counts: Record<string, number> = {};
    allBooks.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, [allBooks]);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setName('');
    setIcon('BookOpen');
    setDescription('');
    setFormError('');
    setModalMode('create');
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCat(cat);
    setName(cat.name);
    setIcon(cat.icon || 'BookOpen');
    setDescription(cat.description || '');
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('اسم القسم / التصنيف مطلوب');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const newCat: CategoryItem = {
          id: name.trim(),
          name: name.trim(),
          icon,
          description: description.trim(),
        };
        const res = await addCategory(newCat);
        if (res.success) {
          setModalMode(null);
        }
      } else if (modalMode === 'edit' && editingCat) {
        const updated: CategoryItem = {
          ...editingCat,
          name: name.trim(),
          icon,
          description: description.trim(),
        };
        const res = await updateCategory(updated);
        if (res.success) {
          setModalMode(null);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!catToDelete) return;
    const res = await deleteCategory(catToDelete.id, catToDelete.name);
    if (res.success) {
      setCatToDelete(null);
    }
  };

  // Helper to render icon component
  const renderIcon = (iconName?: string) => {
    const match = ICON_OPTIONS.find((opt) => opt.id === iconName);
    const Comp = match ? match.icon : BookOpen;
    return <Comp className="w-5 h-5 text-[var(--brand-primary)]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">أقسام وتصنيفات المكتبة</h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            إدارة {categoriesList.length} تصنيفاً رئيسياً وفهرسة المحتوى وفق التخصصات المعرفية.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesList.map((cat) => {
          const count = categoryBooksCount[cat.name] || 0;

          return (
            <div
              key={cat.id}
              className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--brand-primary)]/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center shrink-0">
                    {renderIcon(cat.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-[var(--text-primary)] truncate">{cat.name}</h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">ID: {cat.id}</p>
                  </div>
                </div>

                {cat.description && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>{count} كتب مسجلة</span>
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                    title="تعديل التصنيف"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatToDelete(cat)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="حذف التصنيف"
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
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-black text-[var(--text-primary)]">
                {modalMode === 'create' ? 'إضافة قسم جديد للمكتبة' : `تعديل تصنيف: ${editingCat?.name}`}
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
                  اسم التصنيف / القسم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="مثال: علم الاجتماع، فيزياء كونية، تاريخ أندلسي..."
                  className="w-full h-11 px-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                />
                {formError && <p className="text-[11px] text-rose-500 font-medium">{formError}</p>}
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">أيقونة التصنيف</label>
                <div className="grid grid-cols-4 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = icon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setIcon(opt.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] font-bold truncate max-w-full">{opt.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-primary)]">الوصف والنبذة المختصرة</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للمجالات والكتب التي يضمها هذا القسم..."
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
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  تأكيد حذف القسم
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  هل أنت متأكد من حذف تصنيف "{catToDelete.name}"؟
                </p>
              </div>
            </div>

            {(categoryBooksCount[catToDelete.name] || 0) > 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium leading-relaxed">
                تنبيه أمني: يوجد حالياً <strong>{categoryBooksCount[catToDelete.name]} كتاباً</strong> مسجلة تحت هذا القسم. لن تتمكن من حذفه حتى تقوم بنقل أو حذف الكتب المرتبطة لضمان سلامة الفهرس.
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">
                لا توجد كتب مرتبطة بهذا التصنيف، يمكن حذفه بأمان.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCatToDelete(null)}
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
