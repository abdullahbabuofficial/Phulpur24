/**
 * Public-site data adapter.
 *
 * Wraps the Supabase repository layer and maps snake_case DB rows back to
 * the legacy camelCase `Article` / `Category` / `Tag` / `Author` shapes that
 * the existing public pages and components expect.
 *
 * All exports are async — public pages should be `async` server components
 * and `await` these helpers at the top of their render.
 */

import { supabase } from './supabase/client';
import type {
  ArticleRow,
  ArticleWithRelations,
  AuthorRow,
  CategoryRow,
  TagRow,
} from './supabase/types';
import type { Article, Author, Category, Tag } from './types';

const ARTICLE_SELECT = `
  *,
  category:categories(*),
  author:authors(*),
  article_tags(tag:tags(*))
`;

// ---------- mappers ----------

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameBn: row.name_bn,
    nameEn: row.name_en,
    color: row.color,
  };
}

function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    slug: row.slug,
    nameBn: row.name_bn,
    nameEn: row.name_en,
  };
}

function toAuthor(row: AuthorRow): Author {
  return {
    id: row.id,
    nameBn: row.name_bn,
    nameEn: row.name_en,
    role: row.role,
    avatar: row.avatar_url,
    bio: row.bio,
  };
}

function toArticle(row: ArticleWithRelations): Article {
  return {
    id: row.id,
    slug: row.slug,
    titleBn: row.title_bn,
    titleEn: row.title_en,
    subtitleBn: row.subtitle_bn,
    subtitleEn: row.subtitle_en,
    bodyBn: row.body_bn,
    bodyEn: row.body_en,
    category: toCategory(row.category),
    tags: (row.tags ?? []).map(toTag),
    author: toAuthor(row.author),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingTimeBn: row.reading_time_bn,
    readingTimeEn: row.reading_time_en,
    image: row.cover_image_url,
    imageCaption: row.cover_image_caption,
    featured: row.featured,
    breaking: row.breaking,
    views: row.views,
    status: row.status === 'archived' ? 'draft' : (row.status as Article['status']),
    seoScore: row.seo_score,
    translationStatus: row.translation_status,
  };
}

// Flatten Supabase's join shape `article_tags: [{ tag: TagRow }]` into a
// flat `tags: TagRow[]` before mapping to legacy Article.
function flatten(row: Record<string, unknown>): ArticleWithRelations {
  const joins = (row.article_tags as Array<{ tag: unknown }> | undefined) ?? [];
  const tags = joins.map((j) => j.tag);
  const { article_tags, ...rest } = row as { article_tags?: unknown };
  void article_tags;
  return { ...(rest as ArticleWithRelations), tags } as ArticleWithRelations;
}

// ---------- public helpers ----------

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[data.getCategories]', error);
    return [];
  }
  return ((data ?? []) as CategoryRow[]).map(toCategory);
}

export async function getAuthors(): Promise<Author[]> {
  const { data } = await supabase.from('authors').select('*').order('name_en');
  return ((data ?? []) as AuthorRow[]).map(toAuthor);
}

export async function getTags(): Promise<Tag[]> {
  const { data } = await supabase.from('tags').select('*').order('name_en');
  return ((data ?? []) as TagRow[]).map(toTag);
}

export async function getFeaturedArticles(limit = 5): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) console.error('[data.getFeaturedArticles]', error);
  return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
}

export async function getLatestArticles(limit = 10): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) console.error('[data.getLatestArticles]', error);
  return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
}

export async function getPopularArticles(limit = 5): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit);
  if (error) console.error('[data.getPopularArticles]', error);
  return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
}

export async function getArticlesByCategory(categorySlug: string, limit?: number): Promise<Article[]> {
  // Resolve slug to id first
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle();
  if (!cat) return [];

  let query = supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('category_id', cat.id)
    .order('published_at', { ascending: false });
  if (typeof limit === 'number') query = query.limit(limit);

  const { data, error } = await query;
  if (error) console.error('[data.getArticlesByCategory]', error);
  return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
  return data ? toCategory(data as CategoryRow) : null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) console.error('[data.getArticleBySlug]', error);
  if (!data) return null;
  return toArticle(flatten(data as Record<string, unknown>));
}

export async function getRelatedArticles(article: Article, limit = 4): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('category_id', article.category.id)
    .neq('id', article.id)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) console.error('[data.getRelatedArticles]', error);
  return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
}

export async function searchPublishedArticles(query: string): Promise<Article[]> {
  const q = query.trim();
  if (!q) return [];
  const wildcard = `%${q}%`;
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .or(
      `title_bn.ilike.${wildcard},title_en.ilike.${wildcard},subtitle_bn.ilike.${wildcard},subtitle_en.ilike.${wildcard},slug.ilike.${wildcard}`
    )
    .order('published_at', { ascending: false })
    .limit(50);
  if (error) console.error('[data.searchPublishedArticles]', error);
  return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
}

export async function getAllPublishedSlugs(): Promise<{ slug: string }[]> {
  const { data } = await supabase.from('articles').select('slug').eq('status', 'published');
  return ((data ?? []) as Pick<ArticleRow, 'slug'>[]).map((r) => ({ slug: r.slug }));
}

export async function getBreakingNewsItems(): Promise<{ bn: string[]; en: string[] }> {
  const { data } = await supabase
    .from('articles')
    .select('title_bn, title_en')
    .eq('status', 'published')
    .eq('breaking', true)
    .order('published_at', { ascending: false })
    .limit(6);

  const rows = ((data ?? []) as { title_bn: string; title_en: string }[]) ?? [];
  if (rows.length === 0) {
    return {
      bn: [
        'ফুলপুরে নতুন সড়ক উন্নয়ন প্রকল্পের কাজ শুরু হয়েছে',
        'বন্যা প্রস্তুতিতে ময়মনসিংহে সতর্কতা জারি',
      ],
      en: [
        'Road development project begins in Phulpur',
        'Flood preparedness alert issued in Mymensingh',
      ],
    };
  }
  return {
    bn: rows.map((r) => r.title_bn),
    en: rows.map((r) => r.title_en),
  };
}
