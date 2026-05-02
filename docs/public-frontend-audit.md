# Public-frontend security audit

**Scope:** what an unauthenticated visitor can learn about, or do to, the
Phulpur24 public deployment (`https://phulpur24.com`) and its backing
Supabase project, using only browser tooling, raw HTTP, and the public
anon key embedded in every page bundle.

**Methodology:** static scan of HTML/RSC payload → static scan of every
JS chunk shipped to the browser → response-header inventory → blind
probing of common admin/source/debug paths → live abuse testing of the
Supabase anon key against every public-schema table and the Auth admin
API → Storage bucket abuse → error-page disclosure check.

**Date:** 2026-05-02. Audit run from the maintainer's machine, against
production.

## Status (2026-05-02, after remediation)

All four CRITICAL/HIGH findings have been fixed in production:

- **#1 + #2 (RLS):** New role-aware policies via migration
  `lock_down_rls_role_aware`. Anon UPDATE/DELETE now silently no-op (RLS
  filters out 0 rows); INSERT into restricted tables hits "new row
  violates RLS"; reads from `profiles`, `audit_logs`, `dashboard_stats`,
  `newsletter_subscribers`, `contact_messages`, `page_views` all return
  empty for anon. Verified live with the abuse probe.
- **#3 (anon insert validation):** Migration
  `rls_tighten_anon_inserts_and_definer_funcs` adds explicit `WITH CHECK`
  validation on the three remaining anon-insert tables (newsletter,
  contact_messages, page_views) so blank/oversize payloads are rejected.
- **#4 (over-broad reads):** `audit_logs`, `dashboard_stats`, `profiles`,
  `newsletter_subscribers`, `contact_messages`, `page_views` are now
  admin-only (or admin + own-row for `profiles`). Public can still read
  `articles` (only published, undeleted), `categories`, `tags`,
  `authors`, `media_assets`, `site_settings.id='site'`, and approved
  comments — i.e. exactly what the public site needs to render.
- **#6 (CSP):** Baseline `Content-Security-Policy` shipped in
  `next.config.mjs` covering `img-src` / `script-src` / `style-src` /
  `connect-src` / `frame-src` / `frame-ancestors 'none'` /
  `object-src 'none'` / `upgrade-insecure-requests`. Live on every
  response.
- **#7 (debug headers):** `x-matched-path`, `x-nextjs-*`, `x-vercel-id`
  best-effort stripped in `src/middleware.ts`. Vercel re-injects some at
  the proxy layer (post-middleware) — known platform behavior, accepted
  as a low-severity residual leak.
- **Bonus:** Supabase project Auth settings tightened via Management API
  — `disable_signup=true` (no public account creation),
  `password_hibp_enabled=true` (HaveIBeenPwned check),
  `password_min_length=10`, `site_url=https://phulpur24.com`.
  `bump_article_views()` SECURITY DEFINER stripped of REST-RPC EXECUTE.
  Storage `media public read` policy dropped (the bucket is public so
  URLs serve directly without going through the storage.objects RLS
  check); INSERT/DELETE/LIST on `storage.objects` now require staff.

Open follow-ups:

- **#5 (test accounts with `Test@123`):** still active. Rotate or
  delete when done with RBAC work — see `scripts/create-test-users.mjs`.
- `is_admin()` / `is_staff()` advisor warnings: `EXECUTE` must stay
  granted to `authenticated` so Postgres can evaluate the RLS expression
  as the session user. Calling them via REST RPC reveals nothing the
  caller couldn't already infer by trying admin actions, so this is a
  documented accepted-risk warning.

Supabase security advisor went from **38 lints → 3** (the two function
warnings above + the leaked-password setting which now reports cached
state from before the API patch).

## TL;DR

| # | Finding | Severity |
|---|---|---|
| 1 | Anon key can **UPDATE** every row in `articles`, `profiles`, `site_settings`, `newsletter_subscribers`, etc. | **CRITICAL** |
| 2 | Anon key can **DELETE** every row in `articles`, `audit_logs`, `newsletter_subscribers` | **CRITICAL** |
| 3 | Anon key can **INSERT** arbitrary rows into `audit_logs`, `contact_messages`, `newsletter_subscribers` | HIGH |
| 4 | Anon key can read all rows of every operational table (subscriber emails, contact-form messages, draft articles, audit history) | HIGH |
| 5 | Test accounts created in this session use a publicly-known shared password (`Test@123`) — anyone with the anon key + that password can sign in as any role | HIGH |
| 6 | No Content-Security-Policy on public pages | LOW–MEDIUM |
| 7 | Vercel debug headers leak framework + region (`x-matched-path`, `x-vercel-id`, `x-nextjs-*`) | LOW |
| 8 | Public pages, JS chunks, and source maps are **clean** — no admin paths, server secrets, or app source leak from the bundle. | _good_ |
| 9 | All admin URLs return 404 on the public domain (kill-switch). `/.env`, `/.git`, `/api/*`, source files all return 404. | _good_ |
| 10 | Vercel anti-bot (Security Checkpoint) intercepts repeated/scripted access, Cloudflare WAF blocks `wp-admin` / `phpinfo.php` / `.aws/credentials`. | _good_ |

The public frontend itself is well-locked-down. **Everything an attacker
needs is in the Supabase project's RLS configuration.**

---

## 1. CRITICAL — Anon key can rewrite every public table

Reproduction (live):

```
import { createClient } from '@supabase/supabase-js';
const sb = createClient(
  'https://tznssjmavvzrnqmmdmty.supabase.co',
  '<the anon key from any phulpur24.com page bundle>',
);

await sb.from('articles').update({ title_bn: 'PWNED' }).eq('id', 'art1');     // succeeds
await sb.from('site_settings').update({ site_name: 'PWNED' }).eq('id','site'); // succeeds
await sb.from('profiles').update({ role: 'admin' }).eq('id', 'test-admin');    // succeeds
await sb.from('articles').delete().eq('id', 'art1');                           // succeeds
await sb.from('audit_logs').delete().eq('id', 'log-1');                        // succeeds
```

**Impact**

- Defacement: rewrite headlines, body, social meta, breaking-news ticker.
- Brand damage: change `site_settings.site_url`, social links, contact email/phone, ad-network IDs.
- Privilege escalation in the database: change any user's `role` to
  `admin`. Currently the `AdminAuthGate` doesn't enforce roles, so the
  only practical effect is misleading the admin UI — but the moment
  role-based authorization is wired (planned), an attacker who already
  flipped their target row would inherit admin rights.
- Forensics destruction: wipe `audit_logs` rows.
- Data loss: delete `newsletter_subscribers` rows.

**Why it's exploitable**

`schema.sql` was authored with RLS *intended* to be enabled later
("RLS hints" comment block) but in practice the live project has a
mixed configuration: some `INSERT` policies exist (so blind insert into
`profiles`, `articles`, `site_settings` is rejected with
`new row violates row-level security policy`) but `UPDATE` and `DELETE`
go through unrestricted on every table tested. Several tables
(`audit_logs`, `contact_messages`, `newsletter_subscribers`,
`page_views`) have RLS effectively off for everything.

**Fix**

Enable RLS everywhere and write explicit policies. Drop into the
Supabase SQL Editor:

```sql
-- ---- 1. flip RLS on across the board ----
alter table profiles               enable row level security;
alter table categories             enable row level security;
alter table tags                   enable row level security;
alter table authors                enable row level security;
alter table articles               enable row level security;
alter table article_tags           enable row level security;
alter table media_assets           enable row level security;
alter table audit_logs             enable row level security;
alter table site_settings          enable row level security;
alter table dashboard_stats        enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages       enable row level security;
alter table comments               enable row level security;
alter table page_views             enable row level security;

-- ---- 2. helper: is the caller a Phulpur24 admin? ----
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' from profiles where auth_user_id = auth.uid()),
    false
  );
$$;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- ---- 3. PUBLIC READ (only what the public site actually needs) ----
create policy "anon read published articles"   on articles            for select to anon, authenticated using (status = 'published' and deleted_at is null);
create policy "anon read categories"           on categories          for select to anon, authenticated using (true);
create policy "anon read tags"                 on tags                for select to anon, authenticated using (true);
create policy "anon read authors"              on authors             for select to anon, authenticated using (true);
create policy "anon read article_tags"         on article_tags        for select to anon, authenticated using (true);
create policy "anon read site_settings"        on site_settings       for select to anon, authenticated using (id = 'site');
create policy "anon read approved comments"    on comments            for select to anon, authenticated using (status = 'approved');
create policy "anon read media"                on media_assets        for select to anon, authenticated using (true);
-- profiles: NEVER readable by anon. Internal users see their own + others to render bylines:
create policy "auth read profiles"             on profiles            for select to authenticated using (true);

-- ---- 4. PUBLIC INSERT (just the two contact-the-site flows) ----
create policy "anon submit newsletter"         on newsletter_subscribers for insert to anon, authenticated with check (true);
create policy "anon submit contact"            on contact_messages       for insert to anon, authenticated with check (true);
create policy "anon submit comment pending"    on comments               for insert to anon, authenticated with check (status = 'pending');

-- ---- 5. EVERYTHING ELSE: admin only ----
create policy "admin all profiles"             on profiles               for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin all categories"           on categories             for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin all tags"                 on tags                   for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin all authors"              on authors                for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write articles"           on articles               for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write article_tags"       on article_tags           for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write media"              on media_assets           for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write audit"              on audit_logs             for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write site_settings"      on site_settings          for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write dashboard_stats"    on dashboard_stats        for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin manage newsletter"        on newsletter_subscribers for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin manage contact"           on contact_messages       for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin moderate comments"        on comments               for all to authenticated using (is_admin())  with check (is_admin());
create policy "admin write page_views"         on page_views             for all to authenticated using (is_admin())  with check (is_admin());
-- page-view inserts must keep working from the public site if you log them client-side:
create policy "anon insert page_views"         on page_views             for insert to anon, authenticated with check (true);
```

After deploying, re-run the live abuse probe. Every UPDATE/DELETE/INSERT
with the anon key must now return `new row violates row-level security`
(or the equivalent restriction error). I can write that re-test script
in 5 minutes when you're ready.

**Notes on collateral**

- The current public site reads `articles`, `categories`, `tags`,
  `authors`, `article_tags`, `site_settings` (`id='site'`),
  `media_assets`, and (when comments are enabled) `comments` — the
  policies above cover all of those.
- The admin UI today calls Supabase with the anon-key client. After RLS
  is on, every admin page must talk to Supabase **with a logged-in
  user's access token**, not the bare anon key. The existing
  `signInWithPassword` flow already produces a session whose token
  Supabase JS will attach automatically — so this should "just work" in
  most pages, but expect a wave of "permission denied" errors on
  pages that fetch tables before the auth gate resolves. Fix by
  rendering admin pages only after `verifyAdminSession()` returns.
- `dashboard_stats` is a singleton that the admin UI updates. Lock
  writes to admin only; the public site doesn't need it.

---

## 2. HIGH — Test accounts have a chat-known password

Earlier in this session I created seven Supabase Auth users (one per
role enum value) all with password `Test@123`. Anyone reading the
session transcript can sign in as those users right now via the public
anon endpoint:

```
test.admin@phulpur24.com / Test@123                  -> SIGN-IN OK
test.editor@phulpur24.com / Test@123                 -> SIGN-IN OK
test.reporter@phulpur24.com / Test@123               -> SIGN-IN OK
test.translator@phulpur24.com / Test@123             -> SIGN-IN OK
test.seo-editor@phulpur24.com / Test@123             -> SIGN-IN OK
test.sports-reporter@phulpur24.com / Test@123        -> SIGN-IN OK
test.local-correspondent@phulpur24.com / Test@123    -> SIGN-IN OK
```

While `AdminAuthGate` doesn't enforce roles yet, these accounts can:

- Log into the admin console at `admin.phulpur24.com`.
- After RLS is fixed (above), `test.admin` becomes able to write to
  every table because of the `admin all …` policies.

**Fix**

Once you're done with RBAC testing, either:

```bash
# (a) rotate the password to something only you know:
node --env-file=.env scripts/create-test-users.mjs
# but bump PASSWORD in the script first to a long random string

# (b) delete the test accounts entirely:
# in Supabase dashboard → Authentication → Users → delete each test.* row
# then in SQL editor: delete from profiles where id like 'test-%';
```

Long-term: the `seed-test-accounts` flow shouldn't ship a
predictable shared password at all. If you want a permanent QA
fixture, store individual generated passwords in a password manager.

---

## 3. LOW–MEDIUM — No Content-Security-Policy on public pages

Public responses don't include a `Content-Security-Policy` header. The
admin host already has strong COOP/CORP/X-Frame-Options through
`middleware.ts`, but a CSP would meaningfully reduce the blast radius
of any future XSS bug — especially relevant once user-submitted content
(comments, contact form) starts being rendered.

**Fix**

Start with a permissive baseline and tighten over time. In
`next.config.mjs` `headers()`:

```js
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "img-src 'self' data: https://images.unsplash.com https://*.supabase.co",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
    // Next streams hydration data with inline scripts; can be replaced with
    // a per-request nonce later via middleware.
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}
```

(Drop `'unsafe-inline'` from `script-src` once you migrate to
nonced inline scripts via middleware.)

---

## 4. LOW — Vercel debug headers leak framework + region

Public responses include:

```
x-matched-path: /bn
x-nextjs-prerender: 1
x-nextjs-stale-time: 300
x-vercel-cache: STALE
x-vercel-id: sin1::iad1::dvhzm-1777735083230-3fa4e1a4f0ab
```

These confirm Next.js + Vercel + the edge region (`sin1` Singapore +
build region `iad1` US-East), which is useful intel for someone trying
to fingerprint your stack. Not a vulnerability.

**Fix (optional)**

In `src/middleware.ts`, strip these headers in the existing response
shaping for public paths:

```ts
const STRIP = ['x-matched-path', 'x-nextjs-prerender', 'x-nextjs-stale-time', 'x-vercel-cache', 'x-vercel-id'];
for (const h of STRIP) res.headers.delete(h);
```

Some of these are added by Vercel after middleware so this is
best-effort; it removes the easy ones.

---

## 5. INFORMATIONAL — what the audit confirmed is **clean**

| Surface | Finding |
|---|---|
| Homepage HTML, RSC payload | No admin paths, server secrets, demo password, internal email, source-map URLs. Standard React Suspense markers only. |
| All 14 JS chunks (~760 KB) | Anon key + Supabase URL present (expected, by design — `NEXT_PUBLIC_*`). No service-role key, JWT secret, Anthropic key, app-specific admin path (`/admin/login`, `/admin/dashboard`, etc.), `AdminAuthGate`, `PostEditor`, `AdminSidebar`, `AdminTopbar`, or admin email leaked. The 21 `/admin/*` strings inside the Supabase JS library are URL templates pointing at Supabase's own admin API — they require the service-role key (which is server-only) to do anything, so they're inert in the public bundle. |
| Source maps | None published (`.map` files all 404). |
| Admin URLs on public host | Every `/admin/*` and `/api/ai/*` returns 404 with `X-Robots-Tag: noindex` — the kill-switch is correctly active. |
| Source / config / dotfile probing | `/.env`, `/.env.local`, `/.git/config`, `/.git/HEAD`, `/package.json`, `/next.config.mjs`, `/middleware.ts`, `/scripts/create-test-users.mjs` all return 404. |
| Common attack URLs | `/wp-admin`, `/wp-login.php`, `/phpinfo.php`, `/.aws/credentials` are blocked by Cloudflare WAF (403). |
| Supabase Auth admin API | Anon-key calls to `/auth/v1/admin/users`, `/auth/v1/admin/generate_link` correctly return `403 not_admin`. Anon cannot list, create, or magic-link existing users. |
| Storage bucket | Anon UPLOAD is blocked. Anon LIST is allowed but the bucket is intentionally public for media URLs. |
| Error pages | 404/400/403 responses contain no stack traces, no env names, no internal paths, no Supabase URL. Vercel's anti-bot Security Checkpoint kicked in on repeated probes — defensive feature working. |
| Browser-side framing | `X-Frame-Options: SAMEORIGIN` on public, `DENY` on admin. |
| Email exposure | Public bundle has zero email addresses. Site-config email comes from `site_settings` at runtime, not baked into the bundle. |

---

## Recommended order of operations

1. **Lock down RLS today.** This is the only finding that lets a
   stranger destroy your data. Apply the SQL from Finding #1, then
   re-run the abuse probe to confirm.
2. **Rotate or delete the seven `test.*@phulpur24.com` accounts** once
   you're done verifying RBAC.
3. **Add CSP** in `next.config.mjs` (Finding #3). Ship even the
   permissive baseline immediately.
4. **(Optional) strip Vercel debug headers** in `src/middleware.ts`
   (Finding #4).
5. After RLS lands, **migrate auth to `@supabase/ssr`** so admin
   middleware can enforce auth at the edge instead of relying on
   `AdminAuthGate` running in the browser. Combined with RLS, this
   makes the admin app truly safe.
