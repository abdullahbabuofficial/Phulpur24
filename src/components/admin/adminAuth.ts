'use client';

import { supabase } from '@/lib/supabase/client';

export const ADMIN_AUTH_KEY = 'phulpur24.admin.auth';

export interface AdminSession {
  email: string;
  name: string;
  remember: boolean;
  signedInAt: string;
  source?: 'supabase';
}

export const adminAuthMode = 'live' as const;

const isBrowser = () => typeof window !== 'undefined';

function readLocalSession(): AdminSession | null {
  if (!isBrowser()) return null;
  const raw =
    window.sessionStorage.getItem(ADMIN_AUTH_KEY) || window.localStorage.getItem(ADMIN_AUTH_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdminSession;
    if (parsed.source && parsed.source !== 'supabase') {
      clearLocalSession();
      return null;
    }
    return parsed;
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

export function getAdminSession(): AdminSession | null {
  return readLocalSession();
}

export function hasAdminSession() {
  return Boolean(getAdminSession());
}

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
      const meta = (data.user.user_metadata ?? {}) as { full_name?: string };
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

    return {
      data: null,
      error: { message: error?.message ?? 'Invalid email or password.' },
    };
  } catch (err) {
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

export async function verifyAdminSession(): Promise<AdminSession | null> {
  const local = getAdminSession();
  if (!local) return null;

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
 * @deprecated Demo sessions are removed from runtime. This is now a no-op.
 */
export function setAdminSession(_email: string, _remember: boolean) {
  void _email;
  void _remember;
  return;
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore and still clear local session
  }
  clearLocalSession();
}

export function clearAdminSession() {
  void supabase.auth.signOut().catch(() => undefined);
  clearLocalSession();
}
