/**
 * Admin navigation and route access by `profiles.role`.
 * Used by edge middleware (redirect before RSC), `AdminWorkspaceProvider`, and UI filters.
 * Database RLS remains authoritative — this is UX + defense in depth for casual browsing.
 */
import type { ProfileRow } from '@/lib/supabase/types';

export type StaffRole = ProfileRow['role'];

/**
 * Allowed URL prefixes per role (longest meaningful paths first for clarity).
 * `/admin/posts` covers `/admin/posts/new` and `/admin/posts/[id]`.
 */
const ROLE_ALLOWED_PREFIXES: Record<StaffRole, readonly string[]> = {
  admin: ['/admin'],
  editor: [
    '/admin/dashboard',
    '/admin/analytics',
    '/admin/posts',
    '/admin/ai-writer',
    '/admin/translation',
    '/admin/seo',
    '/admin/media',
    '/admin/comments',
    '/admin/newsletter',
    '/admin/messages',
    '/admin/settings',
  ],
  reporter: ['/admin/dashboard', '/admin/posts', '/admin/ai-writer', '/admin/media'],
  sports_reporter: ['/admin/dashboard', '/admin/posts', '/admin/ai-writer', '/admin/media'],
  local_correspondent: ['/admin/dashboard', '/admin/posts', '/admin/ai-writer', '/admin/media'],
  translator: ['/admin/dashboard', '/admin/posts', '/admin/translation', '/admin/media'],
  seo_editor: ['/admin/dashboard', '/admin/analytics', '/admin/posts', '/admin/seo', '/admin/media'],
} as const;

export function canAccessAdminPath(role: StaffRole | null, pathname: string): boolean {
  if (pathname === '/admin/login') return true;
  if (pathname === '/admin' || pathname === '/admin/') return true;

  if (!role) {
    return pathname.startsWith('/admin/dashboard');
  }

  if (role === 'admin') {
    return pathname.startsWith('/admin');
  }

  const prefixes = ROLE_ALLOWED_PREFIXES[role];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Human-readable label for the shell / sidebar footer. */
export function staffRoleLabel(role: StaffRole | null): string {
  if (!role) return 'Staff';
  const map: Record<StaffRole, string> = {
    admin: 'Admin',
    editor: 'Editor',
    reporter: 'Reporter',
    translator: 'Translator',
    seo_editor: 'SEO Editor',
    sports_reporter: 'Sports Reporter',
    local_correspondent: 'Correspondent',
  };
  return map[role];
}
