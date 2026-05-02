'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminAuthMode, hasAdminSession, signIn } from '@/components/admin/adminAuth';
import { Button } from '@/components/admin/ui/Button';
import { Input } from '@/components/admin/ui/Input';
import { Icon } from '@/components/admin/ui/Icon';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (hasAdminSession()) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && now < lockedUntil;
  const secondsLeft = isLocked ? Math.ceil(((lockedUntil ?? 0) - now) / 1000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLocked) {
      setError(`Too many attempts. Try again in ${secondsLeft}s.`);
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    const res = await signIn(email.trim(), password, remember);
    setLoading(false);
    if (res.error) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockedUntil(until);
        setNow(Date.now());
        setError(`Too many failed attempts. Locked for ${Math.ceil(LOCKOUT_MS / 1000)}s.`);
      } else {
        setError(res.error.message);
      }
      return;
    }
    setAttempts(0);
    setLockedUntil(null);
    const next = new URLSearchParams(window.location.search).get('next') || '/admin/dashboard';
    router.replace(next.startsWith('/admin') ? next : '/admin/dashboard');
  };

  return (
    <div className="admin-scope flex min-h-screen bg-app">
      {/* Left brand panel */}
      <aside className="relative hidden flex-1 overflow-hidden bg-sidebar text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(99,102,241,0.45),transparent_45%),radial-gradient(circle_at_80%_110%,rgba(236,72,153,0.25),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-indigo-600 text-base font-black shadow-lg">
              P24
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold">Phulpur24</p>
              <p className="text-xs text-sidebar-muted">News platform · Admin console</p>
            </div>
          </Link>

          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-accent-soft/70">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              Run your newsroom from one focused workspace.
            </h1>
            <p className="mt-3 text-sm text-sidebar-text/80">
              Publish, translate, and analyze every story in Bangla and English. Manage media,
              authors, SEO, and the public site without leaving the console.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
              {[
                { label: 'Articles', value: '247' },
                { label: 'Authors', value: '6' },
                { label: 'Languages', value: 'BN · EN' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-sidebar-border bg-sidebar-hover/40 p-3">
                  <p className="text-lg font-semibold text-white">{s.value}</p>
                  <p className="text-sidebar-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-sidebar-muted">
            © {new Date().getFullYear()} Phulpur24 · All rights reserved
          </p>
        </div>
      </aside>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar text-xs font-black text-white">
                P24
              </div>
              <span className="text-base font-semibold text-ink">Phulpur24 Admin</span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Enter your credentials to access the admin console.
            </p>
            {adminAuthMode === 'live+demo' ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-warning/20 bg-warning-soft px-2 py-1 text-[11px] font-medium text-warning-text">
                <Icon.Info size={12} /> Demo mode is enabled in this build. Disable it before deploying.
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <div className="rounded-lg border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-text">
                {error}
              </div>
            ) : null}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              iconLeft={<Icon.Mail size={16} />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              iconLeft={<Icon.Lock size={16} />}
              rightSlot={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-md p-1.5 text-ink-faint hover:bg-app hover:text-ink"
                >
                  {showPassword ? <Icon.EyeOff size={16} /> : <Icon.Eye size={16} />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-accent focus:ring-accent/30"
                />
                Remember this device
              </label>
              <a
                href="mailto:info@phulpur24.com?subject=Admin%20password%20reset"
                className="text-sm text-accent hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button type="submit" loading={loading} disabled={isLocked} fullWidth size="lg">
              {isLocked ? `Locked · retry in ${secondsLeft}s` : 'Sign in to console'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-muted">
            Need access? Contact{' '}
            <a href="mailto:info@phulpur24.com" className="text-accent hover:underline">
              info@phulpur24.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
