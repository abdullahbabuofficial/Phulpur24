/**
 * Server-only Supabase admin client.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY, which BYPASSES Row-Level Security. It must
 * NEVER reach the browser. Two guards prevent that:
 *
 *  1. The variable is NOT prefixed with NEXT_PUBLIC_, so Next.js will not
 *     inline it into client bundles.
 *  2. This module throws at import time when running in a browser context,
 *     so accidental imports from a client component fail loudly.
 *
 * Use this only from:
 *   - Route handlers (`src/app/api/.../route.ts`)
 *   - Server actions
 *   - `src/middleware.ts`
 *   - Other code with no `'use client'` ancestor.
 *
 * For ordinary anon-key reads/writes, keep using `@/lib/supabase/client` / `getSupabase()`.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

if (typeof window !== 'undefined') {
  throw new Error(
    '[supabase/admin] This module imports the service-role key. It must not be loaded in the browser.'
  );
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase client authenticated with the service-role
 * key. Returns `null` if the env is not configured (instead of throwing) so
 * callers can gracefully degrade — e.g. fall back to the anon client.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !serviceKey) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        '[supabase/admin] SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing; admin operations will be disabled.'
      );
    }
    return null;
  }

  if (cached) return cached;

  cached = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: { 'X-Client-Info': 'phulpur24-admin' },
    },
  });

  return cached;
}

/**
 * True iff the service-role key is configured. Useful for letting routes
 * pick between admin and anon clients.
 */
export function hasSupabaseAdmin(): boolean {
  return Boolean(url && serviceKey);
}
