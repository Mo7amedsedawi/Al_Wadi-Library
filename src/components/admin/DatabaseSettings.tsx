import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { SCHEMA_SQL, PROMOTE_ADMIN_SQL } from '../../data/sqlScripts';
import { 
  Database, 
  Server, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  HardDrive,
  FileCheck
} from 'lucide-react';

export const DatabaseSettings: React.FC = () => {
  const { dbStatus, dataSource, isSyncing, checkConnection, refetchBooks, showToast } = useLibrary();
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  const copySqlSchema = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopiedSql('schema');
      showToast('تم نسخ كود SQL للمخطط (Schema)', 'الصقه في Supabase SQL Editor لتفعيل الجداول وRLS والأدوار.', 'success');
      setTimeout(() => setCopiedSql(null), 3000);
    } catch {
      showToast('تعذر النسخ التلقائي', 'يمكنك فتح ملف supabase/schema.sql يدوياً.', 'info');
    }
  };

  const copySqlSeed = async () => {
    try {
      const response = await fetch('/supabase/seed.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql('seed');
      showToast('تم نسخ كود إدراج البيانات الأولية (Seed)', 'الصقه في Supabase SQL Editor لملء الجداول.', 'success');
      setTimeout(() => setCopiedSql(null), 3000);
    } catch {
      showToast('تعذر النسخ', 'يرجى نسخ محتوى ملف supabase/seed.sql.', 'info');
    }
  };

  const copyPromoteAdminSql = async () => {
    try {
      await navigator.clipboard.writeText(PROMOTE_ADMIN_SQL);
      setCopiedSql('admin_promote');
      showToast('تم نسخ أمر ترقية مدير (Admin)', 'الصقه في Supabase SQL Editor مع استبدال البريد الإلكتروني.', 'success');
      setTimeout(() => setCopiedSql(null), 3000);
    } catch {
      showToast('تعذر النسخ', 'يرجى مراجعة التعليمات.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">إعدادات قاعدة البيانات والاتصال السحابي</h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
          مراقبة حالة الاتصال مع Supabase، فحص الجداول وحاويات التخزين، وتشغيل أوامر SQL لتأسيس البيئة السحابية.
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              dbStatus?.isConnected ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[var(--text-primary)]">حالة الاتصال مع Supabase</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  dbStatus?.isConnected
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                }`}>
                  {dbStatus?.isConnected ? 'متصل بنجاح ✓' : 'يعمل في وضع التخزين المحلي'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                المصدر النشط الحالي للبيانات: <strong className="text-[var(--text-primary)]">{dataSource === 'supabase' ? 'قاعدة بيانات Supabase السحابية' : 'البيانات المحلية (Local Fallback)'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => {
                checkConnection();
                refetchBooks();
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all flex items-center gap-2 shadow-xs active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[var(--brand-primary)]' : ''}`} />
              <span>إعادة فحص ومزامنة البيانات</span>
            </button>
          </div>
        </div>

        {/* Database Tables Verification Checklist */}
        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <p className="text-xs font-bold text-[var(--text-primary)] mb-3">الجداول المعمارية في قاعدة البيانات:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'books', name: 'books (الكتب)' },
              { id: 'authors', name: 'authors (المؤلفون)' },
              { id: 'categories', name: 'categories (التصنيفات)' },
              { id: 'book_formats', name: 'book_formats (الصيغ والملفات)' },
              { id: 'book_keywords', name: 'book_keywords (محرك البحث)' },
              { id: 'profiles', name: 'profiles (المستخدمون والأدوار)' },
              { id: 'user_favorites', name: 'user_favorites (المفضلة)' },
              { id: 'book_requests', name: 'book_requests (طلبات الكتب)' },
              { id: 'book_comments', name: 'book_comments (نقاشات القراء)' },
            ].map((tbl) => {
              const isFound = Boolean(dbStatus?.tablesFound[tbl.id]);
              return (
                <div
                  key={tbl.id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                    isFound
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  {isFound ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate">{tbl.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Storage Buckets Checklist */}
        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <p className="text-xs font-bold text-[var(--text-primary)] mb-3">حاويات التخزين السحابي (Supabase Storage Buckets):</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'book-covers', name: 'book-covers (صور وأغلفة الكتب)', isFound: Boolean(dbStatus?.bucketsFound?.['book-covers']) },
              { id: 'book-files', name: 'book-files (ملفات الكتب PDF و EPUB)', isFound: Boolean(dbStatus?.bucketsFound?.['book-files']) },
            ].map((bucket) => (
              <div
                key={bucket.id}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                  bucket.isFound
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                }`}
              >
                <HardDrive className={`w-4 h-4 ${bucket.isFound ? 'text-emerald-500' : 'text-amber-500'} shrink-0`} />
                <span className="truncate">{bucket.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Snippets & Copy Controls */}
      <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-black text-[var(--text-primary)]">
            أوامر SQL لتأسيس الجداول في Supabase
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            إذا كانت الجداول غير منشأة بعد في مشروعك الخارجي، يمكنك نسخ الأكواد أدناه ولصقها في <strong>SQL Editor</strong> داخل لوحة تحكم Supabase لتأسيس الجداول والفهارس وسياسات الأمان وحاويات التخزين فوراً.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copySqlSchema}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] transition-all flex items-center gap-2 shadow-xs active:scale-95"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedSql === 'schema' ? 'تم نسخ المخطط (Schema) ✓' : 'نسخ كود SQL للجداول (Schema)'}</span>
          </button>

          <button
            type="button"
            onClick={copySqlSeed}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] transition-all flex items-center gap-2 border border-[var(--border-subtle)] active:scale-95"
          >
            <Copy className="w-4 h-4" />
            <span>{copiedSql === 'seed' ? 'تم نسخ بيانات البذور (Seed) ✓' : 'نسخ كود إدراج البيانات الأولية (Seed)'}</span>
          </button>

          <button
            type="button"
            onClick={copyPromoteAdminSql}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2 shadow-xs active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{copiedSql === 'admin_promote' ? 'تم نسخ أمر الترقية ✓' : 'نسخ أمر ترقية مسؤول (Grant Admin)'}</span>
          </button>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-secondary)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] transition-all flex items-center gap-1.5 border border-[var(--border-subtle)] inline-flex items-center"
          >
            <span>فتح لوحة تحكم Supabase</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
