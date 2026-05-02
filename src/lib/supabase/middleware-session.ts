import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Refresh the Supabase auth cookie on each matched request. Call first in root middleware.
 * Uses `getUser()` so the JWT is validated against Supabase (not just parsed locally).
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  if (!url || !anonKey) {
    return NextResponse.next({ request });
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

  return response;
}

/** Copy Set-Cookie headers from the session response onto another response (e.g. redirects). */
export function forwardAuthCookies(from: NextResponse, to: NextResponse) {
  const list = from.headers.getSetCookie?.() ?? [];
  for (const c of list) {
    to.headers.append('Set-Cookie', c);
  }
}
