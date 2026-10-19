import React from 'react';
import { Compass, Home, ArrowRight, AlertTriangle } from 'lucide-react';

interface NotFoundScreenProps {
  onGoHome: () => void;
  title?: string;
  message?: string;
  isError?: boolean;
}

export const NotFoundScreen: React.FC<NotFoundScreenProps> = ({
  onGoHome,
  title = '404 - الصفحة غير موجودة',
  message = 'عذراً، الصفحة أو الكتاب الذي تحاول الوصول إليه غير متوفر في رفوف مكتبة الوادي أو تم نقله.',
  isError = false,
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 sm:p-12" dir="rtl">
      <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] text-[var(--brand-primary)] flex items-center justify-center mb-6 shadow-sm border border-[var(--border-subtle)]">
        {isError ? (
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        ) : (
          <Compass className="w-10 h-10 text-[var(--brand-primary)]" />
        )}
      </div>

      <span className="text-xs font-mono font-bold text-[var(--brand-primary)] uppercase tracking-wider mb-2 block">
        {isError ? 'تنبيه في النظام' : 'خطأ في المسار 404'}
      </span>

      <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] max-w-md">
        {title}
      </h1>

      <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm sm:max-w-md mt-2 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={onGoHome}
          className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-2 shadow-sm active:scale-95"
        >
          <Home className="w-4 h-4" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>
      </div>
    </div>
  );
};
