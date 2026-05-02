'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getAdminSession } from '@/components/admin/adminAuth';
import { canAccessAdminPath } from '@/lib/admin-rbac';
import type { ProfileRow } from '@/lib/supabase/types';

const DEMO_PROFILE: ProfileRow = {
  id: 'demo',
  email: 'demo@local.test',
  full_name: 'Demo Admin',
  role: 'admin',
  avatar_url: null,
  status: 'active',
  articles_count: 0,
  last_seen_at: null,
  created_at: new Date().toISOString(),
};

interface AdminWorkspaceValue {
  profile: ProfileRow | null;
  role: ProfileRow['role'] | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AdminWorkspaceContext = createContext<AdminWorkspaceValue | null>(null);

export function useAdminWorkspace(): AdminWorkspaceValue {
  const ctx = useContext(AdminWorkspaceContext);
  if (!ctx) {
    throw new Error('useAdminWorkspace must be used inside AdminWorkspaceProvider');
  }
  return ctx;
}

/** Optional hook for components outside the provider tree (e.g. tests). */
export function useAdminWorkspaceNullable(): AdminWorkspaceValue | null {
  return useContext(AdminWorkspaceContext);
}

export function AdminWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(!isLogin);

  const loadProfile = useCallback(async () => {
    if (isLogin) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const local = getAdminSession();
    if (local?.source === 'demo') {
      setProfile(DEMO_PROFILE);
      setLoading(false);
      return;
    }

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    setProfile((data as ProfileRow | null) ?? null);
    setLoading(false);
  }, [isLogin]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (isLogin || loading) return;
    const role = profile?.role ?? null;
    if (!canAccessAdminPath(role, pathname)) {
      router.replace('/admin/dashboard');
    }
  }, [isLogin, loading, profile, pathname, router]);

  const value = useMemo<AdminWorkspaceValue>(
    () => ({
      profile,
      role: profile?.role ?? null,
      loading,
      refreshProfile: loadProfile,
    }),
    [profile, loading, loadProfile]
  );

  if (!isLogin && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm text-ink-muted shadow-card">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
          Loading workspace…
        </div>
      </div>
    );
  }

  return <AdminWorkspaceContext.Provider value={value}>{children}</AdminWorkspaceContext.Provider>;
}
