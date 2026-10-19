import React, { useState, useEffect } from 'react';
import { Book, BookCategory, BookStatus } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { SequentialUploadProgress } from '../../services/libraryService';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Sparkles, 
  Star, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  FileCheck,
  Layers
} from 'lucide-react';

interface BookFormViewProps {
  editingBook: Book | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export const BookFormView: React.FC<BookFormViewProps> = ({
  editingBook,
  onCancel,
  onSuccess,
}) => {
  const { 
    authors, 
    categoriesList, 
    allBooks,
    createBookWithFiles, 
    updateBook, 
    showToast,
    addAuthor
  } = useLibrary();

  // Section A: Metadata
  const [title, setTitle] = useState(editingBook?.title || '');
  const [description, setDescription] = useState(editingBook?.description || '');
  const [authorId, setAuthorId] = useState(editingBook?.author?.id || (authors[0]?.id || ''));
  const [newAuthorName, setNewAuthorName] = useState('');
  const [showQuickAddAuthor, setShowQuickAddAuthor] = useState(false);
  const [category, setCategory] = useState<BookCategory>(editingBook?.category || 'فانتازيا');
  const [pages, setPages] = useState<number>(editingBook?.pages || 250);
  const [keywords, setKeywords] = useState<string[]>(editingBook?.keywords || ['أدب', 'رواية']);
  const [keywordInput, setKeywordInput] = useState('');

  // Series name state - Free text field mapped to books.series_name
  const [seriesName, setSeriesName] = useState<string>(
    editingBook?.seriesName || editingBook?.series || ''
  );
  const [seriesPart, setSeriesPart] = useState<number | ''>(
    editingBook?.seriesPart !== undefined && editingBook?.seriesPart !== null ? editingBook.seriesPart : ''
  );

  // Section B: Visibility & Status
  const [status, setStatus] = useState<BookStatus>(editingBook?.status || 'published');
  const [isTrending, setIsTrending] = useState<boolean>(editingBook?.isTrending || false);
  const [isNew, setIsNew] = useState<boolean>(editingBook?.isNew || true);
  const [isBookOfTheDay, setIsBookOfTheDay] = useState<boolean>(editingBook?.isBookOfTheDay || false);

  // Section C: Media & Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>(
    editingBook?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80'
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [epubFile, setEpubFile] = useState<File | null>(null);

  // Validation & Submission State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<SequentialUploadProgress | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Preset covers for testing ease
  const presetCovers = [
    { label: 'كلاسيكي أخضر', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=700&q=80' },
    { label: 'مخطوط فلسفي', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=700&q=80' },
    { label: 'تكنولوجي حديث', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=700&q=80' },
    { label: 'فضاء واستكشاف', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=700&q=80' },
  ];

  // Handle Cover selection with instant preview
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('نوع الملف غير صالح', 'يرجى اختيار صورة صالحة للغلاف (JPG أو PNG أو WEBP).', 'error');
      return;
    }

    setCoverFile(file);
    const objectUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(objectUrl);
  };

  // Handle PDF file selection with strict validation
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('نوع الملف غير مدعوم', 'يرجى اختيار ملف PDF صالح.', 'error');
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('حجم الملف كبير جداً', 'الحد الأقصى لحجم ملف PDF هو 50 ميجابايت.', 'error');
      return;
    }

    setPdfFile(file);
    setErrors((prev) => ({ ...prev, pdf: '' }));
  };

  // Handle EPUB file selection with strict validation
  const handleEpubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.epub') && file.type !== 'application/epub+zip') {
      showToast('نوع الملف غير مدعوم', 'يرجى اختيار ملف EPUB صالح.', 'error');
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('حجم الملف كبير جداً', 'الحد الأقصى لحجم ملف EPUB هو 50 ميجابايت.', 'error');
      return;
    }

    setEpubFile(file);
  };

  // Keywords chip handlers
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== kwToRemove));
  };

  // Quick Add Author
  const handleQuickAddAuthor = async () => {
    if (!newAuthorName.trim()) return;
    const newId = `author-${Date.now()}`;
    const res = await addAuthor({
      id: newId,
      name: newAuthorName.trim(),
    });
    if (res.success) {
      setAuthorId(newId);
      setNewAuthorName('');
      setShowQuickAddAuthor(false);
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'عنوان الكتاب مطلوب';
    }

    if (!description.trim()) {
      newErrors.description = 'وصف الكتاب أو النبذة التعريفية مطلوبة';
    }

    if (!authorId && !newAuthorName) {
      newErrors.author = 'يرجى اختيار أو إضافة مؤلف للكتاب';
    }

    // Draft Protection check: If status is 'published', require a cover and at least one file or existing file
    if (status === 'published') {
      const hasCover = Boolean(coverFile || coverPreviewUrl);
      const hasFile = Boolean(pdfFile || epubFile || editingBook?.fileUrl || editingBook?.formats?.length);

      if (!hasCover) {
        newErrors.cover = 'لا يمكن النشر العام دون صورة غلاف للكتاب. احفظ كمسودة بدلاً من ذلك.';
      }
      if (!hasFile) {
        newErrors.files = 'لحماية تجربة القراء، يجب إرفاق ملف PDF أو EPUB قبل النشر العام. يمكنك الحفظ كمسودة.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('بيانات غير مكتملة', 'يرجى مراجعة الحقول المحددة باللون الأحمر.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const selectedAuthorObj = authors.find((a) => a.id === authorId);

      if (editingBook) {
        // Edit Mode: Update existing book
        const updatedBook: Book = {
          ...editingBook,
          title,
          description,
          seriesName: seriesName.trim() || undefined,
          series: seriesName.trim() || undefined,
          seriesPart: seriesPart !== '' && !isNaN(Number(seriesPart)) ? Number(seriesPart) : undefined,
          author: {
            id: authorId,
            name: selectedAuthorObj?.name || editingBook.author.name,
            bio: selectedAuthorObj?.bio,
          },
          category,
          pages: Number(pages) || editingBook.pages,
          keywords: keywords.length > 0 ? keywords : editingBook.keywords,
          status,
          isTrending,
          isNew,
          isBookOfTheDay,
          coverImage: coverPreviewUrl,
        };

        updateBook(updatedBook);
        onSuccess();
      } else {
        // Add Mode: Sequential Transactional Upload
        const res = await createBookWithFiles(
          {
            title,
            description,
            seriesName: seriesName.trim() || undefined,
            series: seriesName.trim() || undefined,
            seriesPart: seriesPart !== '' && !isNaN(Number(seriesPart)) ? Number(seriesPart) : undefined,
            authorId,
            authorName: selectedAuthorObj?.name || 'مؤلف معتمد',
            authorBio: selectedAuthorObj?.bio,
            category,
            pages: Number(pages) || 200,
            status,
            isTrending,
            isNew,
            isBookOfTheDay,
            keywords,
            coverFile,
            coverUrlFallback: coverPreviewUrl,
            pdfFile,
            epubFile,
          },
          (progress) => {
            setUploadProgress(progress);
          }
        );

        if (res.success) {
          onSuccess();
        } else {
          const errDetail = res.error || 'تعذر إكمال حفظ الكتاب في قاعدة البيانات.';
          setSubmissionError(errDetail);
          showToast('فشل حفظ الكتاب', errDetail, 'error');
        }
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'حدث خطأ غير متوقع أثناء الحفظ');
      showToast('حدث خطأ أثناء الحفظ', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="الرجوع لقائمة الكتب"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              {editingBook ? `تعديل كتاب: ${editingBook.title}` : 'إضافة كتاب جديد للمكتبة'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              أدخل بيانات الكتاب، وارفع الغلاف وملفات القراءة بصيغة PDF أو EPUB إلى التخزين السحابي.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Feedback Overlay during upload */}
      {isSubmitting && uploadProgress && (
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--brand-primary)] shadow-lg space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-primary)]" />
              <span>{uploadProgress.message}</span>
            </span>
            <span className="font-mono text-sm text-[var(--brand-primary)]">{uploadProgress.percentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div 
              className="h-full bg-[var(--brand-primary)] transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] text-center">
            يرجى الانتظار حتى اكتمال رفع الملفات وتحديث قاعدة البيانات السحابية...
          </p>
        </div>
      )}

      {/* Submission Error Banner */}
      {submissionError && !isSubmitting && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-rose-700 dark:text-rose-300 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-700 dark:text-rose-200">فشل حفظ الكتاب في قاعدة البيانات</h4>
              <p className="text-xs mt-1 text-rose-600/90 dark:text-rose-300/90 font-mono text-right dir-rtl break-all">
                {submissionError}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                لم يتم إدراج الكتاب في المكتبة أو حفظه محلياً لمنع تباين البيانات مع خادم Supabase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubmissionError(null)}
            className="p-1 rounded-lg hover:bg-rose-500/15 text-rose-500 transition-colors shrink-0"
            title="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A: Basic Metadata */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-5">
          <div className="border-b border-[var(--border-subtle)] pb-3">
            <h3 className="text-base font-black text-[var(--text-primary)]">القسم الأول: البيانات الأساسية والتوثيق</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">عنوان الكتاب، المؤلف، التصنيف، والكلمات الدلالية لمحرك البحث.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                <span>عنوان الكتاب <span className="text-rose-500">*</span></span>
                <span className="text-[11px] text-[var(--text-muted)]">{title.length} حرف</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                placeholder="مثال: مقدمة ابن خلدون في العبر وديوان المبتدأ والخبر"
                className={`w-full h-11 px-4 rounded-xl text-xs bg-[var(--bg-secondary)] border text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)] ${
                  errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[var(--border-subtle)]'
                }`}
              />
              {errors.title && <p className="text-[11px] text-rose-500 font-medium">{errors.title}</p>}
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  المؤلف <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickAddAuthor(!showQuickAddAuthor)}
                  className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline"
                >
                  {showQuickAddAuthor ? 'اختيار من القائمة' : '+ مؤلف جديد'}
                </button>
              </div>

              {showQuickAddAuthor ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    placeholder="اسم المؤلف الجديد..."
                    className="flex-1 h-11 px-3 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddAuthor}
                    className="h-11 px-3.5 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shrink-0"
                  >
                    حفظ
                  </button>
                </div>
              ) : (
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium focus:outline-hidden focus:border-[var(--brand-primary)]"
                >
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                القسم / التصنيف <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-medium focus:outline-hidden focus:border-[var(--brand-primary)]"
              >
                {[
                  { id: 'فانتازيا', name: 'فانتازيا' },
                  { id: 'غموض', name: 'غموض' },
                  { id: 'جاسوسية', name: 'جاسوسية' },
                  { id: 'رومانسي', name: 'رومانسي' },
                  { id: 'كتب غير روائية', name: 'كتب غير روائية' },
                ].map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                النبذة التعريفية ووصف الكتاب <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                placeholder="اكتب نبذة شاملة عن محتوى الكتاب، أفكاره الرئيسية، وسياقه التاريخي أو العلمي..."
                className={`w-full p-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border text-[var(--text-primary)] leading-relaxed focus:outline-hidden focus:border-[var(--brand-primary)] ${
                  errors.description ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[var(--border-subtle)]'
                }`}
              />
              {errors.description && <p className="text-[11px] text-rose-500 font-medium">{errors.description}</p>}
            </div>

            {/* Pages Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                عدد الصفحات
              </label>
              <input
                type="number"
                min={1}
                max={5000}
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
              />
            </div>

            {/* Keywords Chip Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                الكلمات الدلالية (Tags)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="اكتب كلمة ثم اضغط Enter..."
                  className="flex-1 h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  className="h-11 px-3 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Rendered Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Book Series Information (Simple free-text input) */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>اسم السلسلة (اختياري)</span>
                </label>
                {seriesName && (
                  <button
                    type="button"
                    onClick={() => {
                      setSeriesName('');
                      setSeriesPart('');
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:underline"
                  >
                    مسح اسم السلسلة
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    اسم السلسلة
                  </label>
                  <input
                    type="text"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    placeholder="اكتب اسم السلسلة بحرية، أو اتركه فارغاً إذا لم يكن تابعاً لسلسلة..."
                    className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[var(--text-secondary)]">
                    رقم الجزء في السلسلة
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={seriesPart}
                    onChange={(e) => setSeriesPart(e.target.value ? Number(e.target.value) : '')}
                    placeholder="مثال: 1 (الجزء الأول)"
                    className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--brand-primary)]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                يُحفظ اسم السلسلة مباشرة في حقل <code className="font-mono text-amber-600 dark:text-amber-400">series_name</code> بجدول الكتب، ويظهر كرابط تفاعلي للقارئ لاستعراض كافة كتب السلسلة.
              </p>
            </div>
          </div>
        </div>

        {/* Section B: Visibility, Status & Draft Protection */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-5">
          <div className="border-b border-[var(--border-subtle)] pb-3">
            <h3 className="text-base font-black text-[var(--text-primary)]">القسم الثاني: حالة النشر والترويج (Visibility)</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">التحكم في ظهور الكتاب للقراء في تطبيق المعاينة وتحديد أوسمة الترويج.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                حالة النشر <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as BookStatus);
                  if (errors.files) setErrors((prev) => ({ ...prev, files: '' }));
                }}
                className="w-full h-11 px-3.5 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold focus:outline-hidden focus:border-[var(--brand-primary)]"
              >
                <option value="published">منشور (يظهر لكافة القراء والزوار فوراً)</option>
                <option value="draft">مسودة Draft (مخفي عن العامة، مرئي للإدارة فقط)</option>
                <option value="hidden">مخفي مؤقتاً (Hidden - تحت الصيانة)</option>
              </select>
            </div>

            {/* Curation Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-primary)]">أوسمة الترويج في الرئيسية</label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsTrending(!isTrending)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isTrending
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-600 dark:text-orange-400'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  <Flame className={`w-3.5 h-3.5 ${isTrending ? 'fill-current' : ''}`} />
                  <span>الكتب الرائجة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNew(!isNew)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isNew
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>إصدار حديث</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBookOfTheDay(!isBookOfTheDay)}
                  className={`h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    isBookOfTheDay
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isBookOfTheDay ? 'fill-current' : ''}`} />
                  <span>كتاب اليوم</span>
                </button>
              </div>
            </div>
          </div>

          {/* Draft Protection Notice */}
          {status === 'published' && (!coverFile && !coverPreviewUrl || !pdfFile && !epubFile && !editingBook?.fileUrl) && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-700 dark:text-amber-400 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">حماية المسودات مفعلة (Draft Protection):</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  لحماية تجربة القراء من الكتب الفارغة، يتطلب النشر العام غلافاً وملف قراءة (PDF أو EPUB). إذا لم تكن الملفات جاهزة الآن، يمكنك ضبط الحالة على <strong>مسودة (Draft)</strong> وحفظ البيانات بأمان.
                </p>
              </div>
            </div>
          )}

          {errors.files && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
              {errors.files}
            </div>
          )}
        </div>

        {/* Section C: Media & File Uploads */}
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-5">
          <div className="border-b border-[var(--border-subtle)] pb-3">
            <h3 className="text-base font-black text-[var(--text-primary)]">القسم الثالث: رفع الغلاف وملفات القراءة السحابية</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">يتم رفع الغلاف إلى حاوية book-covers والملفات إلى book-files في Supabase Storage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cover Upload Zone */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-primary)] flex items-center justify-between">
                <span>غلاف الكتاب (Image)</span>
                {coverFile && <span className="text-[11px] text-emerald-600 font-bold">✓ تم اختيار ملف</span>}
              </label>

              <div className="flex gap-4">
                {/* Preview Thumbnail */}
                <div className="w-24 h-32 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] overflow-hidden shrink-0 shadow-xs">
                  {coverPreviewUrl ? (
                    <img src={coverPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-2 text-center text-[10px]">
                      <ImageIcon className="w-5 h-5 mb-1" />
                      لا يوجد غلاف
                    </div>
                  )}
                </div>

                {/* Upload Zone */}
                <div className="flex-1 flex flex-col justify-between">
                  <label className="flex-1 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[var(--bg-secondary)]/50">
                    <Upload className="w-5 h-5 text-[var(--text-muted)] mb-1" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">اختر صورة الغلاف</span>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5">JPG, PNG, WEBP (حتى 5 ميجابايت)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>

                  {/* Preset quick picker */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-[var(--text-muted)]">نماذج جاهزة:</span>
                    {presetCovers.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreviewUrl(preset.url);
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Book Files Upload Zone (PDF & EPUB) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[var(--text-primary)]">
                ملفات القراءة والتحميل (PDF & EPUB)
              </label>

              {/* PDF Zone */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">ملف PDF</span>
                  </div>
                  {pdfFile ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      {(pdfFile.size / (1024 * 1024)).toFixed(1)} ميجابايت
                    </span>
                  ) : editingBook?.fileUrl ? (
                    <span className="text-[11px] text-[var(--text-muted)]">متوفر في السحابة ✓</span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">اختياري</span>
                  )}
                </div>

                <label className="block w-full py-2 px-3 text-center rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors bg-[var(--bg-surface)]">
                  <span>{pdfFile ? pdfFile.name : 'اختيار ملف PDF من الجهاز (حد أقصى 50MB)'}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* EPUB Zone */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">ملف EPUB</span>
                  </div>
                  {epubFile ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      {(epubFile.size / (1024 * 1024)).toFixed(1)} ميجابايت
                    </span>
                  ) : editingBook?.epubUrl ? (
                    <span className="text-[11px] text-[var(--text-muted)]">متوفر في السحابة ✓</span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">اختياري</span>
                  )}
                </div>

                <label className="block w-full py-2 px-3 text-center rounded-xl border border-dashed border-[var(--border-subtle)] hover:border-[var(--brand-primary)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors bg-[var(--bg-surface)]">
                  <span>{epubFile ? epubFile.name : 'اختيار ملف EPUB من الجهاز (حد أقصى 50MB)'}</span>
                  <input
                    type="file"
                    accept=".epub,application/epub+zip"
                    onChange={handleEpubChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions Footer */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
          >
            إلغاء والعودة
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-7 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ المعالجة والرفع...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingBook ? 'حفظ تعديلات الكتاب' : 'رفع ونشر الكتاب الآن'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
