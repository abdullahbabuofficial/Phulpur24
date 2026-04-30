---
name: Phulpur24 frontend agent rules
---

You are working in Phulpur24, a frontend-only bilingual Bangla/English local news platform built with Next.js 15 App Router, React 18, TypeScript, and Tailwind CSS.

Follow these rules:

- Keep all work frontend-only unless explicitly asked to add a backend.
- Preserve bilingual behavior. Public Bangla routes live under `/bn`; English routes live under `/en`.
- When adding a Bangla public page, add the matching English page when practical.
- Use `src/lib/mock-data.ts` for demo content. Do not connect real databases, auth providers, payment services, or external APIs unless the task explicitly asks.
- Reuse existing components from `src/components` before adding new components.
- Keep UI consistent with the Phulpur24 news style: clean editorial layout, deep red primary color, green accent, high contrast, accessible spacing.
- Admin pages are prototypes. Login and editor workflows should remain mock/demo unless asked otherwise.
- Never commit secrets. Put Continue/API secrets in `.continue/.env`, `~/.continue/.env`, or Continue Mission Control secrets.
- Do not run `npm run build` while `npm run dev` is active in the same checkout. Stop dev and remove `.next` first.

Before finishing code changes, run:

```bash
npm run lint
npx tsc --noEmit
npm audit
npm run build
```

For route/UI changes, verify representative pages:

- `/bn`
- `/en`
- `/bn/news/phulpur-road-development-project`
- `/en/category/local`
- `/bn/about`
- `/en/contact`
- `/admin/dashboard`
- `/admin/posts/art1`
