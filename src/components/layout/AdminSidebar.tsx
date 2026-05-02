'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceContext';
import { clearAdminSession } from '@/components/admin/adminAuth';
import { canAccessAdminPath, staffRoleLabel } from '@/lib/admin-rbac';
import { Icon } from '@/components/admin/ui/Icon';
import { Avatar } from '@/components/admin/ui/Avatar';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <Icon.Dashboard size={18} /> },
      { label: 'Analytics', href: '/admin/analytics', icon: <Icon.BarChart size={18} /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Posts', href: '/admin/posts', icon: <Icon.Posts size={18} /> },
      { label: 'New Post', href: '/admin/posts/new', icon: <Icon.Plus size={18} /> },
      { label: 'AI Writer', href: '/admin/ai-writer', icon: <Icon.Sparkles size={18} />, badge: 'AI' },
      { label: 'Translation', href: '/admin/translation', icon: <Icon.Globe size={18} /> },
      { label: 'SEO Center', href: '/admin/seo', icon: <Icon.Search size={18} /> },
      { label: 'Media', href: '/admin/media', icon: <Icon.Image size={18} /> },
      { label: 'Comments', href: '/admin/comments', icon: <Icon.Activity size={18} /> },
    ],
  },
  {
    label: 'Audience',
    items: [
      { label: 'Newsletter', href: '/admin/newsletter', icon: <Icon.Mail size={18} /> },
      { label: 'Messages', href: '/admin/messages', icon: <Icon.Megaphone size={18} /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users & Roles', href: '/admin/users', icon: <Icon.Users size={18} /> },
      { label: 'Settings', href: '/admin/settings', icon: <Icon.Settings size={18} /> },
      { label: 'Diagnostic', href: '/admin/diagnostic', icon: <Icon.CheckCircle size={18} /> },
    ],
  },
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
  userEmail?: string;
  userName?: string;
}

export default function AdminSidebar({
  className = '',
  onNavigate,
  userEmail = 'admin@phulpur24.com',
  userName = 'Admin',
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAdminWorkspace();

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) => canAccessAdminPath(role, item.href)),
        }))
        .filter((g) => g.items.length > 0),
    [role]
  );

  const allItems = visibleGroups.flatMap((g) => g.items);

  const activeHref =
    allItems
      .filter((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? '/admin/dashboard';

  const handleSignOut = () => {
    clearAdminSession();
    onNavigate?.();
    router.replace('/admin/login');
  };

  return (
    <aside
      className={`flex h-full w-64 flex-col bg-sidebar text-sidebar-text ${className}`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="group flex items-center gap-2.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-indigo-600 text-sm font-black text-white shadow-sm">
            P24
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">Phulpur24</p>
            <p className="text-[11px] text-sidebar-muted">Admin Console</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close menu"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-hover hover:text-white lg:hidden"
        >
          <Icon.Close size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeHref === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-sidebar-active text-white shadow-sm'
                            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center transition-colors ${
                            isActive ? 'text-white' : 'text-sidebar-muted group-hover:text-white'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge ? (
                          <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-soft">
                            {item.badge}
                          </span>
                        ) : null}
                        {isActive ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden="true" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/bn"
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs text-sidebar-text hover:border-white/20 hover:text-white"
        >
          <span className="inline-flex items-center gap-2">
            <Icon.ExternalLink size={14} />
            View public site
          </span>
          <Icon.ArrowRight size={12} />
        </Link>
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-hover/60 p-2.5">
          <Avatar name={userName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{userName}</p>
            <p className="truncate text-[10px] text-sidebar-muted">{userEmail}</p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-sidebar-muted/80">
              {staffRoleLabel(role)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-active hover:text-white"
          >
            <Icon.SignOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
