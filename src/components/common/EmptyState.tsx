import React from 'react';
import { SearchX, ArrowDownToLine, Heart, BookOpen, LucideIcon } from 'lucide-react';

export type EmptyStateType = 'search' | 'downloads' | 'favorites' | 'books' | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'custom',
  title,
  description,
  actionText,
  onAction,
  icon: CustomIcon,
  className = '',
}) => {
  const configs = {
    search: {
      icon: SearchX,
      title: 'لا توجد نتائج مطابقة للبحث',
      description: 'جرب البحث بكلمات مختلفة أو تأكد من خلو النص من الأخطاء الإملائية، أو تصفح الأقسام المقترحة.',
      actionText: 'إعادة تعيين البحث والتصفح',
    },
    downloads: {
      icon: ArrowDownToLine,
      title: 'لم تقم بتنزيل أي كتب بعد',
      description: 'يمكنك تنزيل كتبك المفضلة لقراءتها في أي وقت وأي مكان دون الحاجة للاتصال بشبكة الإنترنت.',
      actionText: 'استكشاف وتنزيل الكتب',
    },
    favorites: {
      icon: Heart,
      title: 'قائمة المفضلة فارغة حالياً',
      description: 'انقر على أيقونة القلب على أي كتاب أثناء تصفحك للمكتبة لحفظه هنا والرجوع إليه بسرعة.',
      actionText: 'تصفح روائع المكتبة',
    },
    books: {
      icon: BookOpen,
      title: 'لا توجد كتب متوفرة في هذه القائمة',
      description: 'لم تتم إضافة كتب إلى هذا القسم بعد. يمكنك تصفح باقي أقسام المكتبة العامة.',
      actionText: 'تصفح كل الكتب',
    },
    custom: {
      icon: CustomIcon || BookOpen,
      title: title || 'لا توجد بيانات متاحة',
      description: description || 'لم نتمكن من العثور على أي عناصر لعرضها في الوقت الحالي.',
      actionText: actionText,
    },
  };

  const currentConfig = configs[type] || configs.custom;
  const FinalIcon = CustomIcon || currentConfig.icon;
  const finalTitle = title || currentConfig.title;
  const finalDescription = description || currentConfig.description;
  const finalActionText = actionText || currentConfig.actionText;

  return (
    <div
      className={`py-14 px-6 text-center flex flex-col items-center justify-center rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3.5 shadow-sm transition-all duration-300 animate-in fade-in ${className}`}
      dir="rtl"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center shadow-inner">
        <FinalIcon className="w-8 h-8 stroke-[1.8] text-[var(--brand-primary)]" />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
          {finalTitle}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {finalDescription}
        </p>
      </div>

      {finalActionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all shadow-sm active:scale-95 mt-2 inline-flex items-center gap-2"
        >
          <span>{finalActionText}</span>
        </button>
      )}
    </div>
  );
};
