-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - إضافة ميزة سلاسل الكتب (Book Series)
-- Migration: 20261014_add_book_series.sql
-- ==============================================================================

-- 1. إضافة عمودي السلسلة ورقم الجزء إلى جدول الكتب public.books
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS series TEXT,
ADD COLUMN IF NOT EXISTS series_part INTEGER;

-- 2. إنشاء فهرس مركب لتسريع استعلامات البحث وتجميع أجزاء السلسلة بالترتيب
CREATE INDEX IF NOT EXISTS idx_books_series ON public.books (series, series_part);

-- 3. تعليق توثيقي على الأعمدة الجديدة
COMMENT ON COLUMN public.books.series IS 'اسم السلسلة الأدبية أو العلمية التي ينتمي إليها الكتاب (اختياري)';
COMMENT ON COLUMN public.books.series_part IS 'رقم الجزء وترتيب الكتاب داخل السلسلة (مثلاً 1 للجزء الأول)';

-- 4. ربط الكتب الحالية في قاعدة البيانات بسلاسلها المقابلة تلقائياً (اختياري/بيانات أولية)
UPDATE public.books
SET series = 'ثلاثية الظلال والعظام', series_part = 1
WHERE title ILIKE '%الظلال والعظام 1%' OR title ILIKE '%الظلال والعظام%';

UPDATE public.books
SET series = 'ثلاثية الظلال والعظام', series_part = 2
WHERE title ILIKE '%الظلال والعظام 2%' OR title ILIKE '%حصار وعاصفة%';

UPDATE public.books
SET series = 'ثلاثية الظلال والعظام', series_part = 3
WHERE title ILIKE '%الظلال والعظام 3%' OR title ILIKE '%انهيار ونهوض%';

UPDATE public.books
SET series = 'سلسلة ستة من الغربان', series_part = 1
WHERE title ILIKE '%ستة من الغربان%';

UPDATE public.books
SET series = 'سلسلة ستة من الغربان', series_part = 2
WHERE title ILIKE '%مملكة المحتالين%' OR title ILIKE '%مملكة اللصوص%';

UPDATE public.books
SET series = 'سلسلة جراي مان (الرجل الرمادي)', series_part = 1
WHERE title ILIKE '%الرجل الرمادي%' OR title ILIKE '%جراي مان%';

UPDATE public.books
SET series = 'سلسلة جراي مان (الرجل الرمادي)', series_part = 2
WHERE title ILIKE '%على الهدف%';
