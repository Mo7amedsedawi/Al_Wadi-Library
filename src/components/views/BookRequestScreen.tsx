import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, BookPlus, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const BookRequestScreen: React.FC = () => {
  const { navigateTo, goBack } = useRouter();
  const { submitNewBookRequest, showToast } = useLibrary();
  const { user } = useAuth();

  const [bookTitle, setBookTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = bookTitle.trim();
    if (!cleanTitle) {
      setErrorMessage('يرجى كتابة اسم أو عنوان الكتاب المطلوب.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitNewBookRequest(cleanTitle);
      if (res.success) {
        setIsSubmitted(true);
        setBookTitle('');
        showToast('تم إرسال طلب الكتاب بنجاح', 'سنعمل على توفيره وإضافته للمكتبة في أقرب وقت.', 'success');
      } else {
        setErrorMessage(res.error || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.');
      }
    } catch {
      setErrorMessage('تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (history.length > 1 ? goBack() : navigateTo('home'))}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة</span>
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
          اقتراح كتاب
        </span>
      </div>

      {/* Main Request Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center mx-auto mb-4">
          <BookPlus className="w-7 h-7" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] text-center">
          طلب كتاب
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] text-center mt-2 leading-relaxed">
          هل تبحث عن كتاب ولم تجده في مكتبة الوادي؟ اكتب اسم الكتاب وسنحرص على مراجعته وتوفيره بأعلى جودة.
        </p>

        {isSubmitted ? (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
              وصلنا طلبك بنجاح!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              تم تسجيل اسم الكتاب في قائمة مراجعات إدارة المكتبة، وسيتم توفيره قريباً بإذن الله.
            </p>
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="mt-2 min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              طلب كتاب آخر
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label 
                htmlFor="book-title-field" 
                className="block text-xs font-bold text-[var(--text-primary)] mb-2"
              >
                اسم الكتاب <span className="text-red-500">*</span>
              </label>
              <input
                id="book-title-field"
                type="text"
                required
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="اكتب عنوان أو اسم الكتاب المطلوب..."
                className="w-full min-h-[48px] px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-3 rounded-xl font-bold text-sm bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-50 text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ إرسال الطلب...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>إرسال الطلب</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
