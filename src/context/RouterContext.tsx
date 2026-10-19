import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ViewType } from '../types';

export interface RouteState {
  view: ViewType | 'not_found';
  params?: {
    bookId?: string;
    category?: string;
    [key: string]: any;
  };
}

interface RouterContextType {
  currentRoute: RouteState;
  navigateTo: (view: ViewType | 'not_found', params?: RouteState['params']) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read initial route from URL hash if available
  const getInitialRoute = (): RouteState => {
    try {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (!hash) return { view: 'home' };

      const [viewPart, paramPart] = hash.split('?');
      const validViews: ViewType[] = [
        'home', 'browse', 'details', 'favorites', 
        'profile', 'login', 'signup', 'admin', 'author', 'series',
        'request-book', 'contact', 'donate'
      ];

      if (validViews.includes(viewPart as ViewType)) {
        const params: Record<string, string> = {};
        if (paramPart) {
          const searchParams = new URLSearchParams(paramPart);
          searchParams.forEach((val, key) => {
            params[key] = val;
          });
        }
        return { view: viewPart as ViewType, params };
      }
    } catch (e) {
      console.warn('Failed to parse URL hash', e);
    }
    return { view: 'home' };
  };

  const [history, setHistory] = useState<RouteState[]>([getInitialRoute()]);
  const [currentRoute, setCurrentRoute] = useState<RouteState>(getInitialRoute());

  // Sync hash with route
  const updateHash = (route: RouteState) => {
    try {
      let hash = `#/${route.view}`;
      if (route.params && Object.keys(route.params).length > 0) {
        const sp = new URLSearchParams();
        Object.entries(route.params).forEach(([k, v]) => {
          if (v !== undefined) sp.set(k, String(v));
        });
        hash += `?${sp.toString()}`;
      }
      window.history.pushState(null, '', hash);
    } catch (e) {
      console.warn('Could not update history state', e);
    }
  };

  const navigateTo = useCallback((view: ViewType | 'not_found', params?: RouteState['params']) => {
    const nextRoute: RouteState = { view, params };
    setCurrentRoute(nextRoute);
    setHistory((prev) => [...prev, nextRoute]);
    updateHash(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // remove current
      const prevRoute = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentRoute(prevRoute);
      updateHash(prevRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigateTo('home');
    }
  }, [history, navigateTo]);

  // Handle browser popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      setCurrentRoute(route);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <RouterContext.Provider
      value={{
        currentRoute,
        navigateTo,
        goBack,
        canGoBack: history.length > 1,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};
