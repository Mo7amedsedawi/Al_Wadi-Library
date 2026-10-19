import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, 
  BookOpen, 
  Clock, 
  FileText, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Smartphone, 
  LogOut, 
  ChevronLeft,
  LogIn,
  UserPlus,
  Sparkles,
  Shield,
  Heart,
  BookPlus,
  MessageCircle,
  HeartHandshake
} from 'lucide-react';

interface ProfileScreenProps {
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { theme, toggleTheme, favorites, downloads } = useLibrary();
  const { navigateTo } = useRouter();
  const { user, isGuest, isAuthenticated, isAdmin, logout } = useAuth();

  const isDarkMode = theme === 'dark';

  const handleLogoutClick = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigateTo('home');
    }
  };

  const userInitial = user?.name ? user.name.trim().charAt(0) : 'ق';

  return (
    <div className="space-y-6 pb-16 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* 1. Profile Header Card */}
      {isGuest ? (
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-2xl font-black border border-[var(--border-subtle)]">
              زائر
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                  قارئ زائر (وضع التصفح الحر)
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-[var(--text-muted)]">
                  غير مسجل
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                تصفح الكتب وقراءة المقتطفات متاح للجميع دون الحاجة لتسجيل الدخول.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--brand-surface)] border border-[var(--brand-primary)]/20 mb-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <strong className="text-[var(--brand-primary)] block mb-1">
                  سجّل دخولك الآن واستفد من كامل مزايا مكتبة الوادي:
                </strong>
                مزامنة قائمتك المفضلة سحابياً عبر قاعدة بيانات Supabase، تحميل الكتب للقراءة دون اتصال، ومتابعة تقدمك القرائي.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('signup')}
              className="min-h-[44px] py-2.5 px-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[var(--brand-primary)] text-white flex items-center justify-center text-2xl font-black shadow-md border-2 border-white dark:border-stone-800">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <span 
              className={`absolute -bottom-1 -end-1 w-5 h-5 rounded-full border-2 border-[var(--bg-surface)] ${
                isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}
              title={isAdmin ? 'حساب مدير نظام' : 'حساب نشط'} 
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)] truncate">
                {user?.name}
              </h1>
              {isAdmin ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  مدير النظام (Admin)
                </span>
              ) : (
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 font-mono">
              {user?.email}
            </p>
            <div className="text-xs font-semibold text-[var(--brand-primary)] mt-1.5 flex items-center gap-1.5">
              <span>{user?.membershipTier || 'عضو موثق'}</span>
              <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
              <span className="text-[11px] text-[var(--text-muted)]">عضو منذ {user?.joinedDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Reading Favorites Summary */}
      <div>
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
          الكتب المحفوظة
        </h2>
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)] block">
                قائمة المفضلة الخاصة بك
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                الكتب التي قمت بحفظها للرجوع إليها سريعاً
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('favorites')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20 hover:bg-[var(--brand-primary)] hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span className="font-mono">{favorites.length}</span>
            <span>كتب</span>
          </button>
        </div>
      </div>

      {/* 3. Settings & Shortcuts */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">
          الإعدادات والتفضيلات
        </h2>

        {/* Theme Toggle Button */}
        <div className="min-h-[56px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)]">
              {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)] block">
                مظهر التطبيق
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {isDarkMode ? 'الوضع الليلي مفعّل' : 'الوضع النهاري مفعّل'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all active:scale-95"
          >
            {isDarkMode ? 'تفعيل النهاري' : 'تفعيل الليلي'}
          </button>
        </div>



        {/* Book Request Shortcut */}
        <button
          type="button"
          onClick={() => navigateTo('request-book')}
          className="w-full min-h-[56px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 flex items-center justify-between transition-all text-start active:scale-[0.99] shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)] block">
                طلب واقتراح كتاب (Book Request)
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                اقترح كتاباً غير متوفر لتتم إضافته للمكتبة
              </span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </button>

        {/* Contact Us Shortcut */}
        <button
          type="button"
          onClick={() => navigateTo('contact')}
          className="w-full min-h-[56px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#229ED9]/50 flex items-center justify-between transition-all text-start active:scale-[0.99] shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)] block">
                اتصل بنا (Contact Us)
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                قناة التيليجرام الرسمية وموقع المطور
              </span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </button>

        {/* Donate to Library Shortcut */}
        <button
          type="button"
          onClick={() => navigateTo('donate')}
          className="w-full min-h-[56px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-amber-500/50 flex items-center justify-between transition-all text-start active:scale-[0.99] shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-[var(--text-primary)] block">
                التبرع للمكتبة (Library Donations)
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                دعم استمرار وتطوير خوادم المكتبة ومحتواها
              </span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </button>

        {/* Administrator Switch (Visible to all, but shows badge for admin) */}
        <button
          type="button"
          onClick={() => navigateTo('admin')}
          className={`w-full min-h-[56px] p-4 rounded-2xl border flex items-center justify-between transition-all text-start active:scale-[0.99] ${
            isAdmin
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAdmin ? 'bg-emerald-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  لوحة تحكم المسؤول (Admin Dashboard)
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                    مسموح
                  </span>
                )}
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {isAdmin
                  ? 'إدارة الفهرس، إضافة مؤلفات، وربط Supabase'
                  : 'تتطلب تسجيل الدخول بحساب مدير نظام'}
              </span>
            </div>
          </div>
          <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
      </div>

      {/* Capacitor & Mobile App Info */}
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center gap-3 text-xs text-[var(--text-muted)]">
        <Smartphone className="w-5 h-5 text-[var(--text-secondary)] shrink-0" />
        <div className="flex-1">
          <span className="font-bold text-[var(--text-primary)] block">
            مكتبة الوادي - نظام المصادقة والحماية (Phase 5)
          </span>
          <span>Supabase Auth · تحكم بالصلاحيات (RBAC) · أمان على مستوى الصفوف (RLS)</span>
        </div>
      </div>

      {/* Logout Action (if logged in) */}
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full min-h-[44px] py-3 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/40 transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      )}
    </div>
  );
};
