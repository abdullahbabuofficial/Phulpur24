# Admin security model

This is the layered defense in front of `/admin/*` and `/api/ai/*`. Every layer is independent — even if one fails, the others still hold.

## Threat model

We assume an attacker:

- Knows the public site exists.
- Can guess `/admin`, `/admin/login`, `/admin/dashboard`, `/api/ai/draft` and try them.
- Can run automated scrapers and brute-force tools.
- Can send arbitrary `Authorization` and cookie headers.
- Can iframe the public site on a hostile host.

We do **not** assume an attacker has stolen a real Supabase user token.

## Layer 1 — Subdomain isolation (recommended end state)

Run admin from `admin.phulpur24.com` and the public site from `phulpur24.com`. Two Vercel projects, same Supabase backend. Browser-level isolation (cookies, `localStorage`, CSP origin) makes admin sessions invisible to the public site no matter what code ships.

Set on each deployment:

| Env var | Public site | Admin site |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | required | required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required | required |
| `ANTHROPIC_API_KEY` | not set | required |
| `PUBLIC_SITE_HIDE_ADMIN` | `1` | not set / `0` |
| `NEXT_PUBLIC_ADMIN_ALLOW_DEMO` | not set | not set in prod |

## Layer 2 — Edge kill-switch (`middleware.ts`)

When `PUBLIC_SITE_HIDE_ADMIN=1`, every `/admin/*` and `/api/ai/*` request is replied to with a hard `404` and an empty body, indistinguishable from a non-existent path. The admin bundle never ships a useful response from the public domain.

This is the single most effective control while admin still lives in the same Next.js app as the public site.

## Layer 3 — Strict security headers on admin

Whenever the kill-switch is **off** (dev, or the admin domain), the same middleware adds these headers to every admin response:

- `X-Frame-Options: DENY` — no clickjacking.
- `X-Content-Type-Options: nosniff` — no MIME confusion.
- `Referrer-Policy: no-referrer` — no leaking admin URLs to third parties.
- `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` — search engines must not index even if `robots.txt` is bypassed.
- `Cache-Control: no-store, no-cache, must-revalidate, max-age=0, private` + `Pragma: no-cache` — no shared proxy or browser back-button leak after sign-out.
- `Permissions-Policy` — disables camera, microphone, geolocation, payment, USB, FLoC.
- `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin` — process isolation.

Plus a baseline applied site-wide via `next.config.mjs` (`Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`). The X-Powered-By header is suppressed.

## Layer 4 — Auth gate (`AdminAuthGate`)

Protects every page under `/admin/*` except `/admin/login`. The gate:

1. Synchronously bounces requests with no cached session straight to the login page.
2. Asynchronously verifies the cached session against `supabase.auth.getSession()`. A stale `localStorage` entry alone is not enough — Supabase must agree the access token is still alive.
3. Subscribes to `supabase.auth.onAuthStateChange`, so a sign-out in another tab or a server-side token revocation kicks every open admin tab to the login screen within milliseconds.

## Layer 5 — Sign-in (`adminAuth.ts`)

- Real auth goes through `supabase.auth.signInWithPassword`.
- The legacy "demo" backdoor is **disabled by default**. It is only enabled when both `NEXT_PUBLIC_ADMIN_ALLOW_DEMO=1` and `NODE_ENV !== 'production'`. In every deployed environment, only valid Supabase users can sign in.
- A network or unexpected error is reported to the user — it never silently grants access.
- Five failed attempts in a row trigger a 60-second client-side lockout. (Server-side throttling is a Supabase Auth config; see "Future hardening" below.)
- The login page no longer advertises the demo password.

## Layer 6 — API authentication (`/api/ai/draft`)

The Anthropic-backed draft endpoint requires `Authorization: Bearer <supabase access token>`. The route validates the token with `supabase.auth.getUser(token)` and returns `401` if missing/expired/invalid. Without this, anyone on the internet could drain the Anthropic key just by knowing the URL. All responses are sent with `Cache-Control: no-store` and `X-Robots-Tag: noindex`.

## Layer 7 — `robots.ts`

`Disallow: /admin, /admin/*, /api/, /api/*` for all crawlers. This is best-effort against well-behaved bots; the real guarantee comes from the headers and middleware above.

## Future hardening (not yet shipped)

These are the next steps when admin moves to its own deploy:

- **Migrate auth to `@supabase/ssr`** so the access token lives in an `httpOnly` cookie. Then `middleware.ts` can require a valid token at the edge instead of relying on a client-side gate.
- **Enable Supabase Row-Level Security** on every writable table (`articles`, `categories`, `media`, `users`, `comments`, `newsletter_subscribers`, `messages`, `site_settings`). RLS is the only thing that actually keeps a stolen anon key from being abused.
- **Vercel Access / Cloudflare Access** in front of `admin.phulpur24.com` for an extra IP / SSO layer.
- **Server-side rate limiting** on `/api/ai/draft` with a per-user counter (Upstash Redis works on Edge runtime).
- **Audit log** every `signIn` success/failure into a `admin_audit_log` table.
- **Content Security Policy** with strict `script-src`, `frame-ancestors 'none'`. Held back for now because Next.js inlines scripts that need allowlisting carefully — best done in a focused PR.

## Verifying the controls

```bash
# 1. Without the kill-switch (default dev):
curl -I http://127.0.0.1:3000/admin/login
#   expect: 200 + X-Frame-Options: DENY, Cache-Control: no-store, X-Robots-Tag: noindex

# 2. With the kill-switch (simulate public deploy):
PUBLIC_SITE_HIDE_ADMIN=1 npm run dev -- --hostname 127.0.0.1 --port 3000
curl -I http://127.0.0.1:3000/admin/login
#   expect: 404
curl -I http://127.0.0.1:3000/api/ai/draft
#   expect: 404

# 3. AI route requires auth:
curl -X POST http://127.0.0.1:3000/api/ai/draft \
  -H 'content-type: application/json' \
  -d '{"topic":"hi"}'
#   expect: 401 {"ok":false,"error":"Missing bearer token."}

# 4. Public pages still work and don't leak admin links:
curl http://127.0.0.1:3000/bn   | rg -q '/admin/dashboard' && echo BAD || echo OK
```
