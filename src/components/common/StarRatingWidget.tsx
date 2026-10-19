/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';
import { upsertBookRating, fetchUserRating } from '../../services/communityService';

interface StarRatingWidgetProps {
  bookId: string;
  initialRating: number;
  initialCount: number;
  onRatingUpdated?: (newAvg: number, newCount: number) => void;
}

export const StarRatingWidget: React.FC<StarRatingWidgetProps> = ({
  bookId,
  initialRating,
  initialCount,
  onRatingUpdated,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useLibrary();

  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [avgRating, setAvgRating] = useState<number>(initialRating);
  const [ratingsCount, setRatingsCount] = useState<number>(initialCount);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserRating(bookId, user.id).then((val) => {
        if (val) setUserRating(val);
      });
    }
  }, [bookId, isAuthenticated, user?.id]);

  const handleRate = async (value: number) => {
    if (!isAuthenticated || !user?.id) {
      showToast('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول لتتمكن من تقييم هذا الكتاب', 'warning');
      return;
    }

    if (!navigator.onLine) {
      showToast('لا يوجد اتصال بالإنترنت', 'يتطلب تسجيل التقييم اتصالاً نشطاً بالشبكة', 'warning');
      return;
    }

    // Optimistic UI update
    const prevUserRating = userRating;
    const isNewRating = prevUserRating === null;
    const nextCount = isNewRating ? ratingsCount + 1 : ratingsCount;
    const nextTotalSum = avgRating * ratingsCount - (prevUserRating || 0) + value;
    const nextAvg = Number((nextTotalSum / nextCount).toFixed(1));

    setUserRating(value);
    setAvgRating(nextAvg);
    setRatingsCount(nextCount);
    onRatingUpdated?.(nextAvg, nextCount);

    setIsSubmitting(true);
    try {
      const res = await upsertBookRating(bookId, user.id, value);
      if (res.success && res.averageRating !== undefined && res.count !== undefined) {
        setAvgRating(res.averageRating);
        setRatingsCount(res.count);
        onRatingUpdated?.(res.averageRating, res.count);
      }
      showToast('شكراً لتقييمك!', `تم تسجيل تقييمك (${value} من 5) لهذا الكتاب بنجاح`, 'success');
    } catch (e: any) {
      // Revert optimistic on error
      setUserRating(prevUserRating);
      showToast('خطأ في التقييم', 'تعذر إرسال التقييم حالياً', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-xs">
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-[var(--text-primary)]">تقييمك للكتاب:</span>
        <div 
          className="flex items-center gap-1 text-amber-400"
          onMouseLeave={() => setHoverRating(null)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating !== null ? star <= hoverRating : (userRating !== null && star <= userRating));
            return (
              <button
                key={star}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                className="p-1 rounded-lg hover:scale-125 transition-transform disabled:opacity-50 focus:outline-none"
                title={`تقييم ${star} من 5`}
                aria-label={`تقييم ${star} من 5 نجوم`}
              >
                <Star
                  className={`w-5 h-5 ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-4 w-[1px] bg-[var(--border-subtle)] hidden sm:block" />

      <div className="flex items-center gap-2 text-[var(--text-muted)] font-medium">
        <span>المتوسط:</span>
        <span className="font-mono font-bold text-[var(--text-primary)] text-sm">
          {avgRating.toFixed(1)} / 5
        </span>
        <span className="font-mono">({ratingsCount} تقييم)</span>
        {userRating && (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold ms-1">
            (تم تقييمك بـ {userRating}★)
          </span>
        )}
      </div>
    </div>
  );
};
