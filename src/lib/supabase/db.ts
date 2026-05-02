/**
 * Supabase clients for Next.js:
 * - Server (RSC, routes, first paint): anon {@link createClient} — no session persistence.
 * - Browser: {@link createBrowserClient} from `@supabase/ssr` — auth in HTTP-only cookies.
 *
 * Middleware refreshes cookies via `createServerClient` (see `./middleware-session.ts`).
 */
import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing.');
}

const fallbackUrl = url ?? 'http://localhost:54321';
const fallbackKey = key ?? 'missing-key';

let serverAnon: SupabaseClient | null = null;

function getServerAnonClient(): SupabaseClient {
  if (!serverAnon) {
    serverAnon = createClient(fallbackUrl, fallbackKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverAnon;
}

let browserClient: SupabaseClient | null = null;

/** Prefer this when you need an explicit reference (e.g. passing into helpers). */
export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    return getServerAnonClient();
  }
  if (!browserClient) {
    browserClient = createBrowserClient(fallbackUrl, fallbackKey);
  }
  return browserClient;
}

/**
 * Lazy client: resolves to server anon during SSR / RSC, cookie-backed browser client on the client.
 * Keeps existing `import { supabase } from '@/lib/supabase/client'` call sites working.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabase();
    const value = client[prop];
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
}) as SupabaseClient;

export const SUPABASE_MODE = url && key ? ('live' as const) : ('mock' as const);

export interface SupabaseAuthSession {
  user: {
    id: string;
    email: string;
    full_name: string;
    role:
      | 'admin'
      | 'editor'
      | 'reporter'
      | 'translator'
      | 'seo_editor'
      | 'sports_reporter'
      | 'local_correspondent';
  };
  access_token: string;
  expires_at: number;
}
