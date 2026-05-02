import { NextRequest, NextResponse } from 'next/server';

/**
 * Phulpur24 edge middleware.
 *
 * Three jobs:
 *  1. Kill-switch — when `PUBLIC_SITE_HIDE_ADMIN=1`, every /admin/* and
 *     /api/ai/* request returns a hard 404 with no body. Set this on the
 *     public-site deploy (phulpur24.com) so the admin console only exists on
 *     its own subdomain. Indistinguishable from a non-existent path.
 *
 *  2. Security headers — for every admin page and admin-only API route we
 *     send strict headers: deny iframing, disable caching, deny indexing,
 *     forbid sensitive browser features. Defense-in-depth in case JS-level
 *     auth fails or a stale page is served.
 *
 *  3. Public chrome stays untouched. /bn, /en, /search, /about, /contact and
 *     all other paths fall straight through.
 *
 * NOTE: This runs on the edge before any Next.js handler. Auth itself is
 * still verified by the AdminAuthGate (which calls Supabase). Combine with
 * Supabase Row-Level Security on the database to make access truly safe.
 */

const ADMIN_PREFIX = '/admin';
const ADMIN_API_PREFIX = '/api/ai';

const HIDE_ADMIN_RESPONSE = new NextResponse(null, {
  status: 404,
  headers: {
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
  },
});

function isAdminPath(pathname: string): boolean {
  return (
    pathname === ADMIN_PREFIX ||
    pathname.startsWith(`${ADMIN_PREFIX}/`) ||
    pathname === ADMIN_API_PREFIX ||
    pathname.startsWith(`${ADMIN_API_PREFIX}/`)
  );
}

function applyAdminSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'no-referrer');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  res.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, max-age=0, private'
  );
  res.headers.set('Pragma', 'no-cache');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()'
  );
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  if (process.env.PUBLIC_SITE_HIDE_ADMIN === '1') {
    return HIDE_ADMIN_RESPONSE;
  }

  return applyAdminSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/admin/:path*', '/api/ai/:path*'],
};
