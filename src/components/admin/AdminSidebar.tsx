import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  Users, 
  Tags, 
  Database, 
  ArrowLeft, 
  ShieldCheck, 
  X,
  Library,
  BookMarked,
  ShieldAlert,
  BookPlus
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

export type AdminTab = 
  | 'overview' 
  | 'books' 
  | 'book_form' 
  | 'book_requests'
  | 'authors' 
  | 'categories' 
  | 'reading_lists' 
  | 'moderation' 
  | 'database';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onExitAdmin: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  onExitAdmin,
}) => {
  const { user } = useAuth();

  const navItems: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'لوحة التحكم والتحليلات', icon: LayoutDashboard },
    { id: 'books', label: 'إدارة الكتب والمحتوى', icon: BookOpen },
    { id: 'book_form', label: 'إضافة كتاب جديد', icon: PlusCircle },
    { id: 'book_requests', label: 'طلبات واقتراحات الكتب', icon: BookPlus },
    { id: 'reading_lists', label: 'قوائم القراءة المختارة', icon: BookMarked },
    { id: 'moderation', label: 'إدارة البلاغات والإشراف', icon: ShieldAlert },
    { id: 'authors', label: 'دليل المؤلفين', icon: Users },
    { id: 'categories', label: 'أقسام وتصنيفات المكتبة', icon: Tags },
    { id: 'database', label: 'قاعدة البيانات وSupabase', icon: Database },
  ];

  const handleNavClick = (tab: AdminTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 w-72 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-[var(--text-primary)]">مكتبة الوادي</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  CMS
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">لوحة الإدارة والتحكم</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-[var(--text-muted)] tracking-wider">
            القائمة الرئيسية
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Card & Exit Button */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] font-black flex items-center justify-center text-sm border border-[var(--brand-primary)]/30 shrink-0">
              {user?.name?.[0] || 'م'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">{user?.name || 'مدير النظام'}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email || 'admin@alwadi.app'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitAdmin}
            className="w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Library className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>العودة للمكتبة العامة</span>
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--text-muted)] mr-auto" />
          </button>
        </div>
      </aside>
    </>
  );
};
