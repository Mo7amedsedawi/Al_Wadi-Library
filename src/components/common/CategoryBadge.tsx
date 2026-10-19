import React from 'react';
import { BookCategory } from '../../types';
import { Feather, Landmark, Compass, Atom, Cpu, BookOpen, Sparkles, Shield, Heart } from 'lucide-react';

interface CategoryBadgeProps {
  category: BookCategory | string;
  variant?: 'subtle' | 'interactive' | 'chip';
  showIcon?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  count?: number;
  className?: string;
}

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'فانتازيا':
    case 'فانتازي':
      return Sparkles;
    case 'غموض':
      return Compass;
    case 'جاسوسية':
      return Shield;
    case 'رومانسي':
      return Heart;
    case 'كتب غير روائية':
      return BookOpen;
    case 'روايات':
      return Feather;
    case 'تاريخ':
      return Landmark;
    case 'فلسفة':
      return Compass;
    case 'علوم':
      return Atom;
    case 'تكنولوجيا':
      return Cpu;
    default:
      return BookOpen;
  }
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  variant = 'subtle',
  showIcon = false,
  isSelected = false,
  onClick,
  count,
  className = '',
}) => {
  const Icon = getCategoryIcon(category);

  if (variant === 'interactive') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border select-none ${
          isSelected
            ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm scale-[1.02]'
            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--text-primary)]'
        } ${className}`}
      >
        {showIcon && <Icon className="w-4 h-4 shrink-0" />}
        <span>{category}</span>
        {count !== undefined && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'chip') {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 ${
          onClick ? 'cursor-pointer hover:bg-[var(--brand-primary)] hover:text-white transition-colors' : ''
        } ${className}`}
      >
        {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span>{category}</span>
        {count !== undefined && <span className="text-[10px] opacity-75">({count})</span>}
      </span>
    );
  }

  // Default 'subtle' - Clean typographic metadata following Zero-Pill discipline
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-bold text-[var(--brand-primary)] tracking-wide ${
        onClick ? 'cursor-pointer hover:underline' : ''
      } ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{category}</span>
    </span>
  );
};
