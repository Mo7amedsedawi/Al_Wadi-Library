/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book, ViewType } from './types';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/Toast';
import { NavigationBar } from './components/navigation/NavigationBar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { NotFoundScreen } from './components/common/NotFoundScreen';

// Views
import { HomeScreen } from './components/views/HomeScreen';
import { BrowseScreen } from './components/views/BrowseScreen';
import { BookDetailsScreen } from './components/views/BookDetailsScreen';
import { FavoritesScreen } from './components/views/FavoritesScreen';
import { ProfileScreen } from './components/views/ProfileScreen';
import { AuthScreens } from './components/views/AuthScreens';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthorProfileScreen } from './components/views/AuthorProfileScreen';
import { SeriesScreen } from './components/views/SeriesScreen';
import { BookRequestScreen } from './components/views/BookRequestScreen';
import { ContactScreen } from './components/views/ContactScreen';
import { DonateScreen } from './components/views/DonateScreen';
import { ShieldAlert, ArrowRight, ShieldCheck, LogIn } from 'lucide-react';

// Admin Access Denied Screen Component
const AdminAccessDenied: React.FC<{ onGoHome: () => void; onLoginAdmin: () => void }> = ({
  onGoHome,
  onLoginAdmin,
}) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]" dir="rtl">
    <div className="max-w-md w-full bg-[var(--bg-surface)] border border-red-200 dark:border-red-900/60 rounded-3xl p-6 sm:p-8 text-center shadow-lg animate-in fade-in">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">
        لوحة التحكم محمية للمسؤولين فقط
      </h2>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
        عذراً، هذه المنطقة مخصصة لمدير النظام (Admin) لإدارة الفهرس، إضافة الكتب، وتحديث قواعد البيانات.
      </p>

      <div className="space-y-2.5">
        <button
          onClick={onLoginAdmin}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>تسجيل الدخول كمدير نظام (Admin)</span>
        </button>

        <button
          onClick={onGoHome}
          className="w-full h-11 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] font-bold text-xs transition-all border border-[var(--border-subtle)] flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لتصفح كتب المكتبة</span>
        </button>
      </div>
    </div>
  </div>
);

// Inner App Controller that consumes Router, Auth and Library Contexts
function AppContent() {
  const { toasts, dismissToast } = useLibrary();
  const { currentRoute, navigateTo } = useRouter();
  const { isAuthenticated, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigateTo('home');
  };

  // 1. Isolated Admin View with strict Role-Based Access Control (RBAC)
  if (currentRoute.view === 'admin') {
    if (!isAdmin) {
      return (
        <>
          <OfflineBanner />
          <ToastContainer toasts={toasts} onDismiss={dismissToast} />
          <AdminAccessDenied
            onGoHome={() => navigateTo('home')}
            onLoginAdmin={() => navigateTo('login')}
          />
        </>
      );
    }

    return (
      <>
        <OfflineBanner />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <AdminDashboard />
      </>
    );
  }

  // 2. Auth Views
  if (currentRoute.view === 'login' || currentRoute.view === 'signup') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased" dir="rtl">
        <OfflineBanner />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <AuthScreens
          initialMode={currentRoute.view}
          onCancel={() => navigateTo('home')}
        />
      </div>
    );
  }

  // 3. Main Library App Views (Public & Direct-Download Browsing)
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased transition-colors duration-200" dir="rtl">
      {/* Offline Status Top Banner */}
      <OfflineBanner />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Unified Navigation (Top + Bottom bars) */}
      <NavigationBar isLoggedIn={isAuthenticated} />

      {/* Main Content Router View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20 md:pb-8">
        {currentRoute.view === 'home' && (
          <HomeScreen />
        )}

        {currentRoute.view === 'browse' && (
          <BrowseScreen />
        )}

        {currentRoute.view === 'details' && (
          <BookDetailsScreen />
        )}

        {currentRoute.view === 'favorites' && (
          <FavoritesScreen />
        )}

        {currentRoute.view === 'profile' && (
          <ProfileScreen onLogout={handleLogout} />
        )}

        {currentRoute.view === 'author' && (
          <AuthorProfileScreen />
        )}

        {currentRoute.view === 'series' && (
          <SeriesScreen />
        )}

        {currentRoute.view === 'request-book' && (
          <BookRequestScreen />
        )}

        {currentRoute.view === 'contact' && (
          <ContactScreen />
        )}

        {currentRoute.view === 'donate' && (
          <DonateScreen />
        )}

        {currentRoute.view === 'downloads' && (
          <HomeScreen />
        )}

        {currentRoute.view === 'not_found' && (
          <NotFoundScreen onGoHome={() => navigateTo('home')} />
        )}
      </main>
    </div>
  );
}

// Root App with Providers & Error Boundary
export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AuthProvider>
          <LibraryProvider>
            <AppContent />
          </LibraryProvider>
        </AuthProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}
