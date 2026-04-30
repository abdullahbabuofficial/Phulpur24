# Frontend Completion Workflow

This workflow keeps public, admin, and shared Phulpur24 frontend work coordinated across AI agents.

## Agent Lanes

### Public Frontend Agent

Owns public routes and public chrome:

- `src/app/bn`
- `src/app/en`
- `src/app/search`
- `src/app/about`
- `src/app/contact`
- `src/components/layout/Header.tsx`
- `src/components/layout/Navigation.tsx`
- `src/components/layout/BreakingNewsTicker.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/pages`
- public helpers in `src/lib`

Primary checks:

- only published articles are publicly routable
- Bangla and English route parity stays intact
- search validates language and searches titles, subtitles, body, category, and tags
- article tag links preserve the active language
- navigation is keyboard and touch accessible
- shared chrome is localized

### Admin Core Agent

Owns the admin shell and post workflows:

- `src/app/admin/login`
- `src/app/admin/dashboard`
- `src/app/admin/posts`
- `src/components/layout/AdminSidebar.tsx`
- `src/components/layout/AdminTopbar.tsx`
- `src/components/admin/PostEditor.tsx`
- shared admin shell primitives

Primary checks:

- mock login, logout, and guarded admin shell work on the client
- post list filters, search, selection, and pagination are stateful
- post create/edit keeps a controlled draft state
- save/update/publish actions show a mock success state
- invalid admin IDs render an admin-focused recovery path

### Admin Secondary Agent

Owns secondary admin workflows:

- `src/app/admin/ai-writer`
- `src/app/admin/translation`
- `src/app/admin/seo`
- `src/app/admin/media`
- `src/app/admin/users`
- `src/app/admin/settings`

Primary checks:

- AI Writer uses tone and supports Bangla, English, and both-language output
- generated drafts can be handed to the post editor through local mock storage
- translation queue selection, auto-translate, save, and approve are stateful
- SEO issues are computed from mock articles and repair actions are visible
- media upload/search/filter/copy/delete/select are functional mock workflows
- user invite/edit/remove and settings save/reset are controlled workflows

## Final Validation

Run these before publishing:

```bash
npm run lint
npx tsc --noEmit
npm audit
npm run build
```

If the dev server is running, stop it before `npm run build`, remove `.next`, build, then restart dev:

```bash
rm -rf .next
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Verify representative routes:

- `/bn`
- `/en`
- `/bn/category/technology`
- `/en/category/local`
- `/bn/news/market-price-monitoring`
- `/en/news/phulpur-road-development-project`
- `/bn/about`
- `/en/contact`
- `/search?q=phulpur&lang=en`
- `/admin/login`
- `/admin/dashboard`
- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/art1`
- `/admin/posts/bad-id`
- `/admin/ai-writer`
- `/admin/translation`
- `/admin/seo`
- `/admin/media`
- `/admin/users`
- `/admin/settings`
