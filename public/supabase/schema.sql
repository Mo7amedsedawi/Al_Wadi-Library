-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - Supabase Database Schema & Storage Configuration
-- مرحلة نظام إدارة المحتوى والأدوار (Phase 6: CMS, RBAC, Curation & Storage)
-- ==============================================================================

-- 1. جدول المؤلفين (Authors)
CREATE TABLE IF NOT EXISTS public.authors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    born TEXT,
    nationality TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول التصنيفات (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول الكتب الرئيسي (Books)
CREATE TABLE IF NOT EXISTS public.books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author_id TEXT REFERENCES public.authors(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    description TEXT NOT NULL,
    full_excerpt TEXT,
    cover_image TEXT,
    pages INTEGER DEFAULT 100,
    rating NUMERIC(3, 1) DEFAULT 4.5,
    ratings_count INTEGER DEFAULT 1,
    publish_date TIMESTAMPTZ DEFAULT NOW(),
    is_trending BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_book_of_the_day BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'hidden')),
    file_size TEXT DEFAULT '10 MB',
    primary_format TEXT DEFAULT 'pdf',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ترقية الأعمدة للكتب إذا كانت الجداول منشأة مسبقاً
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_book_of_the_day BOOLEAN DEFAULT FALSE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- 4. جدول صيغ وتخزين ملفات الكتب (Book Formats & File References)
CREATE TABLE IF NOT EXISTS public.book_formats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'epub')),
    file_url TEXT,
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_id, format)
);

-- 5. جدول الكلمات المفتاحية للبحث (Book Search Keywords)
CREATE TABLE IF NOT EXISTS public.book_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    UNIQUE(book_id, keyword)
);

-- 6. جدول ملفات المستخدمين والأدوار (User Profiles & Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    membership_tier TEXT DEFAULT 'عضو قارئ مميز',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. جدول المفضلة للمستخدمين (User Favorites)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- 8. جدول سجل القراءة والتقدم (User Reading Progress History)
CREATE TABLE IF NOT EXISTS public.user_reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    reading_progress INTEGER DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

-- دالة وتريغر لإنشاء ملف شخصي تلقائياً عند تسجيل أي مستخدم جديد عبر Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, membership_tier)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'عضو قارئ مميز'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name;
    -- NEVER allow updating role from client metadata during signup!
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- الفهارس لتحسين سرعة محرك البحث والاستعلامات (Indexes)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_books_author_id ON public.books(author_id);
CREATE INDEX IF NOT EXISTS idx_books_category_name ON public.books(category_name);
CREATE INDEX IF NOT EXISTS idx_books_publish_date ON public.books(publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_books_rating ON public.books(rating DESC);
CREATE INDEX IF NOT EXISTS idx_book_keywords_keyword ON public.book_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_book_formats_book_id ON public.book_formats(book_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_user ON public.user_reading_history(user_id, last_read_at DESC);

-- ==============================================================================
-- سياسات الأمان والحماية على مستوى الصفوف (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_history ENABLE ROW LEVEL SECURITY;

-- 1. القراءة العامة لكافة زوار المكتبة (Zero-Friction Public Read Access)
DROP POLICY IF EXISTS "Public Read Authors" ON public.authors;
CREATE POLICY "Public Read Authors" ON public.authors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Books" ON public.books;
CREATE POLICY "Public Read Books" ON public.books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Book Formats" ON public.book_formats;
CREATE POLICY "Public Read Book Formats" ON public.book_formats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Book Keywords" ON public.book_keywords;
CREATE POLICY "Public Read Book Keywords" ON public.book_keywords FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

-- 2. سياسات المفضلة وسجل القراءة للمستخدمين المسجلين
DROP POLICY IF EXISTS "Users Read Own Favorites" ON public.user_favorites;
CREATE POLICY "Users Read Own Favorites" ON public.user_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Insert Own Favorites" ON public.user_favorites;
CREATE POLICY "Users Insert Own Favorites" ON public.user_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Delete Own Favorites" ON public.user_favorites;
CREATE POLICY "Users Delete Own Favorites" ON public.user_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Read Own Reading History" ON public.user_reading_history;
CREATE POLICY "Users Read Own Reading History" ON public.user_reading_history FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users Upsert Own Reading History" ON public.user_reading_history;
CREATE POLICY "Users Upsert Own Reading History" ON public.user_reading_history FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. سياسات إدارة المحتوى للمديرين فقط (Admin RBAC Policies)
DROP POLICY IF EXISTS "Admin Manage Books" ON public.books;
CREATE POLICY "Admin Manage Books" ON public.books FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR (auth.jwt() ->> 'role' = 'admin')
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

DROP POLICY IF EXISTS "Admin Manage Authors" ON public.authors;
CREATE POLICY "Admin Manage Authors" ON public.authors FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR (auth.jwt() ->> 'role' = 'admin')
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

DROP POLICY IF EXISTS "Admin Manage Categories" ON public.categories;
CREATE POLICY "Admin Manage Categories" ON public.categories FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR (auth.jwt() ->> 'role' = 'admin')
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

DROP POLICY IF EXISTS "Admin Manage Formats" ON public.book_formats;
CREATE POLICY "Admin Manage Formats" ON public.book_formats FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR (auth.jwt() ->> 'role' = 'admin')
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

DROP POLICY IF EXISTS "Admin Manage Keywords" ON public.book_keywords;
CREATE POLICY "Admin Manage Keywords" ON public.book_keywords FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR (auth.jwt() ->> 'role' = 'admin')
  OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

-- ==============================================================================
-- إعدادات Storage Buckets للتخزين السحابي (Supabase Storage)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-files', 'book-files', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات قراءة الملفات العامة
DROP POLICY IF EXISTS "Public Read Covers" ON storage.objects;
CREATE POLICY "Public Read Covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');

DROP POLICY IF EXISTS "Public Read Book Files" ON storage.objects;
CREATE POLICY "Public Read Book Files" ON storage.objects FOR SELECT USING (bucket_id = 'book-files');

-- سياسات رفع وحذف الملفات للمسؤولين
DROP POLICY IF EXISTS "Admin Upload Covers" ON storage.objects;
CREATE POLICY "Admin Upload Covers" ON storage.objects FOR ALL TO authenticated 
USING (
  bucket_id = 'book-covers' AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role' = 'admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
);

DROP POLICY IF EXISTS "Admin Upload Files" ON storage.objects;
CREATE POLICY "Admin Upload Files" ON storage.objects FOR ALL TO authenticated 
USING (
  bucket_id = 'book-files' AND (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR (auth.jwt() ->> 'role' = 'admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
);

-- حماية جدول الملفات الشخصية profiles لمنع ترقية الدور من قبل المستخدم العادي
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- لا يمكن للمستخدم العادي ترقية دوره إلى admin
    role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  )
);

-- ==============================================================================
-- دالة مساعدة لترقية مستخدم إلى رتبة مسؤول (Grant Admin Role)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.make_user_admin(target_email TEXT)
RETURNS void AS $$
DECLARE
  target_id UUID;
  user_name TEXT;
BEGIN
  SELECT id, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
  INTO target_id, user_name 
  FROM auth.users 
  WHERE email = target_email;

  IF target_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, name, role, membership_tier)
    VALUES (target_id, COALESCE(user_name, 'مدير النظام'), 'admin', 'مدير النظام')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin', membership_tier = 'مدير النظام';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- مرحلة 8: ميزات المجتمع، التقييمات، القوائم المختارة، والتحليلات (Phase 8 Tables)
-- ==============================================================================

-- 9. جدول نقاشات وتعليقات الكتب (Book Comments & Nested Replies)
CREATE TABLE IF NOT EXISTS public.book_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.book_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. جدول بلاغات التعليقات للرقابة والإشراف (Comment Reports for Moderation)
CREATE TABLE IF NOT EXISTS public.comment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.book_comments(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. جدول تقييمات الكتب بالنجوم (Book Ratings 1-5 Stars)
CREATE TABLE IF NOT EXISTS public.book_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_id, user_id)
);

-- 12. جدول قوائم القراءة المختارة (Curated Reading Lists by Admin)
CREATE TABLE IF NOT EXISTS public.reading_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    book_ids TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. جدول التحليلات والأثر الرقمي مجهول الهوية (Book Telemetry & Usage Analytics)
CREATE TABLE IF NOT EXISTS public.book_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'download')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل سياسات الأمان على الجداول الجديدة
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_analytics ENABLE ROW LEVEL SECURITY;

-- سياسات التعليقات (Comments Policies)
DROP POLICY IF EXISTS "Public Read Comments" ON public.book_comments;
CREATE POLICY "Public Read Comments" ON public.book_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Insert Comments" ON public.book_comments;
CREATE POLICY "Authenticated Insert Comments" ON public.book_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner Update Comments" ON public.book_comments;
CREATE POLICY "Owner Update Comments" ON public.book_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner Or Admin Delete Comments" ON public.book_comments;
CREATE POLICY "Owner Or Admin Delete Comments" ON public.book_comments FOR DELETE TO authenticated 
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- سياسات البلاغات (Reports Policies)
DROP POLICY IF EXISTS "Authenticated Insert Reports" ON public.comment_reports;
CREATE POLICY "Authenticated Insert Reports" ON public.comment_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admin Manage Reports" ON public.comment_reports;
CREATE POLICY "Admin Manage Reports" ON public.comment_reports FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- سياسات التقييمات (Ratings Policies)
DROP POLICY IF EXISTS "Public Read Ratings" ON public.book_ratings;
CREATE POLICY "Public Read Ratings" ON public.book_ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated Upsert Ratings" ON public.book_ratings;
CREATE POLICY "Authenticated Upsert Ratings" ON public.book_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated Update Ratings" ON public.book_ratings;
CREATE POLICY "Authenticated Update Ratings" ON public.book_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated Delete Ratings" ON public.book_ratings;
CREATE POLICY "Authenticated Delete Ratings" ON public.book_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- سياسات قوائم القراءة (Reading Lists Policies)
DROP POLICY IF EXISTS "Public Read Reading Lists" ON public.reading_lists;
CREATE POLICY "Public Read Reading Lists" ON public.reading_lists FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Reading Lists" ON public.reading_lists;
CREATE POLICY "Admin Manage Reading Lists" ON public.reading_lists FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- سياسات التحليلات (Analytics Policies)
DROP POLICY IF EXISTS "Public Insert Analytics" ON public.book_analytics;
CREATE POLICY "Public Insert Analytics" ON public.book_analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin Read Analytics" ON public.book_analytics;
CREATE POLICY "Admin Read Analytics" ON public.book_analytics FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

