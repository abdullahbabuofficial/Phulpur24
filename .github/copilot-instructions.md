# Phulpur24 Copilot Instructions

Phulpur24 is a frontend-only bilingual Bangla/English news platform for Phulpur, Mymensingh, Bangladesh. It is built with Next.js 15 App Router, React 18, TypeScript, and Tailwind CSS. The app uses realistic mock data only; do not add a real backend, database, auth provider, or external API integration unless the task explicitly asks for it.

## Project Map

- `src/app/bn` and `src/app/en` contain localized public routes.
- `src/app/admin` contains the mock editorial CMS/dashboard.
- `src/components/layout` contains shared public/admin layout components.
- `src/components/articles`, `src/components/common`, `src/components/admin`, and `src/components/pages` contain reusable UI.
- `src/lib/mock-data.ts` is the source of articles, categories, authors, tags, ads, media, and dashboard demo data.
- `src/lib/i18n.ts` contains language helpers.

## Commands

Use Node.js 20 or newer.

```bash
npm ci
npm run lint
npx tsc --noEmit
npm audit
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

`next lint` is deprecated in Next.js 16, but this project still uses it through `npm run lint`.

Do not run `npm run build` while `npm run dev` is serving the same checkout. Both mutate `.next`, which can corrupt the dev server cache and cause transient 500s. Stop dev, remove `.next`, run the build, then restart dev.

## Implementation Rules

- Keep the public site bilingual. When adding a Bangla public route, add the corresponding English route when practical.
- Preserve existing brand colors and typography from `tailwind.config.ts` and README.
- Use existing component patterns before creating new abstractions.
- Keep mock/demo data labeled and deterministic.
- Keep admin behavior frontend-only; login and forms are prototypes.
- Avoid large framework migrations unless the issue specifically requests them.
- If `npm audit` reports a vulnerable transitive dependency, prefer the smallest safe override or patch instead of major downgrades/upgrades.

## Validation Expectations

For UI or route changes, verify representative routes locally when possible:

- `/bn`
- `/en`
- `/bn/news/phulpur-road-development-project`
- `/en/category/local`
- `/bn/about`
- `/en/contact`
- `/admin/dashboard`
- `/admin/posts/art1`

Before opening or updating a PR, run lint, TypeScript, audit, and build unless the task is documentation-only.
