# Agent Guide

Use this file to work efficiently in Phulpur24.

Phulpur24 is a Next.js 15 App Router bilingual Bangla/English local news platform. **Public article/category data** is loaded via `src/lib/data.ts` → Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set; **`src/lib/mock-data.ts`** remains a rich offline demo reference. **Site branding** (name, taglines, social links, contact, ads/newsletter toggles) comes from the `site_settings` table (see `src/lib/supabase/schema.sql`) and is merged with optional browser `localStorage` overrides after admin saves.

Important paths:

- `src/app/bn` and `src/app/en`: localized public pages.
- `src/app/admin`: CMS/admin UI (client session gate + Supabase-backed pages where wired).
- `src/components`: shared UI components.
- `src/lib/data.ts`: public-site queries + mappers to legacy `Article` / `Category` types.
- `src/lib/mock-data.ts`: demo seed content (optional reference).
- `src/lib/site-config.shared.ts` + `SiteConfigProvider`: defaults and server-hydrated site config.
- `.github/copilot-instructions.md`: detailed build and repository instructions.

Standard validation:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm audit
npm run build
```

Development server:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Do not run `npm run build` at the same time as `npm run dev` in this checkout. Stop dev and clear `.next` first if you need a clean build.

Keep changes small, preserve bilingual routes, and extend data/features using the existing Supabase + repository patterns unless the task explicitly calls for a different stack.
