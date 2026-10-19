-- ==============================================================================
-- مكتبة الوادي (Al-Wadi Library) - ترقية أمان تسجيل الدخول والصلاحيات الإدارية
-- Migration: 20261014_secure_roles_and_admin_rbac.sql
-- ==============================================================================

-- 1. التأكد من وجود جدول profiles والأعمدة المطلوبة
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    membership_tier TEXT DEFAULT 'عضو قارئ مميز',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. سياسة قراءة الملفات الشخصية العامة
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);

-- 3. سياسة تعديل الملف الشخصي: يمنع منعاً باتاً ترقية الدور role بواسطة المستخدم العادي
DROP POLICY IF EXISTS "Users Update Own Profile" ON public.profiles;
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  )
);

-- 4. تحديث دالة وتريغر تسجيل المستخدمين الجدد: كل مستخدم جديد يسجل برتبة 'user' فقط
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
    -- لا يسمح بتحديث الدور role عبر بيانات التسجيل الأولية
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. دالة آمنة ومعتمدة لمنح رتبة مسؤول (Admin) عبر البريد الإلكتروني (تشغيل بواسطة مدير قاعدة البيانات في SQL Editor)
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

-- 6. تشغيل الترقية للمسؤول الرئيسي mohamedsedawi05@gmail.com
SELECT public.make_user_admin('mohamedsedawi05@gmail.com');
