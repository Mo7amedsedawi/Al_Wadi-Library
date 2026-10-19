import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Send, Globe, ArrowRight, ExternalLink, MessageCircle, Code2, Sparkles } from 'lucide-react';

export const ContactScreen: React.FC = () => {
  const { navigateTo, goBack } = useRouter();

  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (history.length > 1 ? goBack() : navigateTo('home'))}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة</span>
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
          تواصل معنا
        </span>
      </div>

      {/* Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-surface)] text-[var(--brand-primary)] flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
          اتصل بنا
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
          نسعد دائماً بتواصلكم وملاحظاتكم واقتراحاتكم لتطوير مكتبة الوادي الرقمية وإثراء محتواها.
        </p>
      </div>

      {/* Official Destinations */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-primary)] px-1">
          قنوات التواصل الرسمية
        </h2>

        {/* 1. Telegram Channel */}
        <a
          href="https://t.me/wadistreambooks"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[64px] p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#229ED9]/60 hover:bg-[#229ED9]/5 transition-all flex items-center justify-between group block shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[#229ED9] transition-colors">
                  قناة تيليجرام (Telegram)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#229ED9]/10 text-[#229ED9]">
                  رسمي
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono block mt-0.5 dir-ltr text-start">
                https://t.me/wadistreambooks
              </span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#229ED9] shrink-0" />
        </a>

        {/* 2. Developer Portfolio */}
        <a
          href="https://mo7amedsedawi.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[64px] p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all flex items-center justify-between group block shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  موقع المطور الشخصي (Developer Portfolio)
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono block mt-0.5 dir-ltr text-start">
                https://mo7amedsedawi.github.io/
              </span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-[var(--text-muted)] group-hover:text-emerald-600 shrink-0" />
        </a>
      </div>
    </div>
  );
};
