import React from 'react';

interface SkeletonCardProps {
  variant?: 'grid' | 'carousel' | 'compact';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'grid' }) => {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse">
        <div className="w-14 h-20 rounded-lg bg-[var(--bg-muted)] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-20 h-3 rounded bg-[var(--bg-muted)]" />
          <div className="w-3/4 h-4 rounded bg-[var(--bg-muted)]" />
          <div className="w-1/2 h-3 rounded bg-[var(--bg-muted)]" />
        </div>
      </div>
    );
  }

  const isCarousel = variant === 'carousel';

  return (
    <div className={`flex flex-col select-none animate-pulse ${isCarousel ? 'w-40 sm:w-48 shrink-0' : 'w-full'}`}>
      {/* Cover Skeleton */}
      <div className="relative aspect-[3/4.4] w-full rounded-2xl bg-[var(--bg-muted)] border border-[var(--border-subtle)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>

      {/* Meta skeleton */}
      <div className="mt-2.5 space-y-2">
        <div className="w-16 h-3 rounded bg-[var(--bg-muted)]" />
        <div className="w-full h-4 rounded bg-[var(--bg-muted)]" />
        <div className="w-2/3 h-3 rounded bg-[var(--bg-muted)]" />
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant="grid" />
      ))}
    </div>
  );
};
