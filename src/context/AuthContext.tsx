import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, Book } from '../types';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOut as apiSignOut, 
  getCurrentUserSession, 
  sendPasswordResetEmail,
  mapSupabaseUserToProfile 
} from '../services/authService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export interface IntendedAction {
  type: 'favorite' | 'download' | 'admin' | 'navigate';
  targetId?: string;
  book?: Book;
  label?: string;
  destinationView?: string;
}

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAdmin: boolean;
  isLoadingAuth: boolean;
  intendedAction: IntendedAction | null;
  setIntendedAction: (action: IntendedAction | null) => void;
  // Auth Operations
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile>) => void;
  // Protected Guard
  checkProtectedAction: (action: IntendedAction, onBlockedToast: (msg: string) => void) => boolean;
  consumeIntendedAction: () => IntendedAction | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_PROFILE: UserProfile = {
  name: 'قارئ زائر',
  email: 'guest@alwadi.app',
  role: 'guest',
  isGuest: true,
  membershipTier: 'تصفح كزائر',
  joinedDate: 'اليوم',
  booksReadCount: 0,
  hoursRead: 0,
  pagesRead: 0,
};

const STORAGE_KEYS = {
  SAVED_USER: 'alwadi_auth_user',
  INTENDED_ACTION: 'alwadi_intended_action',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // STRICT SECURITY: Never blindly trust cached admin role from localStorage.
        // It must be verified from Supabase DB session during initSession.
        if (parsed && parsed.role === 'admin') {
          parsed.role = 'user';
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return null; // Initial state is guest (null user)
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [intendedAction, setIntendedActionState] = useState<IntendedAction | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTENDED_ACTION);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const setIntendedAction = (action: IntendedAction | null) => {
    setIntendedActionState(action);
    try {
      if (action) {
        localStorage.setItem(STORAGE_KEYS.INTENDED_ACTION, JSON.stringify(action));
      } else {
        localStorage.removeItem(STORAGE_KEYS.INTENDED_ACTION);
      }
    } catch {}
  };

  const consumeIntendedAction = (): IntendedAction | null => {
    const action = intendedAction;
    setIntendedAction(null);
    return action;
  };

  // Sync session with Supabase on mount via authoritative onAuthStateChange
  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured()) {
      setIsLoadingAuth(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.info(`[Supabase Auth ${new Date().toISOString()}] onAuthStateChange event: ${event}`, {
        hasSession: Boolean(session),
        userId: session?.user?.id,
      });

      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        let profileRecord: any = null;
        try {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          profileRecord = pData;
        } catch (err) {
          console.warn('[Supabase Auth] Could not verify profile from database:', err);
        }

        const profile = mapSupabaseUserToProfile(session.user, profileRecord);
        setUser(profile);
        try {
          localStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(profile));
        } catch {}
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        try {
          localStorage.removeItem(STORAGE_KEYS.SAVED_USER);
        } catch {}
      }

      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoadingAuth(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.success && result.user) {
        setUser(result.user);
        try {
          localStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(result.user));
        } catch {}
        return { success: true };
      }
      return { success: false, error: result.error || 'فشل تسجيل الدخول' };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    name: string
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    setIsLoadingAuth(true);
    try {
      const result = await signUpWithEmail(email, password, name);
      if (result.success && result.user) {
        if (!result.needsEmailConfirmation) {
          setUser(result.user);
          try {
            localStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(result.user));
          } catch {}
        }
        return { success: true, needsEmailConfirmation: result.needsEmailConfirmation };
      }
      return { success: false, error: result.error || 'فشل إنشاء الحساب' };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    try {
      await apiSignOut();
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.SAVED_USER);
      localStorage.removeItem(STORAGE_KEYS.INTENDED_ACTION);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const continueAsGuest = () => {
    setUser(null); // Guest mode
    localStorage.removeItem(STORAGE_KEYS.SAVED_USER);
  };

  const resetPassword = async (email: string) => {
    return await sendPasswordResetEmail(email);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      // Do not allow client code to elevate role to admin via updateProfile
      const { role: forbiddenRole, ...safeData } = data;
      const updated = { ...prev, ...safeData };
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_USER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  /**
   * Protected Guard:
   * Checks if user has permission. If user is guest/unauthenticated,
   * intercepts action, saves intended destination, displays friendly Arabic toast,
   * and returns false.
   */
  const checkProtectedAction = useCallback((
    action: IntendedAction, 
    onBlockedToast: (msg: string) => void
  ): boolean => {
    if (user && !user.isGuest) {
      // Check admin restriction if action is admin
      if (action.type === 'admin' && user.role !== 'admin') {
        onBlockedToast('غير مصرح لك بالوصول: هذه اللوحة مخصصة لمدير النظام فقط.');
        return false;
      }
      return true;
    }

    // User is guest -> Intercept and save intended action
    setIntendedAction(action);
    let msg = 'يرجى تسجيل الدخول أولاً للمتابعة.';
    if (action.type === 'favorite') {
      msg = 'يرجى تسجيل الدخول لحفظ الكتب في قائمتك المفضلة والمزامنة السحابية.';
    } else if (action.type === 'download') {
      msg = 'يرجى تسجيل الدخول لتحميل الكتب للقراءة دون اتصال بالإنترنت.';
    } else if (action.type === 'admin') {
      msg = 'يرجى تسجيل الدخول بحساب مدير النظام للوصول إلى لوحة التحكم.';
    }

    onBlockedToast(msg);
    return false;
  }, [user]);

  const isAuthenticated = Boolean(user && !user.isGuest);
  const isGuest = !isAuthenticated;
  const role: UserRole = user?.role || 'guest';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user: user || GUEST_PROFILE,
        role,
        isAuthenticated,
        isGuest,
        isAdmin,
        isLoadingAuth,
        intendedAction,
        setIntendedAction,
        login,
        signup,
        logout,
        continueAsGuest,
        resetPassword,
        updateProfile,
        checkProtectedAction,
        consumeIntendedAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
