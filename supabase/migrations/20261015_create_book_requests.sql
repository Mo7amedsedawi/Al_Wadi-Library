-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - إنشاء جدول طلبات واقتراحات الكتب وسياسات RLS
-- Migration: 20261015_create_book_requests.sql
-- ==============================================================================

-- 1. إنشاء جدول طلبات الكتب book_requests
CREATE TABLE IF NOT EXISTS public.book_requests (
    id TEXT PRIMARY KEY,
    book_title TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'rejected')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إنشاء الفهارس لتسريع البحث والفرز
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON public.book_requests (status);
CREATE INDEX IF NOT EXISTS idx_book_requests_created_at ON public.book_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_requests_user ON public.book_requests (user_id);

-- 3. تفعيل أمان مستوى الصفوف (Row Level Security - RLS)
ALTER TABLE public.book_requests ENABLE ROW LEVEL SECURITY;

-- 4. سياسة الإدخال: يحق لأي زائر أو مستخدم مسجل إرسال طلب كتاب جديد
DROP POLICY IF EXISTS "Anyone Can Insert Book Requests" ON public.book_requests;
CREATE POLICY "Anyone Can Insert Book Requests" ON public.book_requests
    FOR INSERT 
    WITH CHECK (true);

-- 5. سياسة القراءة للمستخدمين العاديين: يمكن للمستخدم قراءة طلباته الخاصة
DROP POLICY IF EXISTS "Users Read Own Book Requests" ON public.book_requests;
CREATE POLICY "Users Read Own Book Requests" ON public.book_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- 6. سياسة كاملة لمديري النظام (Admins): يحق لمدير النظام قراءة، تعديل، وحذف كافة طلبات الكتب
DROP POLICY IF EXISTS "Admins Full Control Book Requests" ON public.book_requests;
CREATE POLICY "Admins Full Control Book Requests" ON public.book_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        OR (auth.jwt() ->> 'role' = 'admin')
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    );
