-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - تمكين Realtime وتحديث مخطط نقاشات القراء
-- Migration: 20261015_enable_discussions_realtime_and_names.sql
-- ==============================================================================

-- 1. إضافة عمودي اسم الكاتب والصورة الرمزية لجدول نقاشات الكتب book_comments
-- لتمكين مشاركة اسم الكاتب بين الأجهزة مباشرة وبسرعة فائقة دون الاعتماد على ربط الجداول الخارجية
ALTER TABLE public.book_comments 
ADD COLUMN IF NOT EXISTS user_name TEXT;

ALTER TABLE public.book_comments 
ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- 2. إنشاء فهارس مركبة لتسريع استعلامات النقاشات والردود حسب الكتاب وتاريخ الإنشاء
CREATE INDEX IF NOT EXISTS idx_book_comments_book_created 
ON public.book_comments (book_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_book_comments_parent_id 
ON public.book_comments (parent_id) 
WHERE parent_id IS NOT NULL;

-- 3. تفعيل الهوية المكتملة للسجلات (Replica Identity Full)
-- مطلوب لتمرير بيانات السجل بالكامل أثناء أحداث Realtime (خصوصاً التعديل والحذف)
ALTER TABLE public.book_comments REPLICA IDENTITY FULL;

-- 4. إضافة جدول book_comments إلى منشور البث المباشر (Supabase Realtime Publication)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'book_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.book_comments;
  END IF;
END $$;

-- 5. تحديث سياسات أمان مستوى الصفوف (RLS) لجدول نقاشات الكتب book_comments
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

-- أ) سياسة القراءة العامة: يحق لجميع زوار المكتبة وقرائها قراءة النقاشات
DROP POLICY IF EXISTS "Public Read Comments" ON public.book_comments;
CREATE POLICY "Public Read Comments" 
ON public.book_comments 
FOR SELECT 
USING (true);

-- ب) سياسة النشر للمستخدمين المسجلين: يحق لكل قارئ مسجل نشر تعليق باسم حسابه
DROP POLICY IF EXISTS "Authenticated Insert Comments" ON public.book_comments;
CREATE POLICY "Authenticated Insert Comments" 
ON public.book_comments 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- ج) سياسة التعديل: يحق لصاحب التعليق فقط تعديل نصه
DROP POLICY IF EXISTS "Owner Update Comments" ON public.book_comments;
CREATE POLICY "Owner Update Comments" 
ON public.book_comments 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- د) سياسة الحذف: يحق لصاحب التعليق أو مدير النظام (Admin) حذف التعليق
DROP POLICY IF EXISTS "Owner Or Admin Delete Comments" ON public.book_comments;
CREATE POLICY "Owner Or Admin Delete Comments" 
ON public.book_comments 
FOR DELETE TO authenticated 
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR (auth.jwt() ->> 'role' = 'admin')
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

-- 6. السماح للمستخدمين بإضافة ملفاتهم الشخصية في جدول profiles
DROP POLICY IF EXISTS "Users Insert Own Profile" ON public.profiles;
CREATE POLICY "Users Insert Own Profile" 
ON public.profiles 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

-- 7. تعليق توثيقي في قاعدة البيانات
COMMENT ON TABLE public.book_comments IS 'مساحة نقاشات القراء المشتركة المتزامنة عبر Realtime بين جميع الأجهزة';
COMMENT ON COLUMN public.book_comments.user_name IS 'اسم القارئ المعروض في النقاش عند الإرسال';
