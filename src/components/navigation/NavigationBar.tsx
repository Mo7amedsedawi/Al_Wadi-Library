import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { useRouter } from '../../context/RouterContext';
import { TopNavBar } from './TopNavBar';
import { BottomNavBar } from './BottomNavBar';
import { ViewType } from '../../types';

interface NavigationBarProps {
  isLoggedIn?: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ isLoggedIn = true }) => {
  const { currentRoute, navigateTo } = useRouter();
  const { theme, toggleTheme, downloads, favorites } = useLibrary();

  const handleNavigate = (view: ViewType) => {
    navigateTo(view);
  };

  const isDarkMode = theme === 'dark';
  const showBottomNav = currentRoute.view !== 'admin' && currentRoute.view !== 'not_found';

  return (
    <>
      <TopNavBar
        currentView={currentRoute.view as ViewType}
        onNavigate={handleNavigate}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        isLoggedIn={isLoggedIn}
        favoritesCount={favorites.length}
      />

      {showBottomNav && (
        <BottomNavBar
          currentView={currentRoute.view as ViewType}
          onNavigate={handleNavigate}
          favoritesCount={favorites.length}
        />
      )}
    </>
  );
};

export { TopNavBar, BottomNavBar };
