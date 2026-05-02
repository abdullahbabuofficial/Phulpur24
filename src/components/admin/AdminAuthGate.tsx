'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { hasAdminSession, verifyAdminSession } from './adminAuth';

interface AdminAuthGateProps {
  children: React.ReactNode;
}

type GateState = 'checking' | 'authed' | 'redirecting';

/**
 * Hard gate around every /admin route.
 *
 * - Synchronous first pass uses the cached localStorage session so the UI
 *   doesn't flicker on a real navigation.
 * - Async second pass calls Supabase to confirm the session is still alive.
 *   If Supabase says no, we wipe local state and bounce to /admin/login.
 * - Subscribes to Supabase auth events so a token revocation in another tab
 *   immediately kicks the user out of every open admin tab.
 */
export default function AdminAuthGate({ children }: AdminAuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<GateState>('checking');
  const isLoginRoute = pathname === '/admin/login';

  const loginUrl = useMemo(() => {
    const nextPath = pathname && pathname !== '/admin' ? pathname : '/admin/dashboard';
    return `/admin/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname]);

  useEffect(() => {
    if (isLoginRoute) {
      setState('authed');
      return;
    }

    let cancelled = false;

    const fastDeny = !hasAdminSession();
    if (fastDeny) {
      setState('redirecting');
      router.replace(loginUrl);
      return;
    }

    void verifyAdminSession().then((session) => {
      if (cancelled) return;
      if (!session) {
        setState('redirecting');
        router.replace(loginUrl);
        return;
      }
      setState('authed');
    });

    return () => {
      cancelled = true;
    };
  }, [isLoginRoute, loginUrl, router]);

  // React to remote sign-out / token revocation while a tab is open.
  useEffect(() => {
    if (isLoginRoute) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT' && event !== 'TOKEN_REFRESHED' && event !== 'USER_UPDATED') {
        return;
      }
      void verifyAdminSession().then((session) => {
        if (!session) {
          setState('redirecting');
          router.replace(loginUrl);
        }
      });
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [isLoginRoute, loginUrl, router]);

  if (state !== 'authed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm text-ink-muted shadow-card">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
          {state === 'redirecting' ? 'Redirecting to sign in…' : 'Verifying admin session…'}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
