'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasAdminSession } from './adminAuth';

interface AdminAuthGateProps {
  children: React.ReactNode;
}

export default function AdminAuthGate({ children }: AdminAuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const isLoginRoute = pathname === '/admin/login';

  const loginUrl = useMemo(() => {
    const nextPath = pathname && pathname !== '/admin' ? pathname : '/admin/dashboard';
    return `/admin/login?next=${encodeURIComponent(nextPath)}`;
  }, [pathname]);

  useEffect(() => {
    if (!isLoginRoute && !hasAdminSession()) {
      router.replace(loginUrl);
      return;
    }

    setChecked(true);
  }, [isLoginRoute, loginUrl, router]);

  if (!isLoginRoute && !checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm text-ink-muted shadow-card">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
          Checking admin session…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
