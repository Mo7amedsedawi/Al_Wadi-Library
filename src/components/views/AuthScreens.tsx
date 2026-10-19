import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  HelpCircle,
  Loader2,
  CheckCircle2,
  Compass
} from 'lucide-react';

interface AuthScreensProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: (userData: { name: string; email: string }) => void;
  onCancel?: () => void;
}

export const AuthScreens: React.FC<AuthScreensProps> = ({
  initialMode = 'login',
  onSuccess,
  onCancel,
}) => {
  const { 
    login, 
    signup, 
    resetPassword, 
    continueAsGuest, 
    intendedAction,
    consumeIntendedAction 
  } = useAuth();
  const { navigateTo } = useRouter();
  const { showToast, toggleFavorite, downloadBook, books } = useLibrary();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);

  const handlePostAuthAction = (userName: string, userEmail: string) => {
    if (onSuccess) {
      onSuccess({ name: userName, email: userEmail });
    }

    const action = consumeIntendedAction();
    if (action) {
      if (action.type === 'favorite' && action.targetId) {
        toggleFavorite(action.targetId);
        showToast('تم تسجيل الدخول بنجاح', 'تمت إضافة الكتاب إلى مفضلتك تلقائياً', 'success');
        navigateTo('details', { bookId: action.targetId });
        return;
      }
      if (action.type === 'download' && action.book) {
        downloadBook(action.book);
        showToast('تم تسجيل الدخول بنجاح', 'بدأ تحميل الكتاب المطلوب الآن', 'success');
        navigateTo('details', { bookId: action.book.id });
        return;
      }
      if (action.type === 'admin') {
        navigateTo('admin');
        return;
      }
    }

    navigateTo('home');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    setError('');
    setSuccessInfo('');

    if (!email || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صالح');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        showToast('مرحباً بك!', 'تم تسجيل الدخول بنجاح إلى مكتبة الوادي.', 'success');
        handlePostAuthAction(email.split('@')[0], email);
      } else {
        setError(res.error || 'فشل تسجيل الدخول. تحقق من بياناتك.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    setError('');
    setSuccessInfo('');

    if (!name || !email || !password) {
      setError('يرجى ملء كافة الحقول (الاسم، البريد، كلمة المرور)');
      return;
    }

    if (!email.includes('@')) {
      setError('يرجى إدخال عنوان بريد إلكتروني صالح');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 خانات أو أحرف');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await signup(email, password, name);
      if (res.success) {
        if (res.needsEmailConfirmation) {
          showToast(
            'تم إنشاء الحساب بنجاح!',
            'تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني. يرجى تفقّد بريدك لتفعيل الحساب.',
            'info'
          );
          setSuccessInfo('تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى فتح الرسالة وتأكيد الحساب، ثم العودة لتسجيل الدخول.');
          setMode('login');
        } else {
          showToast('أهلاً بك في مكتبة الوادي!', 'تم إنشاء حسابك وتسجيل الدخول بنجاح كقارئ.', 'success');
          handlePostAuthAction(name, email);
        }
      } else {
        setError(res.error || 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    setError('');
    setSuccessInfo('');

    if (!email || !email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح لإرسال رابط الاستعادة');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const res = await resetPassword(email);
      if (res.success) {
        setSuccessInfo('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.');
      } else {
        setError(res.error || 'تعذر إرسال رابط الاستعادة.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleGuestClick = () => {
    continueAsGuest();
    showToast('وضع القارئ الزائر', 'يمكنك تصفح وقراءة مقتطفات كافة الكتب بكل حرية.', 'info');
    if (onCancel) {
      onCancel();
    } else {
      navigateTo('home');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 shadow-lg">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onCancel || (() => navigateTo('home'))}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمكتبة</span>
          </button>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            أمان Supabase Auth
          </span>
        </div>

        {/* Intended Action Notice Banner */}
        {intendedAction && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {intendedAction.type === 'favorite' && 'سجّل الدخول ليتم حفظ الكتاب في مفضلتك تلقائياً.'}
              {intendedAction.type === 'download' && 'سجّل الدخول لبدء تحميل الكتاب المختار فوراً.'}
              {intendedAction.type === 'admin' && 'مطلوب حساب مدير النظام للوصول إلى لوحة التحكم.'}
            </span>
          </div>
        )}

        {/* Logo and Brand Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            {mode === 'login' && 'تسجيل الدخول'}
            {mode === 'signup' && 'إنشاء حساب جديد'}
            {mode === 'forgot' && 'استعادة كلمة المرور'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            {mode === 'login' && 'مرحباً بك مجدداً في واحة القراءة والفكر العربي'}
            {mode === 'signup' && 'انضم إلى مجتمع قراء مكتبة الوادي واستمتع بمزامنة كتبك'}
            {mode === 'forgot' && 'أدخل بريدك الإلكتروني المسجل لنرسل لك رابط التعيين'}
          </p>
        </div>

        {/* Tabs for Login / Signup / Forgot */}
        {mode !== 'forgot' && (
          <div className="flex rounded-xl bg-[var(--bg-secondary)] p-1 mb-5 border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessInfo('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                mode === 'login'
                  ? 'bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccessInfo('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* Error and Success Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {successInfo && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 ps-4 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none transition-all dir-ltr text-end"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute inset-y-0 end-3.5 my-auto pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                  }}
                  className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full h-11 ps-10 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none transition-all dir-ltr text-end"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute inset-y-0 end-3.5 my-auto pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] absolute inset-y-0 start-1.5 my-auto"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--brand-primary)] border-[var(--border-subtle)] focus:ring-0"
                />
                <span className="text-xs text-[var(--text-muted)] font-medium">تذكر تسجيل دخولي</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] font-bold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ التحقق...</span>
                </>
              ) : (
                <span>دخول إلى المكتبة</span>
              )}
            </button>
          </form>
        )}

        {/* 2. SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سارة العتيبي"
                  required
                  className="w-full h-11 ps-4 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none transition-all"
                />
                <UserIcon className="w-4 h-4 text-[var(--text-muted)] absolute inset-y-0 end-3.5 my-auto pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 ps-4 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none transition-all dir-ltr text-end"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute inset-y-0 end-3.5 my-auto pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  autoComplete="new-password"
                  required
                  className="w-full h-11 ps-10 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none transition-all dir-ltr text-end"
                />
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute inset-y-0 end-3.5 my-auto pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] absolute inset-y-0 start-1.5 my-auto"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] font-bold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ إنشاء الحساب...</span>
                </>
              ) : (
                <span>إنشاء الحساب والانطلاق</span>
              )}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1.5">
                البريد الإلكتروني المسجل
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  required
                  className="w-full h-11 ps-4 pe-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] focus:border-[var(--brand-primary)] focus:bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] outline-none transition-all dir-ltr text-end"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute inset-y-0 end-3.5 my-auto pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] font-bold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ الإرسال...</span>
                </>
              ) : (
                <span>إرسال رابط إعادة التعيين</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessInfo('');
              }}
              className="w-full text-center text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] pt-1"
            >
              العودة إلى تسجيل الدخول
            </button>
          </form>
        )}

        {/* Zero-Friction Browsing: Guest Mode Action */}
        <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] space-y-3">
          <button
            type="button"
            onClick={handleGuestClick}
            className="w-full min-h-[44px] rounded-xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] font-bold text-xs transition-all border border-[var(--border-subtle)] flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>المتابعة كقارئ زائر (تصفح فوري دون قيود)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
