# Advertising Media Inventory

This document lists all public-site ad placements, banner sizes, and the visibility rules.

## Visibility Rule (Implemented)

Ad slots are **hidden automatically** unless all conditions are true:

1. `enable_ads` is enabled in site settings (Admin → Settings → Ads).
2. `adsense_id` is set and starts with `ca-pub-`.
3. A matching slot ID exists for that banner size via env variable.

If any condition is missing, the slot does not render (no placeholder banner text).

## Required Environment Variables

Set these for production:

- `NEXT_PUBLIC_AD_SLOT_728X90`
- `NEXT_PUBLIC_AD_SLOT_300X250`
- `NEXT_PUBLIC_AD_SLOT_468X60`

Optional (already supported in settings):

- `adsense_id` in `site_settings` (must be `ca-pub-...`)

## Ad Size Matrix by Page

| Surface | Route(s) | Position | Size | Component |
|---|---|---|---|---|
| Global header | all public pages using `Header` | Top header center | `728x90` | `Header` + `AdSlot` |
| Home (EN/BN) | `/en`, `/bn` | Main content top block (below hero) | `728x90` | `AdSlot` |
| Home (EN/BN) | `/en`, `/bn` | Right sidebar (slot 1) | `300x250` | `AdSlot` |
| Home (EN/BN) | `/en`, `/bn` | Right sidebar (slot 2) | `300x250` | `AdSlot` |
| Category (EN/BN) | `/en/category/[slug]`, `/bn/category/[slug]` | Right sidebar | `300x250` | `AdSlot` |
| Article (EN/BN) | `/en/news/[slug]`, `/bn/news/[slug]` | In-article (after body section) | `468x60` | `AdSlot` |
| Article (EN/BN) | `/en/news/[slug]`, `/bn/news/[slug]` | Right sidebar (slot 1) | `300x250` | `AdSlot` |
| Article (EN/BN) | `/en/news/[slug]`, `/bn/news/[slug]` | Right sidebar (slot 2) | `300x250` | `AdSlot` |

## Technical Notes

- Shared visibility logic is centralized in: `src/lib/ads.ts`.
- Ad renderer component: `src/components/common/AdSlot.tsx`.
- Header ad uses the same shared rule to avoid inconsistent behavior.
- No slot ID for a size => that size is hidden everywhere.
