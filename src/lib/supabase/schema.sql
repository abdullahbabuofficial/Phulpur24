-- =========================================================================
--  Phulpur24 Supabase schema (canonical source of truth)
--  Reflects what's deployed to project tznssjmavvzrnqmmdmty (Megagine).
--  Use this file as the migration when you provision a fresh project.
--
--  All ID columns are TEXT so the seed mirrors the legacy mock data
--  (`'admin'`, `'art1'`, `'c1'`, `'a1'`, `'t1'`, `'media-…'`, `'log-…'`).
--  When real Supabase Auth is wired, profiles.auth_user_id is the FK
--  back to auth.users.
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'post_status') then
    create type post_status as enum ('draft', 'pending', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'translation_status') then
    create type translation_status as enum ('complete', 'partial', 'missing');
  end if;
  if not exists (select 1 from pg_type where typname = 'media_type') then
    create type media_type as enum ('image', 'video');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_status') then
    create type user_status as enum ('active', 'invited', 'suspended');
  end if;
  if not exists (select 1 from pg_type where typname = 'lang') then
    create type lang as enum ('bn', 'en');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'admin', 'editor', 'reporter', 'translator',
      'seo_editor', 'sports_reporter', 'local_correspondent'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'moderation_status') then
    create type moderation_status as enum ('pending', 'approved', 'rejected', 'spam');
  end if;
end $$;

-- ---------- profiles ----------
create table if not exists profiles (
  id text primary key,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'reporter',
  avatar_url text,
  status user_status not null default 'active',
  articles_count int not null default 0,
  last_seen_at timestamptz,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists profiles_auth_user_id_idx on profiles (auth_user_id);

-- ---------- categories ----------
create table if not exists categories (
  id text primary key,
  slug text not null unique,
  name_bn text not null,
  name_en text not null,
  color text not null default '#4F46E5',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- tags ----------
create table if not exists tags (
  id text primary key,
  slug text not null unique,
  name_bn text not null,
  name_en text not null,
  created_at timestamptz not null default now()
);

-- ---------- authors ----------
create table if not exists authors (
  id text primary key,
  name_bn text not null,
  name_en text not null,
  role text not null,
  avatar_url text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- articles ----------
create table if not exists articles (
  id text primary key,
  slug text not null unique,
  title_bn text not null,
  title_en text not null,
  subtitle_bn text not null default '',
  subtitle_en text not null default '',
  body_bn text not null default '',
  body_en text not null default '',
  category_id text not null references categories(id),
  author_id text not null references authors(id),
  cover_image_url text not null default '',
  cover_image_caption text not null default '',
  reading_time_bn int not null default 1,
  reading_time_en int not null default 1,
  views int not null default 0,
  status post_status not null default 'draft',
  translation_status translation_status not null default 'missing',
  seo_score int not null default 0,
  seo_title text,
  seo_description text,
  seo_focus_keyword text,
  featured boolean not null default false,
  breaking boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists articles_status_idx on articles (status);
create index if not exists articles_category_id_idx on articles (category_id);
create index if not exists articles_published_at_idx on articles (published_at desc);
create index if not exists articles_deleted_at_idx on articles (deleted_at);

-- ---------- article_tags (M:N) ----------
create table if not exists article_tags (
  article_id text not null references articles(id) on delete cascade,
  tag_id text not null references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- ---------- media library ----------
create table if not exists media_assets (
  id text primary key,
  filename text not null,
  url text not null,
  type media_type not null default 'image',
  size_bytes bigint not null default 0,
  size_label text not null default '',
  uploaded_by text not null default '',
  uploaded_at timestamptz not null default now(),
  alt_text text,
  optimization_meta jsonb
);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'media_assets' and column_name = 'optimization_meta'
  ) then
    alter table public.media_assets add column optimization_meta jsonb;
  end if;
end $$;

-- ---------- audit log ----------
create table if not exists audit_logs (
  id text primary key,
  action text not null,
  user_name text not null,
  target text not null default '',
  icon text not null default 'activity',
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);

-- ---------- site settings (singleton id='site') ----------
create table if not exists site_settings (
  id text primary key default 'site',
  site_name text not null,
  site_url text not null,
  default_language lang not null default 'bn',
  logo_url text not null default '',
  logo_dark_url text not null default '',
  logo_alt text not null default 'Phulpur24',
  favicon_url text not null default '',
  tagline_bn text not null,
  tagline_en text not null,
  description_bn text not null default '',
  description_en text not null default '',
  meta_title_bn text not null default 'Phulpur24',
  meta_title_en text not null default 'Phulpur24',
  meta_title_suffix text not null default '',
  meta_description text not null default '',
  enable_sitemap boolean not null default true,
  enable_ads boolean not null default true,
  enable_newsletter boolean not null default true,
  enable_comments boolean not null default false,
  adsense_id text not null default '',
  social jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'logo_url'
  ) then
    alter table public.site_settings add column logo_url text not null default '';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'logo_dark_url'
  ) then
    alter table public.site_settings add column logo_dark_url text not null default '';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'logo_alt'
  ) then
    alter table public.site_settings add column logo_alt text not null default 'Phulpur24';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'favicon_url'
  ) then
    alter table public.site_settings add column favicon_url text not null default '';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'meta_title_bn'
  ) then
    alter table public.site_settings add column meta_title_bn text not null default 'Phulpur24';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'site_settings' and column_name = 'meta_title_en'
  ) then
    alter table public.site_settings add column meta_title_en text not null default 'Phulpur24';
  end if;
end $$;

-- ---------- dashboard stats (singleton id='stats') ----------
create table if not exists dashboard_stats (
  id text primary key default 'stats',
  published_posts int not null default 0,
  drafts int not null default 0,
  pending_review int not null default 0,
  today_views int not null default 0,
  seo_issues int not null default 0,
  translation_pending int not null default 0,
  weekly_views jsonb not null default '[]'::jsonb,
  monthly_views jsonb not null default '[]'::jsonb,
  traffic_sources jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------- newsletter ----------
create table if not exists newsletter_subscribers (
  id text primary key,
  email text not null unique,
  lang lang not null default 'bn',
  source text not null default 'public-site',
  status text not null default 'active',
  subscribed_at timestamptz not null default now()
);
create index if not exists newsletter_subscribed_at_idx on newsletter_subscribers (subscribed_at desc);

-- ---------- contact messages ----------
create table if not exists contact_messages (
  id text primary key,
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  lang lang not null default 'bn',
  status text not null default 'unread',
  created_at timestamptz not null default now()
);
create index if not exists contact_created_at_idx on contact_messages (created_at desc);

-- ---------- comments ----------
create table if not exists comments (
  id text primary key,
  article_id text not null references articles(id) on delete cascade,
  parent_id text references comments(id) on delete cascade,
  author_name text not null,
  author_email text not null default '',
  body text not null,
  status moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists comments_article_idx on comments (article_id, created_at desc);
create index if not exists comments_status_idx on comments (status);

-- ---------- page views (analytics signal) ----------
create table if not exists page_views (
  id bigserial primary key,
  article_id text references articles(id) on delete set null,
  path text not null,
  lang lang,
  referrer text,
  viewed_at timestamptz not null default now()
);
create index if not exists page_views_viewed_at_idx on page_views (viewed_at desc);
create index if not exists page_views_article_idx on page_views (article_id);

-- ---------- triggers ----------
create or replace function bump_article_views()
returns trigger
language plpgsql
as $$
begin
  if new.article_id is not null then
    update articles set views = views + 1 where id = new.article_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_page_views_bump on page_views;
create trigger trg_page_views_bump
after insert on page_views
for each row execute function bump_article_views();

-- ---------- storage bucket ----------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

-- Permissive storage policies (tighten with RLS once real Auth lands)
do $$
begin
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media public read') then
    drop policy "media public read" on storage.objects;
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media anon insert') then
    drop policy "media anon insert" on storage.objects;
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='media owner delete') then
    drop policy "media owner delete" on storage.objects;
  end if;
end $$;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media anon insert" on storage.objects for insert to anon, authenticated with check (bucket_id = 'media');
create policy "media owner delete" on storage.objects for delete to anon, authenticated using (bucket_id = 'media');

-- ---------- privileges ----------
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ---------- RLS ----------
-- The live project has RLS enabled on every public.* table with role-aware
-- policies. The canonical migrations that produced that state are stored
-- in Supabase migration history:
--   1) lock_down_rls_role_aware                 — drops permissive policies,
--      adds is_admin()/is_staff() helpers, recreates all policies as
--      "anon read what's intentionally public" + "admin all the rest".
--   2) rls_tighten_anon_inserts_and_definer_funcs — adds WITH CHECK
--      validation on newsletter / contact_messages / page_views inserts.
--   3) rls_restore_definer_func_execute         — keeps EXECUTE on
--      is_admin/is_staff for the `authenticated` role so RLS expressions
--      resolve when admins call protected tables.
--
-- Helper functions used by every authenticated policy:
--   public.is_admin()  -> true if profiles.role = 'admin' for auth.uid()
--   public.is_staff()  -> true if profiles.role is any of the 7 enum roles
--
-- When provisioning a fresh project, apply the three migrations in order
-- after seeding base data. Storage bucket `media` is public-read via URL
-- (no SELECT policy on storage.objects); INSERT/DELETE require is_staff().
