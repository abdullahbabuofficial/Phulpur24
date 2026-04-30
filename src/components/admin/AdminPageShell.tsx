'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminTopbar from '@/components/layout/AdminTopbar';
import { getAdminSession } from '@/components/admin/adminAuth';

interface AdminPageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminPageShell({ title, children }: AdminPageShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: 'Admin',
    email: 'admin@phulpur24.com',
  });

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setUser({ name: session.name, email: session.email });
    }
  }, []);

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
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </>
  );
}
