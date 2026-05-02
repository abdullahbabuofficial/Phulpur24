import { NextRequest, NextResponse } from 'next/server';

/**
 * Phulpur24 edge middleware.
 *
 * Four jobs:
 *  1. Public-side kill-switch — when `PUBLIC_SITE_HIDE_ADMIN=1`, every
 *     /admin/* and /api/ai/* request returns a hard 404 with no body. Set
 *     this on the public-site deploy (phulpur24.com) so the admin console
 *     only exists on its own subdomain. Indistinguishable from a
 *     non-existent path.
 *
 *  2. Admin-side reverse kill-switch — when `ADMIN_SITE_HIDE_PUBLIC=1`,
 *     every non-admin URL on the admin deploy (`/`, `/bn/*`, `/en/*`,
 *     `/about`, `/contact`, `/search`, etc.) is redirected away. If
 *     `PUBLIC_SITE_URL` is also set, requests are 308-redirected to the
 *     canonical public domain (great for SEO + bookmarks). Otherwise
 *     everything is 307-redirected to `/admin/login`.
 *
 *  3. Security headers — for every admin page and admin-only API route we
 *     send strict headers: deny iframing, disable caching, deny indexing,
 *     forbid sensitive browser features. Defense-in-depth in case JS-level
 *     auth fails or a stale page is served.
 *
 *  4. Public chrome on the public deploy stays untouched. /bn, /en,
 *     /search, /about, /contact and all other paths fall straight through.
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

function redirectPublicAwayFromAdminHost(request: NextRequest): NextResponse {
  const canonical = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  const { pathname, search } = request.nextUrl;

  if (canonical) {
    // Send users to the canonical public domain, preserving the path + query.
    const target = `${canonical}${pathname}${search}`;
    return NextResponse.redirect(target, 308);
  }

  // Fallback: shove every non-admin request to the admin login.
  const loginUrl = new URL('/admin/login', request.url);
  return NextResponse.redirect(loginUrl, 307);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = isAdminPath(pathname);

  // 1. Public-side kill-switch
  if (isAdmin && process.env.PUBLIC_SITE_HIDE_ADMIN === '1') {
    return HIDE_ADMIN_RESPONSE;
  }

  // 2. Admin-side reverse kill-switch
  if (!isAdmin && process.env.ADMIN_SITE_HIDE_PUBLIC === '1') {
    return redirectPublicAwayFromAdminHost(request);
  }

  // 3. Strict security headers on admin
  if (isAdmin) {
    return applyAdminSecurityHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

/**
 * Match every URL EXCEPT static assets, the Next.js internals, and binary
 * file extensions. This is broader than the previous matcher because the
 * reverse kill-switch needs to see public paths like `/bn`, `/en`, etc.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot|map)$).*)',
  ],
};
