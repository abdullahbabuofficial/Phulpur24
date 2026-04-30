/**
 * Supabase row types — mirror real Postgres schema (snake_case columns).
 * When you swap the mock client for `@supabase/supabase-js`, these types
 * map directly onto your `Database` definition.
 *
 * Table list:
 *   profiles, categories, tags, authors, articles, article_tags,
 *   media_assets, audit_logs, dashboard_stats, site_settings
 */

export type PostStatus = 'draft' | 'pending' | 'published' | 'archived';
export type TranslationStatus = 'complete' | 'partial' | 'missing';
export type MediaType = 'image' | 'video';
export type UserStatus = 'active' | 'invited' | 'suspended';
export type Lang = 'bn' | 'en';

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'reporter' | 'translator' | 'seo_editor' | 'sports_reporter' | 'local_correspondent';
  avatar_url: string | null;
  status: UserStatus;
  articles_count: number;
  last_seen_at: string | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name_bn: string;
  name_en: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface TagRow {
  id: string;
  slug: string;
  name_bn: string;
  name_en: string;
  created_at: string;
}

export interface AuthorRow {
  id: string;
  name_bn: string;
  name_en: string;
  role: string;
  avatar_url: string;
  bio: string;
  created_at: string;
}

export interface ArticleRow {
  id: string;
  slug: string;
  title_bn: string;
  title_en: string;
  subtitle_bn: string;
  subtitle_en: string;
  body_bn: string;
  body_en: string;
  category_id: string;
  author_id: string;
  cover_image_url: string;
  cover_image_caption: string;
  reading_time_bn: number;
  reading_time_en: number;
  views: number;
  status: PostStatus;
  translation_status: TranslationStatus;
  seo_score: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_focus_keyword: string | null;
  featured: boolean;
  breaking: boolean;
  published_at: string;
  updated_at: string;
  created_at: string;
}

export interface ArticleTagRow {
  article_id: string;
  tag_id: string;
}

export interface MediaAssetRow {
  id: string;
  filename: string;
  url: string;
  type: MediaType;
  size_bytes: number;
  size_label: string;
  uploaded_by: string;
  uploaded_at: string;
  alt_text: string | null;
}

export interface AuditLogRow {
  id: string;
  action: string;
  user_name: string;
  target: string;
  icon: string;
  created_at: string;
}

export interface DashboardStatsRow {
  published_posts: number;
  drafts: number;
  pending_review: number;
  today_views: number;
  seo_issues: number;
  translation_pending: number;
  weekly_views: number[];
  monthly_views: number[];
  traffic_sources: { source: string; pct: number }[];
}

export interface SiteSettingsRow {
  id: 'site';
  site_name: string;
  site_url: string;
  default_language: Lang;
  tagline_bn: string;
  tagline_en: string;
  description_bn: string;
  description_en: string;
  meta_title_suffix: string;
  meta_description: string;
  enable_sitemap: boolean;
  enable_ads: boolean;
  enable_newsletter: boolean;
  enable_comments: boolean;
  adsense_id: string;
  social: {
    facebook: string;
    twitter: string;
    youtube: string;
    instagram: string;
  };
  contact: {
    email: string;
    phone: string;
    address_bn: string;
    address_en: string;
    hours_bn?: string;
    hours_en?: string;
  };
  updated_at: string;
}

// New feature tables
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'spam';

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  lang: Lang;
  source: string;
  status: string;
  subscribed_at: string;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  lang: Lang;
  status: string;
  created_at: string;
}

export interface CommentRow {
  id: string;
  article_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string;
  body: string;
  status: ModerationStatus;
  created_at: string;
}

export interface PageViewRow {
  id: number;
  article_id: string | null;
  path: string;
  lang: Lang | null;
  referrer: string | null;
  viewed_at: string;
}

/**
 * Joined / hydrated views — what a `select(*, category:categories(*))` returns.
 */
export interface ArticleWithRelations extends ArticleRow {
  category: CategoryRow;
  author: AuthorRow;
  tags: TagRow[];
}

/**
 * Generic Supabase-style response wrapper.
 */
export interface SupabaseResponse<T> {
  data: T;
  error: null | { message: string; code?: string };
}
