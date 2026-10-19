import React from 'react';
import { ViewType } from '../../types';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Search, ShieldCheck, Heart, Compass, Home, User, LogIn, BookPlus, MessageCircle, HeartHandshake } from 'lucide-react';

interface TopNavBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  favoritesCount: number;
  isLoggedIn?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentView,
  onNavigate,
  isDarkMode,
  onToggleTheme,
  favoritesCount,
}) => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const desktopLinks = [
    { id: 'home' as ViewType, label: 'الرئيسية', icon: Home },
    { id: 'browse' as ViewType, label: 'تصفح الكتب', icon: Compass },
    { id: 'favorites' as ViewType, label: 'المفضلة', icon: Heart, count: favoritesCount },
    { id: 'request-book' as ViewType, label: 'طلب كتاب', icon: BookPlus },
    { id: 'donate' as ViewType, label: 'دعم المكتبة', icon: HeartHandshake },
    { id: 'contact' as ViewType, label: 'اتصل بنا', icon: MessageCircle },
  ];

  const userInitial = user?.name ? user.name.trim().charAt(0) : 'ق';

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Right side in RTL: Logo & Tagline */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-start focus:outline-none"
            aria-label="الذهاب إلى الصفحة الرئيسية"
          >
            <Logo size="md" />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--brand-surface)] text-[var(--brand-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <link.icon className="w-4 h-4 stroke-[2]" />
                  <span>{link.label}</span>
                  {link.count !== undefined && link.count > 0 && (
                    <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[var(--brand-primary)] text-white font-bold">
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Left side in RTL: Quick Actions (Theme, Search, Admin Mode, Auth) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Shortcut */}
          <button
            onClick={() => onNavigate('browse')}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title="البحث في الكتب"
            aria-label="البحث في الكتب"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Dark/Light Mode Switcher */}
          <button
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            aria-label={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 hover:rotate-90 transition-transform" />
            ) : (
              <Moon className="w-5 h-5 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Admin Dashboard Switch Button */}
          {isAdmin ? (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border ${
                currentView === 'admin'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
              }`}
              title="الانتقال إلى لوحة تحكم المسؤول"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">لوحة التحكم (مسؤول)</span>
              <span className="sm:hidden">الإدارة</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all border bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-subtle)]"
              title="لوحة تحكم المسؤول (تتطلب حساب مدير)"
            >
              <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="hidden sm:inline">لوحة المسؤول</span>
            </button>
          )}

          {/* User Account / Profile Button */}
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 p-1.5 sm:pe-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] transition-all ${
                currentView === 'profile' ? 'bg-[var(--brand-surface)] border-[var(--brand-primary)]' : 'bg-[var(--bg-surface)]'
              }`}
              title="الملف الشخصي"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[var(--text-primary)] truncate max-w-[80px]">
                {user?.name?.split(' ')[0] || 'قارئ'}
              </span>
              {isAdmin && (
                <span className="hidden lg:inline text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black">
                  Admin
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>دخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
