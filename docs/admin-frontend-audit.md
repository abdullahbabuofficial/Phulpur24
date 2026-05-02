# Admin frontend audit — Phulpur24

**Scope:** All routes under `/admin/*`, shared shell (`AdminPageShell`, `AdminSidebar`, `AdminTopbar`), admin-specific components, and Supabase repositories they call.  
**Method:** Static review of source (no runtime penetration test).  
**Date:** 2026-05-02  

---

## Executive summary

The admin console is **substantially wired to live Supabase** for posts, settings, newsletter, contact messages, comments moderation, users listing, SEO tooling, translation workflow, and diagnostics. Strengths: coherent UI kit, bilingual post editor, AI writer + Anthropic integration with bearer-token checks, audit logging hooks on several mutations.

**Update (2026-05-02):** Items **(1)–(3)** and several **(5)** polish bugs were remediated in code: dashboard/analytics use live `page_views` where RLS allows (via cookie-backed server client on admin RSC routes), media uploads use Supabase Storage + DB rows, invites go through `POST /api/admin/invite` with the service role, comment tab counts are accurate, diagnostic uses a dynamic sample post, dashboard Refresh calls `router.refresh()`. Remaining notable gap: **RBAC in the UI** (still same nav for all roles; enforce in DB/RLS).

---

## Route inventory & maturity

| Route | Type | Data source | Maturity |
|-------|------|-------------|----------|
| `/admin` | redirect | — | OK → dashboard |
| `/admin/login` | client | Supabase Auth (+ optional demo flag) | Production-oriented |
| `/admin/dashboard` | **server** | `analytics`, `audit` | **Mixed** — KPI tiles partly fake (see §3) |
| `/admin/analytics` | **server** | `analytics` | **Mixed** — bounce rate & deltas fake |
| `/admin/posts` | client | `posts` | Strong |
| `/admin/posts/new`, `/admin/posts/[id]` | client | `posts`, categories, authors, tags | Strong |
| `/admin/ai-writer` | client | `/api/ai/draft` + Supabase session | Strong |
| `/admin/translation` | client | `posts` | Good; “Auto” fills template English |
| `/admin/seo` | client | `posts`, `audit` | Good; score is heuristic, not stored unless saved |
| `/admin/media` | client | `media` | **Weak** — uploads wrong path (§4) |
| `/admin/comments` | client | `comments` | Good; tab counts broken (§5) |
| `/admin/newsletter` | client | `newsletter` | Good — list, export CSV, delete |
| `/admin/messages` | client | `messages` | Good |
| `/admin/users` | client | `users` | **Weak** — invite is not real Auth invite (§4) |
| `/admin/settings` | client | `settings` | Strong |
| `/admin/diagnostic` | server | multiple repos | Good for smoke tests; **fragile** `art1` probe (§5) |

---

## 1. Mock, demo, and hard-coded presentation data

### Critical / high

1. **Dashboard stat tiles (`src/app/admin/dashboard/page.tsx`)**  
   - Values such as **`12 this week`**, **`2 from yesterday`**, **`8.3%`**, translation hints are **hard-coded strings**, not computed from the database or date ranges.  
   - Misleading for editorial decisions; should be removed or replaced with real week-over-week queries or omitted until analytics exist.

2. **Analytics page (`src/app/admin/analytics/page.tsx`)**  
   - **Bounce rate `42.3%`** and comparison deltas (**`8.3%`**, **`12.1%`**, **`3.2%`**) are **not sourced from any table or analytics pipeline**.  
   - **“This week” tile** multiplies `weekly_views` by `100`, which is almost certainly **not** “page views” (likely a chart scale mismatch).

3. **Traffic sources & time-series**  
   - `weekly_views`, `monthly_views`, and `traffic_sources` come from the **`dashboard_stats`** singleton merged with live article counts (`analytics.ts`). Unless a background job or trigger maintains those JSON columns from **real** `page_views` / referrer data, the charts remain **seed / placeholder quality**.  
   - **Action:** Either derive charts from `page_views` (and optionally referrer headers) in SQL/API, or label the UI clearly as “sample” until then.

### Medium

4. **`SUPABASE_MODE === 'mock'` (`src/lib/supabase/db.ts`)**  
   - Only indicates missing env at build time; not admin-specific. No runtime mock dataset in admin paths.

5. **Demo auth (`adminAuth.ts`, `NEXT_PUBLIC_ADMIN_ALLOW_DEMO`)**  
   - Intentional dev-only bypass; document that it must stay off in production (already in `docs/admin-security.md`).

6. **Translation “Auto” (`translation/page.tsx`)**  
   - Fills English fields with **templated placeholder sentences**, not machine translation. Fine if labeled “Draft filler”; risky if editors mistake it for quality translation.

7. **SEO score preview (`seo/page.tsx`)**  
   - `computeScore` adjusts from `a.seo_score` with penalties — **preview can diverge** from persisted DB score until user saves. Acceptable if understood as “what-if”.

### Low / cosmetic

8. **Default shell user (`AdminPageShell`, `AdminSidebar`)**  
   - Before hydration / missing session: **`admin@phulpur24.com` / `Admin`**. Brief flash or mismatch vs Supabase user; prefer loading skeleton or reading session synchronously after mount only (already partially handled).

9. **Audit / media logs**  
   - `logAction(..., 'Admin', ...)` uses a fixed display name rather than the signed-in profile — operational ambiguity in multi-user teams.

---

## 2. Incomplete, misleading, or risky CRUD flows

### Media upload — **broken for production**

- **UI:** `media/page.tsx` calls `mediaRepo.uploadMedia(...)` with **`URL.createObjectURL(file)`** as `url`.  
- **Repository:** `uploadMedia` inserts those URLs into `media_assets` — they are **browser-local blob URLs**, invalid for other users/devices and after refresh.  
- **Existing but unused:** `uploadFileToStorage(file)` in `repositories/media.ts` performs real **Supabase Storage** upload + public URL + DB row.  
- **Recommendation:** Switch the media page to **`uploadFileToStorage`** (and pass real `File` objects), revoke object URLs after upload, handle errors per file.

### Users — **invite is not Supabase Auth**

- **`inviteUser`** inserts a `profiles` row with **`id: invite-${Date.now()}`** and `status: 'invited'`.  
- There is **no** `auth.admin.inviteUserByEmail`, magic link, or email flow — the person cannot sign in unless a matching **`auth.users`** row exists and **`auth_user_id`** is linked.  
- **Remove / success toast** currently says **“Invitation sent”** — **misleading** (no email sent).  
- **`removeUser`** / UI disable use **`id === 'admin'`** — real admins use **UUID** ids; protection may **not** match any row (first admin could be deletable from UI unless RLS blocks).

### Categories, tags, authors

- **No dedicated admin screens** for CRUD on categories, tags, or authors.  
- Creation is partial: **new tags** can be created **inline from post editor** (`posts` repo); categories/authors appear **select-only** from existing rows.  
- For a professional CMS, expect **Settings → Taxonomy** or dedicated **Authors** admin.

### Posts

- **Strong:** list, filter, create, edit, statuses, tags, SEO fields, translation fields.  
- **Nice-to-have:** bulk actions, scheduled publish, revision history, trash/restore (schema has `deleted_at` — confirm UI exposes it).

### Comments / newsletter / messages

- **Comments:** approve/reject/spam/delete — adequate.  
- **Newsletter:** list, CSV export, delete — adequate; no double opt-in management UI, segments, or broadcast (may be out of scope).  
- **Messages:** read/archive/delete — adequate; no reply-from-console or assignment.

---

## 3. Missing “professional” features (prioritized backlog)

| Priority | Feature | Notes |
|----------|---------|--------|
| P0 | Real analytics from `page_views` | Powers dashboard/analytics honesty |
| P0 | Fix media upload path | Use Storage + public URLs |
| P0 | Real invite / onboarding | Supabase Auth invite or documented manual provisioning |
| P1 | RBAC in UI | Hide routes by `profiles.role`; enforce on server/middleware |
| P1 | Replace fake dashboard/analytics deltas | Or remove widgets until data exists |
| P1 | Taxonomy & authors admin | CRUD for categories, tags, authors |
| P2 | Scheduled publishing | `published_at` future — cron or edge schedule |
| P2 | Activity attribution | Pass real user name/email into `logAction` |
| P2 | Comments tab counts | Fix counts or fetch aggregate counts |
| P3 | Full-text search across posts in admin | Beyond current post list search |
| P3 | Export posts / backup | Operational resilience |

---

## 4. Bugs and inconsistencies

1. **Comments moderation tabs (`comments/page.tsx`)** — `counts` only sets **`all`** when `filter === 'all'`; other tabs show **no badge counts** (always undefined for pending/approved/etc.).  
2. **Diagnostic probe `posts.getPostById('art1')`** — assumes seed slug/id; fails if DB uses different IDs. Prefer **“fetch any published post id”** dynamically.  
3. **Dashboard “Refresh” button** — no handler; **non-functional** (same pattern may exist elsewhere).  
4. **Users roles card** — `rolePermissions` omits **`sports_reporter`** and **`local_correspondent`** (listed in select but not in permission blurbs).  
5. **Chart tooltips** — dashboard bar chart uses **`${v}K views`**; if `v` is already a small integer, label is wrong.  
6. **`Sidebar` “View public site”** — links to **`/bn`** only; English-first admins may expect `/en` or site default from settings.

---

## 5. Security & governance (admin-specific)

- **Client-only gate:** `AdminAuthGate` + cookie session; optional future **edge rejection** for `/admin/*` without session (see `docs/admin-security.md`).  
- **RLS:** Backend must remain authoritative; UI hiding routes is not security.  
- **Diagnostic page:** exposes internal probe names and DB health — consider **admin-only + optional env kill-switch** on production if paranoid.  
- **Service role:** not used in these pages (good); keep privileged scripts server-side only.

---

## 6. Deprecated / dead reference files

- `src/lib/mock-data.ts`, `src/lib/supabase/store.ts` — **empty deprecated stubs**, not imported. Safe to delete in a cleanup PR to avoid confusion.

---

## 7. Recommended next steps (ordered)

1. **Ship media fix:** wire UI to `uploadFileToStorage`; migrate away from blob URLs in DB.  
2. **Strip or compute dashboard/analytics deltas** — never show invented percentages.  
3. **Rewrite user invite UX:** either integrate **Supabase Auth Admin API** (service role on server route only) or rename button to **“Add pending profile”** + document manual Auth steps.  
4. **Fix primary-admin protection** — use **role + fixed auth user id** or env-configured safeguard, not `id === 'admin'`.  
5. **Derive `dashboard_stats` time series from `page_views`** (scheduled job or materialized refresh).  
6. **RBAC-aware navigation** — least privilege per role.  
7. **Polish:** comments counts, diagnostic dynamic post id, functional refresh buttons, chart labels.

---

## Appendix — files reviewed (non-exhaustive)

- `src/app/admin/**/*.tsx`  
- `src/components/admin/**/*.tsx`  
- `src/components/layout/AdminSidebar.tsx`, `AdminTopbar.tsx`  
- `src/lib/supabase/repositories/{analytics,media,users,posts,settings,newsletter,messages,comments,audit}.ts`  
- `src/lib/supabase/schema.sql` (profiles, dashboard_stats, media)

---

*End of report.*
