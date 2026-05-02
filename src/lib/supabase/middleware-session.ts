import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export type MiddlewareSupabaseSession = {
  response: NextResponse;
  /** Cookie-bound client after refresh; `null` when Supabase URL/key are not configured. */
  supabase: SupabaseClient | null;
};

/**
 * Refresh the Supabase auth cookie on each matched request. Call first in root middleware.
 * Uses `getUser()` so the JWT is validated against Supabase (not just parsed locally).
 * Returns the same `supabase` instance for follow-up work (e.g. admin RBAC) without a second client.
 */
export async function updateSupabaseSession(request: NextRequest): Promise<MiddlewareSupabaseSession> {
  if (!url || !anonKey) {
    return { response: NextResponse.next({ request }), supabase: null };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return { response, supabase };
}

/** Copy Set-Cookie headers from the session response onto another response (e.g. redirects). */
export function forwardAuthCookies(from: NextResponse, to: NextResponse) {
  const list = from.headers.getSetCookie?.() ?? [];
  for (const c of list) {
    to.headers.append('Set-Cookie', c);
  }
}
