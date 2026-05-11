'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceContext';
import { clearAdminSession } from '@/components/admin/adminAuth';
import { canAccessAdminPath, staffRoleLabel } from '@/lib/admin-rbac';
import { Avatar } from '@/components/admin/ui/Avatar';
import { Icon } from '@/components/admin/ui/Icon';
import SearchModal from '@/components/common/SearchModal';
import type { SearchQuickLink } from '@/components/common/SearchModal';
import { getSiteConfig } from '@/lib/site-config';

interface AdminTopbarProps {
  title: string;
  onMenuClick?: () => void;
  userEmail?: string;
  userName?: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  href?: string;
  time: string;
  tone: 'info' | 'warning' | 'accent';
}

const seedNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Review content queue',
    body: 'Open posts to review pending and draft stories',
    time: 'Open now',
    tone: 'info',
    href: '/admin/posts',
  },
  {
    id: 'n2',
    title: 'Continue translations',
    body: 'Check missing or partial BN-EN article translations',
    time: 'Open now',
    tone: 'accent',
    href: '/admin/translation',
  },
  {
    id: 'n3',
    title: 'Run SEO review',
    body: 'Audit metadata quality before publishing updates',
    time: 'Open now',
    tone: 'warning',
    href: '/admin/seo',
  },
];

export default function AdminTopbar({
  title,
  onMenuClick,
  userEmail = 'admin@phulpur24.com',
  userName = 'Admin',
}: AdminTopbarProps) {
  const router = useRouter();
  const { role } = useAdminWorkspace();
  const visibleNotifications = useMemo(
    () =>
      seedNotifications.filter(
        (n) => !n.href || canAccessAdminPath(role, n.href)
      ),
    [role]
  );
  const searchQuickLinks = useMemo<SearchQuickLink[]>(
    () =>
      [
        { id: 'dashboard', title: 'Dashboard', subtitle: 'Stats, traffic, quick actions', href: '/admin/dashboard', keywords: ['overview', 'home', 'stats'] },
        { id: 'analytics', title: 'Analytics', subtitle: 'Performance and referral trends', href: '/admin/analytics', keywords: ['traffic', 'views', 'sources'] },
        { id: 'posts', title: 'Posts', subtitle: 'Browse and manage all articles', href: '/admin/posts', keywords: ['articles', 'drafts', 'published'] },
        { id: 'new-post', title: 'Create Post', subtitle: 'Start a new article draft', href: '/admin/posts/new', keywords: ['new', 'write', 'editor'] },
        { id: 'ai-writer', title: 'AI Writer', subtitle: 'Generate structured first drafts', href: '/admin/ai-writer', keywords: ['ai', 'draft', 'outline'] },
        { id: 'translation', title: 'Translation', subtitle: 'Manage BN-EN translation queue', href: '/admin/translation', keywords: ['bangla', 'english', 'translate'] },
        { id: 'seo', title: 'SEO Center', subtitle: 'Fix metadata and SEO scoring', href: '/admin/seo', keywords: ['meta', 'keyword', 'score'] },
        { id: 'media', title: 'Media Library', subtitle: 'Upload and organize images', href: '/admin/media', keywords: ['assets', 'image', 'upload'] },
        { id: 'comments', title: 'Comments', subtitle: 'Moderate reader conversations', href: '/admin/comments', keywords: ['moderation', 'spam', 'approve'] },
        { id: 'newsletter', title: 'Newsletter', subtitle: 'Subscribers and export', href: '/admin/newsletter', keywords: ['subscribers', 'email', 'csv'] },
        { id: 'messages', title: 'Messages', subtitle: 'Reader contact inbox', href: '/admin/messages', keywords: ['inbox', 'contact', 'support'] },
        { id: 'users', title: 'Users & Roles', subtitle: 'Team members and permissions', href: '/admin/users', keywords: ['team', 'role', 'access'] },
        { id: 'profile', title: 'My Profile', subtitle: 'Account, security, and preferences', href: '/admin/profile', keywords: ['account', 'profile', 'password'] },
        { id: 'settings', title: 'Settings', subtitle: 'Branding and feature controls', href: '/admin/settings', keywords: ['site config', 'features', 'social'] },
      ].filter((item) => canAccessAdminPath(role, item.href)),
    [role]
  );
  const canOpenSettings = canAccessAdminPath(role, '/admin/settings');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [defaultLang, setDefaultLang] = useState<'bn' | 'en'>('bn');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const unreadCount = visibleNotifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  // Cmd/Ctrl+K opens the search modal from any admin page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    try {
      setDefaultLang(getSiteConfig().defaultLanguage);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', escape);
    };
  }, []);

  const handleSignOut = () => {
    clearAdminSession();
    router.replace('/admin/login');
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllNotificationsRead = () => {
    setReadNotificationIds((prev) => {
      const merged = new Set(prev);
      visibleNotifications.forEach((n) => merged.add(n.id));
      return [...merged];
    });
  };

  return (
    <>
    <SearchModal
      isOpen={searchOpen}
      onClose={() => setSearchOpen(false)}
      lang={defaultLang}
      scope="admin"
      quickLinks={searchQuickLinks}
    />
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/85 px-3 backdrop-blur-md sm:px-5 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-app hover:text-ink lg:hidden"
        >
          <Icon.Menu size={18} />
        </button>
        <div className="min-w-0">
          <p className="hidden text-[11px] font-medium uppercase tracking-wide text-ink-faint sm:block">
            Admin Console
          </p>
          <h1 className="truncate text-base font-semibold text-ink sm:text-lg">{title}</h1>
        </div>
      </div>

      {/* Search trigger (real input lives inside SearchModal) */}
      <div className="hidden flex-1 max-w-md md:block">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search posts, users, settings"
          className="ui-input relative flex h-10 w-full items-center gap-2 pl-9 pr-12 text-left text-ink-faint hover:text-ink"
        >
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            <Icon.Search size={16} />
          </span>
          <span className="truncate">Search posts, users, settings...</span>
          <span className="ui-kbd absolute right-2.5 top-1/2 -translate-y-1/2">Ctrl+K</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open quick search"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-muted hover:bg-app hover:text-ink md:hidden"
        >
          <Icon.Search size={17} />
        </button>
        <Link
          href={`/${defaultLang}`}
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted hover:bg-app hover:text-ink sm:inline-flex"
        >
          <Icon.ExternalLink size={14} />
          <span className="hidden md:inline">View site</span>
        </Link>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-app hover:text-ink"
          >
            <Icon.Bell size={18} />
            {unreadCount > 0 ? (
              <>
                <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-accent ring-2 ring-white" />
                <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                  {Math.min(unreadCount, 9)}
                </span>
              </>
            ) : null}
          </button>
          {notifOpen ? (
            <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] origin-top-right animate-slide-in-right rounded-xl border border-line bg-white shadow-elev">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
                >
                  Mark all as read
                </button>
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-line">
                {visibleNotifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-ink-muted">
                    No shortcuts for your role.
                  </li>
                ) : null}
                {visibleNotifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href ?? '#'}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setNotifOpen(false);
                      }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-app"
                    >
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${
                          n.tone === 'info'
                            ? 'bg-info-soft text-info'
                            : n.tone === 'warning'
                            ? 'bg-warning-soft text-warning'
                            : 'bg-accent-soft text-accent'
                        }`}
                      >
                        {n.tone === 'warning' ? (
                          <Icon.AlertTriangle size={14} />
                        ) : n.tone === 'info' ? (
                          <Icon.Info size={14} />
                        ) : (
                          <Icon.Sparkles size={14} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{n.body}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-faint">{n.time}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line px-4 py-2.5 text-center">
                <Link href="/admin/dashboard" className="text-xs text-accent hover:underline">
                  Open dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            aria-label="Account menu"
            aria-expanded={userOpen}
            className="flex items-center gap-2 rounded-lg border border-line bg-white pl-1 pr-2.5 py-1 hover:bg-app"
          >
            <Avatar name={userName} size="sm" />
            <span className="hidden text-sm font-medium text-ink sm:inline">{userName}</span>
            <Icon.ChevronDown size={14} className="hidden text-ink-muted sm:inline" />
          </button>
          {userOpen ? (
            <div className="absolute right-0 mt-2 w-56 origin-top-right animate-slide-in-right rounded-xl border border-line bg-white shadow-elev">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">{userName}</p>
                <p className="truncate text-xs text-ink-muted">{userEmail}</p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                  {staffRoleLabel(role)}
                </p>
              </div>
              <ul className="py-1.5 text-sm">
                {canOpenSettings ? (
                  <li>
                    <Link
                      href="/admin/settings"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-app"
                    >
                      <Icon.Settings size={14} />
                      Settings
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link
                    href={`/${defaultLang}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-ink hover:bg-app"
                  >
                    <Icon.ExternalLink size={14} />
                    Open public site
                  </Link>
                </li>
              </ul>
              <div className="border-t border-line p-1.5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
                >
                  <Icon.SignOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
    </>
  );
}

