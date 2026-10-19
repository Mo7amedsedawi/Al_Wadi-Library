/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="w-full bg-emerald-600 text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-sm transition-all duration-300 animate-in slide-in-from-top select-none z-50 sticky top-0"
        dir="rtl"
      >
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span className="font-bold">تمت استعادة الاتصال بالإنترنت بنجاح.</span>
      </div>
    );
  }

  return (
    <div 
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-600/95 dark:bg-amber-700/95 backdrop-blur-md text-white text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-sm transition-all duration-300 animate-in slide-in-from-top select-none z-50 sticky top-0 border-b border-amber-700/40"
      dir="rtl"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span className="font-semibold">
        أنت الآن في وضع عدم الاتصال. يتم عرض المكتبة المحفوظة ويمكنك فتح كتبك المحمّلة.
      </span>
    </div>
  );
};
