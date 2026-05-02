import { NextRequest, NextResponse } from 'next/server';
import {
  forwardAuthCookies,
  updateSupabaseSession,
} from '@/lib/supabase/middleware-session';

/**
 * Phulpur24 edge middleware.
 *
 * Five jobs:
 *
 *  0. Supabase session refresh — `updateSupabaseSession` runs first on every
 *     matched request so auth cookies stay valid (`@supabase/ssr` server
 *     client + `getUser()`). Redirect responses copy refreshed Set-Cookie
 *     headers so sessions are not dropped on the admin-host → public redirect.
 *
 *  1. Public-side kill-switch — when `PUBLIC_SITE_HIDE_ADMIN=1`, every
 *     /admin/*, /api/admin/*, and /api/ai/* request returns a hard 404 with no body. Set
 *     this on the public-site deploy (phulpur24.com) so the admin console
 *     only exists on its own subdomain. Indistinguishable from a
 *     non-existent path.
 *
 *  2. Admin-side reverse kill-switch — when `ADMIN_SITE_HIDE_PUBLIC=1`,
 *     every non-admin URL on the admin deploy is redirected away:
 *       - the bare host (`/`) always 307-redirects to `/admin/login` on
 *         the same host, so typed bookmarks land on admin (not public);
 *       - other public-flavoured paths (`/bn/*`, `/en/*`, `/about`,
 *         `/contact`, `/search`, …) 308-redirect to `PUBLIC_SITE_URL`
 *         when configured, preserving path + query so accidentally-
 *         shared admin-host links resolve on the public domain. Without
 *         `PUBLIC_SITE_URL` they fall back to `/admin/login`.
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
const ADMIN_REST_API_PREFIX = '/api/admin';

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
    pathname.startsWith(`${ADMIN_API_PREFIX}/`) ||
    pathname === ADMIN_REST_API_PREFIX ||
    pathname.startsWith(`${ADMIN_REST_API_PREFIX}/`)
  );
}

/**
 * Best-effort suppression of Vercel/Next.js framework-fingerprinting headers.
 * Vercel adds some of these at its proxy layer AFTER middleware finishes, so
 * not all calls to `delete` succeed in production — but `x-matched-path` and
 * `x-nextjs-*` are typically removable from middleware. Low-severity hardening.
 */
const VERCEL_DEBUG_HEADERS = [
  'x-matched-path',
  'x-nextjs-prerender',
  'x-nextjs-stale-time',
  'x-vercel-cache',
  'x-vercel-enable-rewrite-caching',
  'x-vercel-id',
];

function stripDebugHeaders(res: NextResponse) {
  for (const h of VERCEL_DEBUG_HEADERS) res.headers.delete(h);
  return res;
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

function redirectPublicAwayFromAdminHost(
  request: NextRequest,
  sessionResponse: NextResponse
): NextResponse {
  const canonical = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  const { pathname, search } = request.nextUrl;

  // The bare admin host (`/`) is the friendliest landing spot for typed
  // bookmarks and address-bar visits. Send those straight to the admin
  // login on the same host — never bounce them to the public site.
  if (pathname === '/') {
    const res = NextResponse.redirect(new URL('/admin/login', request.url), 307);
    forwardAuthCookies(sessionResponse, res);
    return res;
  }

  // Any other public-flavoured path on the admin host (e.g. `/bn`,
  // `/en/news/foo`, `/about`) is redirected to the canonical public
  // domain when one is configured — preserves the article URL for users
  // who shared an admin-host link by mistake.
  if (canonical) {
    const target = `${canonical}${pathname}${search}`;
    const res = NextResponse.redirect(target, 308);
    forwardAuthCookies(sessionResponse, res);
    return res;
  }

  // No canonical configured — fall back to the admin login on the same host.
  const res = NextResponse.redirect(new URL('/admin/login', request.url), 307);
  forwardAuthCookies(sessionResponse, res);
  return res;
}

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSupabaseSession(request);
  const { pathname } = request.nextUrl;
  const isAdmin = isAdminPath(pathname);

  // 1. Public-side kill-switch
  if (isAdmin && process.env.PUBLIC_SITE_HIDE_ADMIN === '1') {
    return HIDE_ADMIN_RESPONSE;
  }

  // 2. Admin-side reverse kill-switch
  if (!isAdmin && process.env.ADMIN_SITE_HIDE_PUBLIC === '1') {
    return redirectPublicAwayFromAdminHost(request, sessionResponse);
  }

  // 3. Strict security headers on admin (admin paths get extra protection
  // on top of the baseline headers from next.config.mjs).
  if (isAdmin) {
    return stripDebugHeaders(applyAdminSecurityHeaders(sessionResponse));
  }

  // 4. Public paths: just remove the Vercel debug headers if we can.
  return stripDebugHeaders(sessionResponse);
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
