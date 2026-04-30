'use client';

import { supabase } from '@/lib/supabase/client';

export const ADMIN_AUTH_KEY = 'phulpur24.admin.auth';

export interface AdminSession {
  email: string;
  name: string;
  remember: boolean;
  signedInAt: string;
  /** 'supabase' = real auth.users session, 'demo' = local mock fallback. */
  source?: 'supabase' | 'demo';
}

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
 * Sign in. Tries real Supabase Auth first. If that fails AND the user typed
 * a non-empty password, we still let them in via a "demo" session so the
 * mock seeded environment works out of the box. Once auth is locked down
 * for production you'd remove the demo fallback.
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
  } catch {
    /* fall through to demo */
  }

  // Demo fallback (only when password non-empty)
  const session: AdminSession = {
    email: trimmedEmail,
    name: 'Admin',
    remember,
    signedInAt: new Date().toISOString(),
    source: 'demo',
  };
  writeLocalSession(session, remember);
  return { data: session, error: null };
}

/** @deprecated kept for backward compat with older callsites; prefer `signIn`. */
export function setAdminSession(email: string, remember: boolean) {
  const session: AdminSession = {
    email: email.trim(),
    name: 'Admin',
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
