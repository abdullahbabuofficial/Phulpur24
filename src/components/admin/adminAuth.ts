'use client';

import { supabase } from '@/lib/supabase/client';

export const ADMIN_AUTH_KEY = 'phulpur24.admin.auth';

/**
 * Demo password fallback is OFF by default. It is ONLY enabled when both:
 *   - NEXT_PUBLIC_ADMIN_ALLOW_DEMO === '1', AND
 *   - the build is not a production build.
 *
 * This is a developer convenience for working without a Supabase user; it
 * MUST stay off on every deployed environment.
 */
const DEMO_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_ADMIN_ALLOW_DEMO === '1' &&
  process.env.NODE_ENV !== 'production';

export interface AdminSession {
  email: string;
  name: string;
  remember: boolean;
  signedInAt: string;
  /** 'supabase' = real auth.users session, 'demo' = local mock fallback. */
  source?: 'supabase' | 'demo';
}

export const adminAuthMode: 'live' | 'live+demo' = DEMO_AUTH_ENABLED ? 'live+demo' : 'live';

const isBrowser = () => typeof window !== 'undefined';

function readLocalSession(): AdminSession | null {
  if (!isBrowser()) return null;
  const raw =
    window.sessionStorage.getItem(ADMIN_AUTH_KEY) || window.localStorage.getItem(ADMIN_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    clearLocalSession();
    return null;
  }
}

function writeLocalSession(session: AdminSession, remember: boolean) {
  if (!isBrowser()) return;
  const serialized = JSON.stringify(session);
  if (remember) {
    window.localStorage.setItem(ADMIN_AUTH_KEY, serialized);
    window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } else {
    window.sessionStorage.setItem(ADMIN_AUTH_KEY, serialized);
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
  }
  window.dispatchEvent(new Event('phulpur24-admin-auth-change'));
}

function clearLocalSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ADMIN_AUTH_KEY);
  window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
  window.dispatchEvent(new Event('phulpur24-admin-auth-change'));
}

/** Synchronous read for server/auth-gate paths (uses last cached session). */
export function getAdminSession(): AdminSession | null {
  return readLocalSession();
}

export function hasAdminSession() {
  return Boolean(getAdminSession());
}

/**
 * Sign in via Supabase Auth.
 *
 * - In production (or any deploy without `NEXT_PUBLIC_ADMIN_ALLOW_DEMO=1`),
 *   ONLY a real Supabase user with the correct password gets in. Any error,
 *   including network errors, surfaces to the user — we never silently
 *   accept a guess.
 * - In a dev build with the demo flag on, after Supabase explicitly rejects
 *   credentials the function falls back to a local "demo" session so devs
 *   can work without seeding auth.users. This branch is unreachable in
 *   production.
 */
export async function signIn(
  email: string,
  password: string,
  remember: boolean
): Promise<{ data: AdminSession | null; error: { message: string } | null }> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return { data: null, error: { message: 'Email and password are required.' } };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (!error && data.user) {
      const meta = (data.user.user_metadata ?? {}) as { full_name?: string; role?: string };
      const session: AdminSession = {
        email: data.user.email ?? trimmedEmail,
        name: meta.full_name || 'Admin',
        remember,
        signedInAt: new Date().toISOString(),
        source: 'supabase',
      };
      writeLocalSession(session, remember);
      return { data: session, error: null };
    }

    if (DEMO_AUTH_ENABLED) {
      const session: AdminSession = {
        email: trimmedEmail,
        name: 'Admin (demo)',
        remember,
        signedInAt: new Date().toISOString(),
        source: 'demo',
      };
      writeLocalSession(session, remember);
      return { data: session, error: null };
    }

    return {
      data: null,
      error: { message: error?.message ?? 'Invalid email or password.' },
    };
  } catch (err) {
    // Network / unexpected error. Do NOT silently log the user in.
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? `Sign-in failed: ${err.message}`
            : 'Sign-in failed. Please try again.',
      },
    };
  }
}

/**
 * Cross-check that there is still a live Supabase session for sessions
 * marked `source: 'supabase'`. A stale localStorage entry alone is NOT
 * enough — if Supabase says the access token is gone or invalid, we
 * forcibly clear and report no session.
 *
 * Demo sessions (only possible in dev with the env flag) are accepted
 * without re-checking Supabase.
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  const local = getAdminSession();
  if (!local) return null;

  if (local.source === 'demo') {
    return DEMO_AUTH_ENABLED ? local : (clearLocalSession(), null);
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      clearLocalSession();
      return null;
    }
    return local;
  } catch {
    clearLocalSession();
    return null;
  }
}

/**
 * @deprecated Demo-only escape hatch. Disabled outside of dev + demo flag.
 * Real sign-in must go through `signIn`.
 */
export function setAdminSession(email: string, remember: boolean) {
  if (!DEMO_AUTH_ENABLED) return;
  const session: AdminSession = {
    email: email.trim(),
    name: 'Admin (demo)',
    remember,
    signedInAt: new Date().toISOString(),
    source: 'demo',
  };
  writeLocalSession(session, remember);
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore — we still clear the local session below */
  }
  clearLocalSession();
}

export function clearAdminSession() {
  // Synchronous variant kept for the existing button bindings; fires async signOut on the side.
  void supabase.auth.signOut().catch(() => undefined);
  clearLocalSession();
}
