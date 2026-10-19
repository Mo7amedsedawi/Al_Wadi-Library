-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - إضافة عمود اسم السلسلة series_name لجدول الكتب
-- Migration: 20261014_add_series_name_column.sql
-- ==============================================================================

-- 1. إضافة عمود اسم السلسلة الاختياري إلى جدول الكتب books
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS series_name TEXT;

-- 2. إضافة عمود رقم الجزء الاختياري لتحديد ترتيب الأجزاء داخل السلسلة
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS series_part INTEGER;

-- 3. إنشاء فهرس مركب لتسريع الاستعلام والبحث عن كتب السلسلة بالاسم
CREATE INDEX IF NOT EXISTS idx_books_series_name ON public.books (series_name);

-- 4. تعليق توثيقي في قاعدة البيانات
COMMENT ON COLUMN public.books.series_name IS 'اسم السلسلة الأدبية أو المعرفية التي ينتمي إليها الكتاب (اختياري، NULL إذا لم يكن تابعاً لسلسلة)';
COMMENT ON COLUMN public.books.series_part IS 'رقم الجزء وترتيب الكتاب داخل السلسلة (اختياري)';
