import React, { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useLibrary } from '../../context/LibraryContext';
import { 
  ArrowRight, 
  HeartHandshake, 
  Copy, 
  Check, 
  Smartphone, 
  Globe2, 
  ExternalLink, 
  AlertTriangle, 
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';

export const DonateScreen: React.FC = () => {
  const { navigateTo, goBack } = useRouter();
  const { showToast } = useLibrary();
  const [copiedNumber, setCopiedNumber] = useState(false);

  const etisalatCashNumber = '+201140312460';

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(etisalatCashNumber);
      setCopiedNumber(true);
      showToast('تم نسخ الرقم بنجاح', etisalatCashNumber, 'success');
      setTimeout(() => setCopiedNumber(false), 3000);
    } catch {
      showToast('تعذر النسخ التلقائي', etisalatCashNumber, 'info');
    }
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
          دعم المكتبة
        </span>
      </div>

      {/* Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
          <HeartHandshake className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
          التبرع للمكتبة
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-lg mx-auto leading-relaxed">
          مكتبة الوادي مشروع معرفي رقمي غير ربحي. مساهمتك الكريمة تساعدنا في تغطية تكاليف الخوادم وتوفير مزيد من الكتب القيّمة مجاناً للجميع.
        </p>
      </div>

      {/* Two Donation Choices */}
      <div className="space-y-4">
        {/* CHOICE 1: Inside Egypt (من داخل مصر) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                الخيار الأول: من داخل مصر
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                عبر محفظة اتصالات كاش (Etisalat Cash)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-start">
              <span className="text-xs text-[var(--text-muted)] block mb-1">
                رقم محفظة اتصالات كاش المعتمد:
              </span>
              <span className="text-lg font-black font-mono text-[var(--text-primary)] dir-ltr inline-block tracking-wider">
                {etisalatCashNumber}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyNumber}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 active:scale-95 shadow-xs ${
                copiedNumber
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
              }`}
            >
              {copiedNumber ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الرقم</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CHOICE 2: Outside Egypt (من خارج مصر) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                الخيار الثاني: من خارج مصر
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                عبر خدمة موني جرام (MoneyGram)
              </span>
            </div>
          </div>

          {/* MoneyGram Instructions */}
          <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
            <p>
              يمكنك التحويل بسهولة باستخدام تطبيق <strong>MoneyGram</strong> الرسمي باتباع الخطوات التالية:
            </p>

            <ul className="list-disc list-inside space-y-2 pr-1 text-[var(--text-primary)] font-medium">
              <li>
                <strong>لهواتف أندرويد (Android):</strong> يمكنك تحميل التطبيق الرسمي مباشرة من متجر Google Play عبر الرابط أدناه.
              </li>
              <li>
                <strong>لهواتف آيفون (iPhone):</strong> يرجى البحث في متجر App Store عن التطبيق الرسمي باسم <strong>"MoneyGram Money Transfers"</strong>.
              </li>
              <li>
                عند اختيار طريقة التحويل داخل التطبيق، اختر <strong>Mobile Wallet</strong> وحدد الدولة <strong>مصر (Egypt)</strong> فقط في حال كانت الخدمة مدعومة في بلدك للتطبيق.
              </li>
              <li>
                تأكد دائماً من مراجعة بيانات المستلم والرسوم المقررة للتحويل بدقة قبل تأكيد العملية.
              </li>
            </ul>

            {/* Android Link Button */}
            <div className="pt-2">
              <a
                href="https://play.google.com/store/apps/details?id=com.gpshopper.moneygram"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <span>تحميل تطبيق MoneyGram للأندرويد (Google Play)</span>
              </a>
            </div>

            {/* Advisory Note */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 mt-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                تنبيه: تحقق من دعم مزود الخدمة المحلي في دولتك للتحويل إلى المحافظ الإلكترونية بمصر ومراجعة رسوم التحويل قبل الإتمام.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
