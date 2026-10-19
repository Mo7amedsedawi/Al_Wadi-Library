import React from 'react';
import { ViewType } from '../../types';
import { Home, Compass, Heart, User } from 'lucide-react';

interface BottomNavBarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  favoritesCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentView,
  onNavigate,
  favoritesCount,
}) => {
  const navItems = [
    {
      id: 'home' as ViewType,
      label: 'الرئيسية',
      icon: Home,
    },
    {
      id: 'browse' as ViewType,
      label: 'تصفح',
      icon: Compass,
    },
    {
      id: 'favorites' as ViewType,
      label: 'المفضلة',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'profile' as ViewType,
      label: 'حسابي',
      icon: User,
    },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-lg border-t border-[var(--border-subtle)] safe-area-bottom shadow-lg"
      aria-label="شريط التنقل السفلي"
    >
      <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center h-full min-h-[44px] transition-colors py-1 group ${
                isActive
                  ? 'text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -end-2 min-w-4 h-4 px-1 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span 
                className={`text-[11px] mt-1 transition-all ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span 
                  className="absolute bottom-1 w-5 h-1 rounded-full bg-[var(--brand-primary)]"
                  aria-hidden="true" 
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
