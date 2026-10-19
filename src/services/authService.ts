import { supabase, isSupabaseConfigured, supabaseUrl } from './supabaseClient';
import { UserProfile, UserRole } from '../types';

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  error?: string;
  needsEmailConfirmation?: boolean;
}

/**
 * Translates Supabase authentication error messages to friendly, clear Arabic,
 * strictly distinguishing between:
 * 1. Email Send Rate Limits (Supabase built-in SMTP quota on /signup, /recover)
 * 2. Request Rate Limits (IP/token throttling on /token)
 * 3. Invalid credentials
 * 4. Unconfirmed email
 * 5. Network/connection failures
 */
export function translateAuthError(error: any): string {
  if (!error) return 'حدث خطأ غير متوقع أثناء المصادقة.';
  const msg = typeof error === 'string' ? error : error.message || '';
  const status = error?.status;
  const code = String(error?.code || '').toLowerCase();
  const lowerMsg = msg.toLowerCase();

  // 1. Email Send Rate Limit (Supabase built-in free-tier SMTP quota)
  if (
    code === 'over_email_send_rate_limit' ||
    code === 'email_rate_limit_exceeded' ||
    lowerMsg.includes('email rate limit exceeded') ||
    lowerMsg.includes('over_email_send_rate_limit') ||
    lowerMsg.includes('email send rate limit')
  ) {
    return 'تم تجاوز الحد المسموح لإرسال رسائل التأكيد بالبريد الإلكتروني مؤقتاً في خادم Supabase. يرجى الانتظار بضع دقائق قبل المحاولة، أو تسجيل الدخول مباشرة إذا كان حسابك مسجلاً بالفعل.';
  }

  // 2. Request / Token Rate Limit (Endpoint request throttling / IP limit)
  if (
    code === 'over_request_rate_limit' ||
    code === 'too_many_requests' ||
    (status === 429 && !lowerMsg.includes('email')) ||
    lowerMsg.includes('too many requests') ||
    lowerMsg.includes('for security purposes, you can only request this once every')
  ) {
    return 'تم تجاوز الحد المسموح لمحاولات تسجيل الدخول من هذا الاتصال مؤقتاً. يرجى الانتظار دقيقة واحدة ثم إعادة المحاولة.';
  }

  // 3. Invalid credentials (Wrong password or wrong email)
  if (
    code === 'invalid_credentials' ||
    lowerMsg.includes('invalid login credentials') ||
    (status === 400 && lowerMsg.includes('invalid') && !lowerMsg.includes('email'))
  ) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  // 4. Email not confirmed
  if (
    code === 'email_not_confirmed' ||
    lowerMsg.includes('email not confirmed')
  ) {
    return 'الحساب مسجل، ولكن يجب تأكيد وتفعيل بريدك الإلكتروني أولاً من خلال رابط التفعيل المرسل إلى بريدك.';
  }

  // 5. User already registered
  if (
    code === 'user_already_exists' ||
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('already exists')
  ) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.';
  }

  // 6. Weak password
  if (
    code === 'weak_password' ||
    lowerMsg.includes('password should be at least') ||
    lowerMsg.includes('weak_password')
  ) {
    return 'كلمة المرور يجب أن تتكون من 6 خانات أو أحرف على الأقل.';
  }

  // 7. Network / connection errors
  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('network request failed')
  ) {
    return 'تعذر الاتصال بخادم Supabase بسبب مشكلة في الشبكة أو انقطاع الإنترنت.';
  }

  return msg || 'فشلت عملية المصادقة. يرجى التحقق من البيانات المدخلة.';
}

/**
 * Maps Supabase User and trusted DB Profile record to our frontend UserProfile.
 * CRITICAL SECURITY: The 'admin' role MUST ONLY come from a verified record
 * in public.profiles table where role === 'admin'.
 * It CANNOT be inferred from email prefixes, user_metadata, or client choices.
 */
export function mapSupabaseUserToProfile(sbUser: any, profileRecord?: any): UserProfile {
  const metadata = sbUser?.user_metadata || {};
  const email = sbUser?.email || '';

  // Role is 'admin' ONLY if explicitly set in public.profiles database table
  const role: UserRole = profileRecord?.role === 'admin' ? 'admin' : 'user';

  return {
    id: sbUser?.id,
    name: profileRecord?.name || metadata.name || (email ? email.split('@')[0] : 'قارئ الوادي'),
    email,
    role,
    isGuest: false,
    membershipTier: role === 'admin' 
      ? 'مدير النظام' 
      : (profileRecord?.membership_tier || 'عضو قارئ مميز'),
    joinedDate: new Date(sbUser?.created_at || Date.now()).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
    }),
    booksReadCount: 0,
    hoursRead: 0,
    pagesRead: 0,
    avatarUrl: profileRecord?.avatar_url || metadata.avatar_url || undefined,
  };
}

/**
 * Sign in using Supabase Auth Email and Password with clear diagnostic logging
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const requestTimestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    console.error(`[Supabase Auth ${requestTimestamp}] Sign-in aborted: client is not configured with valid URL/keys.`, {
      url: supabaseUrl,
    });
    return {
      success: false,
      error: 'إعدادات الاتصال بـ Supabase غير متوفرة في بيئة التشغيل. يرجى مراجعة ملف .env.',
    };
  }

  const cleanEmail = email.trim();
  if (!cleanEmail || !password) {
    return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
  }

  console.info(`[Supabase Auth ${requestTimestamp}] POST /auth/v1/token?grant_type=password dispatched:`, {
    emailDomain: cleanEmail.split('@')[1] ? `@${cleanEmail.split('@')[1]}` : 'invalid',
    endpoint: `${supabaseUrl}/auth/v1/token`,
  });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      console.warn(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/token returned error:`, {
        status: error.status,
        code: error.code,
        name: error.name,
        message: error.message,
      });
      return { success: false, error: translateAuthError(error) };
    }

    if (!data.user) {
      console.warn(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/token succeeded but returned null user.`);
      return { success: false, error: 'لم يتم العثور على بيانات المستخدم.' };
    }

    console.info(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/token 200 OK. User authenticated:`, {
      userId: data.user.id,
      emailConfirmed: Boolean(data.user.email_confirmed_at),
    });

    // Securely query verified role from public.profiles table
    let profileRecord: any = null;
    try {
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!pError && pData) {
        profileRecord = pData;
      }
    } catch (profileErr) {
      console.warn('[Supabase Auth] Could not query profiles table for verified role:', profileErr);
    }

    return {
      success: true,
      user: mapSupabaseUserToProfile(data.user, profileRecord),
    };
  } catch (err: any) {
    console.error(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/token unexpected exception:`, {
      name: err?.name,
      message: err?.message,
    });
    return { success: false, error: translateAuthError(err) };
  }
}

/**
 * Sign up new user with Supabase Auth as a Reader ('user').
 * SECURITY: All public signups are strictly registered with role 'user'.
 * Admin privileges cannot be requested or self-assigned via the interface.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const requestTimestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    console.error(`[Supabase Auth ${requestTimestamp}] Sign-up aborted: client is not configured with valid URL/keys.`, {
      url: supabaseUrl,
    });
    return {
      success: false,
      error: 'إعدادات الاتصال بـ Supabase غير متوفرة في بيئة التشغيل. يرجى مراجعة ملف .env.',
    };
  }

  const cleanEmail = email.trim();
  const cleanName = name.trim();

  if (!cleanEmail || !password || !cleanName) {
    return { success: false, error: 'يرجى إدخال كافة البيانات المطلوبة (الاسم، البريد، كلمة المرور).' };
  }

  if (password.length < 6) {
    return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 6 خانات.' };
  }

  console.info(`[Supabase Auth ${requestTimestamp}] POST /auth/v1/signup dispatched:`, {
    emailDomain: cleanEmail.split('@')[1] ? `@${cleanEmail.split('@')[1]}` : 'invalid',
    endpoint: `${supabaseUrl}/auth/v1/signup`,
  });

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: cleanName,
          role: 'user', // strictly 'user'
        },
      },
    });

    if (error) {
      console.warn(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/signup returned error:`, {
        status: error.status,
        code: error.code,
        name: error.name,
        message: error.message,
      });
      return { success: false, error: translateAuthError(error) };
    }

    if (!data.user) {
      return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب.' };
    }

    console.info(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/signup 200 OK:`, {
      userId: data.user.id,
      sessionCreated: Boolean(data.session),
    });

    // Check if Supabase requires email confirmation before starting a session
    const needsEmailConfirmation = !data.session;

    // Create or sync the user profile with strictly role: 'user'
    let profileRecord: any = null;
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: cleanName,
          role: 'user', // NEVER allow admin on signup
          membership_tier: 'عضو قارئ جديد',
        })
        .select()
        .maybeSingle();

      if (pData) {
        profileRecord = pData;
      }
    } catch (profileErr) {
      console.warn('[Supabase Auth] Profiles table sync skipped or handled by database trigger:', profileErr);
    }

    return {
      success: true,
      user: mapSupabaseUserToProfile(data.user, profileRecord),
      needsEmailConfirmation,
    };
  } catch (err: any) {
    console.error(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/signup unexpected exception:`, {
      name: err?.name,
      message: err?.message,
    });
    return { success: false, error: translateAuthError(err) };
  }
}

/**
 * Request password reset email from Supabase Auth
 */
export async function sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const requestTimestamp = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'خدمة Supabase غير مهيأة.' };
  }

  console.info(`[Supabase Auth ${requestTimestamp}] POST /auth/v1/recover dispatched:`, {
    endpoint: `${supabaseUrl}/auth/v1/recover`,
  });

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) {
      console.warn(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/recover returned error:`, {
        status: error.status,
        code: error.code,
        message: error.message,
      });
      return { success: false, error: translateAuthError(error) };
    }
    return { success: true };
  } catch (err: any) {
    console.error(`[Supabase Auth ${new Date().toISOString()}] POST /auth/v1/recover exception:`, err);
    return { success: false, error: translateAuthError(err) };
  }
}

/**
 * Sign out user from Supabase session
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[Supabase Auth] signOut error:', error);
      return { success: false, error: translateAuthError(error) };
    }
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase Auth] signOut exception:', err);
    return { success: false, error: translateAuthError(err) };
  }
}

/**
 * Get current authenticated user session and verify role from database
 */
export async function getCurrentUserSession(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      return null;
    }

    // Always fetch profile directly from database to get the real verified role
    let profileRecord: any = null;
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      profileRecord = pData;
    } catch (err) {
      console.warn('[Supabase Auth] Failed to retrieve profile record from database:', err);
    }

    return mapSupabaseUserToProfile(session.user, profileRecord);
  } catch (err) {
    console.warn('[Supabase Auth] Failed to retrieve Supabase session:', err);
    return null;
  }
}
