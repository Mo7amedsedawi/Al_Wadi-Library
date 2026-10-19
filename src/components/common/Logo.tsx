import React, { useState } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  showSubtitle = true, 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);

  // Exact sizes calibrated for responsive mobile and desktop headers
  const imageSizes = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg sm:text-xl font-black tracking-tight',
    lg: 'text-2xl sm:text-3xl font-black tracking-tight',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Original Logo Image with object-fit: contain preserving aspect ratio & colors */}
      <div className={`${imageSizes[size]} shrink-0 flex items-center justify-center relative rounded-xl overflow-hidden bg-transparent`}>
        {!imageError ? (
          <img
            src="/images/logo.png"
            alt="شعار مكتبة الوادي"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src="/icon.svg"
            alt="شعار مكتبة الوادي"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="flex flex-col leading-tight">
        <span 
          className={`${titleSizes[size]} font-cairo text-[var(--text-primary)]`}
          style={{ letterSpacing: '-0.02em' }}
        >
          مكتبة الوادي
        </span>
        {showSubtitle && (
          <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium -mt-0.5">
            واحة القراءة والمعرفة
          </span>
        )}
      </div>
    </div>
  );
};
