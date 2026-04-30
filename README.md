# Phulpur24 — সবার আগে ফুলপুরের খবর

**Phulpur24** is a production-grade, enterprise-level **bilingual news platform** (Bangla + English) for Phulpur, Mymensingh, Bangladesh. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Live Routes

### Public Frontend
| Route | Description |
|-------|-------------|
| `/` | Redirects to `/bn` |
| `/bn` | Bangla Homepage |
| `/en` | English Homepage |
| `/bn/news/[slug]` | Bangla Article Detail |
| `/en/news/[slug]` | English Article Detail |
| `/bn/category/[slug]` | Bangla Category Listing |
| `/en/category/[slug]` | English Category Listing |
| `/bn/about` | Bangla About Page |
| `/en/about` | English About Page |
| `/bn/contact` | Bangla Contact Page |
| `/en/contact` | English Contact Page |
| `/search` | Search Results |
| `/about` | Redirects to `/bn/about` |
| `/contact` | Redirects to `/bn/contact` |

### Admin Frontend
| Route | Description |
|-------|-------------|
| `/admin` | Redirects to `/admin/dashboard` |
| `/admin/login` | Login Page |
| `/admin/dashboard` | Dashboard Overview |
| `/admin/posts` | Posts List |
| `/admin/posts/[id]` | Edit Existing Post |
| `/admin/posts/new` | Create New Post |
| `/admin/ai-writer` | AI Writer |
| `/admin/translation` | Translation Center |
| `/admin/seo` | SEO Center |
| `/admin/media` | Media Library |
| `/admin/users` | Users & Roles |
| `/admin/analytics` | Analytics |
| `/admin/settings` | Site Settings |

## 🎨 Design System

### Brand Colors
- **Primary**: `#B91C1C` (deep news red)
- **Primary Dark**: `#7F1D1D`
- **Accent Green**: `#15803D`
- **Text Dark**: `#0F172A`
- **Muted Text**: `#64748B`
- **Border**: `#E2E8F0`
- **Surface**: `#FFFFFF`
- **Soft Background**: `#F8FAFC`

### Typography
- **Bangla**: Noto Sans Bengali
- **English / Admin**: Inter, system-ui

### Breakpoints
- Desktop: 1440px
- Tablet: 768px
- Mobile: 390px

## 🧩 Component Library

```
src/components/
├── layout/
│   ├── Header.tsx              — Main header with logo, search, language switcher
│   ├── Footer.tsx              — Footer with categories, links, social
│   ├── Navigation.tsx          — Nav with mega menu
│   ├── BreakingNewsTicker.tsx  — Red scrolling breaking news bar
│   ├── AdminSidebar.tsx        — Admin navigation sidebar
│   └── AdminTopbar.tsx         — Admin top bar
├── articles/
│   ├── ArticleCard.tsx         — 5 variants: lead, featured, horizontal, compact, sidebar
│   └── ArticleBody.tsx         — Article content renderer
├── common/
│   ├── Button.tsx              — Button variants
│   ├── Badge.tsx               — Category/status badges
│   ├── SearchModal.tsx         — Search overlay
│   ├── NewsletterSignup.tsx    — Newsletter form
│   ├── AdSlot.tsx              — Ad placeholder slots
│   ├── Breadcrumb.tsx          — Breadcrumb navigation
│   ├── Pagination.tsx          — Pagination component
│   └── LoadingSkeleton.tsx     — Loading skeleton states
└── admin/
    ├── StatCard.tsx            — Dashboard stat cards
    ├── PostEditor.tsx          — Rich text editor with 5 tabs
    ├── SEOPanel.tsx            — SEO score panel
    └── TranslationPanel.tsx    — Translation status panel
```

## Mock Data

- **20 articles** (mix of Bangla/English, all categories)
- **12 categories** (Local, National, Politics, Education, Sports, Technology, Entertainment, International, Health, Agriculture, Opinion, Video)
- **25 tags**
- **6 authors** (মাহমুদ হাসান, Nusrat Jahan, আরিফুল ইসলাম, Samira Rahman, তানভীর আহমেদ, Farhana Akter)
- **8 ad slots**
- **10 audit log entries**
- **12 media assets**
- **Dashboard analytics** (published: 247, drafts: 18, pending: 5, views: 12,847)

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000/bn](http://localhost:3000/bn) for the Bangla homepage.

## 🏗️ Build

```bash
npm run build
npm start
```

## 📁 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data**: Pure mock data (no backend required)
- **Fonts**: Noto Sans Bengali + Inter (via system fonts)

## 🔒 Note

This is a **frontend-only** demonstration. No real backend, database, or authentication is connected. All data is mock/demo data for design and prototyping purposes.
