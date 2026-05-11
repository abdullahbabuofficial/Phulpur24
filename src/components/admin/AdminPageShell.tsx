'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceContext';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminTopbar from '@/components/layout/AdminTopbar';
import { getAdminSession } from '@/components/admin/adminAuth';

interface AdminPageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminPageShell({ title, children }: AdminPageShellProps) {
  const { profile } = useAdminWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: 'Admin',
    email: 'admin@phulpur24.com',
  });

  useEffect(() => {
    if (profile?.full_name || profile?.email) {
      setUser({
        name: profile.full_name?.trim() || profile.email || 'Staff',
        email: profile.email || '',
      });
      return;
    }
    const session = getAdminSession();
    if (session) {
      setUser({ name: session.name, email: session.email });
    }
  }, [profile]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      <div className="admin-scope flex min-h-screen bg-app text-ink">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="sticky top-0 h-screen">
            <AdminSidebar userName={user.name} userEmail={user.email} />
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] animate-fade-in"
            />
            <div className="relative z-10 h-full w-72 max-w-[86vw] animate-slide-in-right">
              <AdminSidebar
                onNavigate={() => setMobileOpen(false)}
                userName={user.name}
                userEmail={user.email}
              />
            </div>
          </div>
        ) : null}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            title={title}
            onMenuClick={() => setMobileOpen(true)}
            userName={user.name}
            userEmail={user.email}
          />
          {!supabaseConfigured ? (
            <div className="mx-4 mt-4 rounded-lg border border-warning bg-warning-soft px-4 py-3 text-sm text-warning-text sm:mx-6 lg:mx-8">
              Supabase is not configured in this environment. Live admin data is currently unavailable.
              <Link href="/admin/diagnostic" className="ml-2 font-medium underline underline-offset-2">
                Run diagnostics
              </Link>
            </div>
          ) : null}
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </>
  );
}
