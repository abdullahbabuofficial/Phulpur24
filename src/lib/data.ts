/**
 * Public-site data adapter.
 *
 * Wraps the Supabase repository layer and maps snake_case DB rows back to
 * the legacy camelCase `Article` / `Category` / `Tag` / `Author` shapes that
 * the existing public pages and components expect.
 *
 * All exports are async - public pages should be `async` server components
 * and `await` these helpers at the top of their render.
 */

import { supabase } from './supabase/client';
import { unstable_cache } from 'next/cache';
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
  return getCategoriesCached();
}

const getCategoriesCached = unstable_cache(
  async (): Promise<Category[]> => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[data.getCategories]', error);
      return [];
    }
    return ((data ?? []) as CategoryRow[]).map(toCategory);
  },
  ['categories.v1'],
  { revalidate: 300, tags: ['categories'] }
);

export interface HomePageData {
  categories: Category[];
  featured: Article[];
  latest: Article[];
  popular: Article[];
  localNews: Article[];
  sportsNews: Article[];
  techNews: Article[];
  breaking: { bn: string[]; en: string[] };
}

export interface CategoryPageData {
  category: Category | null;
  categories: Category[];
  articles: Article[];
}

export interface ArticlePageData {
  article: Article | null;
  related: Article[];
  popular: Article[];
  categories: Category[];
}

function uniqueArticles(rows: Article[]): Article[] {
  const seen = new Set<string>();
  const out: Article[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

/**
 * Optimized homepage payload:
 * - one category query
 * - one recent published-article query
 * Then derive all homepage sections in memory.
 */
export async function getHomePageData(poolLimit = 80): Promise<HomePageData> {
  return getHomePageDataCached(poolLimit);
}

const getHomePageDataCached = unstable_cache(
  async (poolLimit: number): Promise<HomePageData> => {
  const [categoriesRes, publishedRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(poolLimit),
  ]);

  if (categoriesRes.error) {
    // eslint-disable-next-line no-console
    console.error('[data.getHomePageData.categories]', categoriesRes.error);
  }
  if (publishedRes.error) {
    // eslint-disable-next-line no-console
    console.error('[data.getHomePageData.published]', publishedRes.error);
  }

  const categories = ((categoriesRes.data ?? []) as CategoryRow[]).map(toCategory);
  const articles = ((publishedRes.data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);

  const featured = uniqueArticles([
    ...articles.filter((a) => a.featured),
    ...articles,
  ]).slice(0, 5);
  const latest = articles.slice(0, 8);
  const popular = [...articles].sort((a, b) => b.views - a.views).slice(0, 6);

  const localNews = articles.filter((a) => a.category.slug === 'local').slice(0, 4);
  const sportsNews = articles.filter((a) => a.category.slug === 'sports').slice(0, 3);
  const techNews = articles.filter((a) => a.category.slug === 'technology').slice(0, 3);

  const breakingRows = articles.filter((a) => a.breaking).slice(0, 6);
  const breaking = {
    bn: breakingRows.map((a) => a.titleBn),
    en: breakingRows.map((a) => a.titleEn),
  };

  return {
    categories,
    featured,
    latest,
    popular,
    localNews,
    sportsNews,
    techNews,
    breaking,
  };
  },
  ['home-page-data.v2'],
  { revalidate: 60, tags: ['home-page-data'] }
);

export async function getCategoryPageData(slug: string, limit?: number): Promise<CategoryPageData> {
  return getCategoryPageDataCached(slug, limit);
}

const getCategoryPageDataCached = unstable_cache(
  async (slug: string, limit?: number): Promise<CategoryPageData> => {
    const categories = await getCategoriesCached();
    const category = categories.find((c) => c.slug === slug) ?? null;
    if (!category) {
      return { category: null, categories, articles: [] };
    }

    let query = supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .eq('category_id', category.id)
      .order('published_at', { ascending: false });
    if (typeof limit === 'number') query = query.limit(limit);

    const { data, error } = await query;
    if (error) console.error('[data.getCategoryPageData]', error);
    const articles = ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
    return { category, categories, articles };
  },
  ['category-page-data.v1'],
  { revalidate: 60, tags: ['category-page-data'] }
);

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
  return getPopularArticlesCached(limit);
}

const getPopularArticlesCached = unstable_cache(
  async (limit: number): Promise<Article[]> => {
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(limit);
    if (error) console.error('[data.getPopularArticles]', error);
    return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
  },
  ['popular-articles.v1'],
  { revalidate: 60, tags: ['popular-articles'] }
);

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
  return getArticleBySlugCached(slug);
}

const getArticleBySlugCached = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();
    if (error) console.error('[data.getArticleBySlug]', error);
    if (!data) return null;
    return toArticle(flatten(data as Record<string, unknown>));
  },
  ['article-by-slug.v1'],
  { revalidate: 60, tags: ['article-by-slug'] }
);

export async function getRelatedArticles(article: Article, limit = 4): Promise<Article[]> {
  return getRelatedArticlesCached(article.category.id, article.id, limit);
}

const getRelatedArticlesCached = unstable_cache(
  async (categoryId: string, articleId: string, limit: number): Promise<Article[]> => {
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .eq('category_id', categoryId)
      .neq('id', articleId)
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) console.error('[data.getRelatedArticles]', error);
    return ((data ?? []) as Record<string, unknown>[]).map(flatten).map(toArticle);
  },
  ['related-articles.v1'],
  { revalidate: 60, tags: ['related-articles'] }
);

export async function getArticlePageData(slug: string): Promise<ArticlePageData> {
  const article = await getArticleBySlugCached(slug);
  if (!article) {
    return { article: null, related: [], popular: [], categories: [] };
  }

  const [related, popular, categories] = await Promise.all([
    getRelatedArticlesCached(article.category.id, article.id, 4),
    getPopularArticlesCached(5),
    getCategoriesCached(),
  ]);

  return { article, related, popular, categories };
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
  if (rows.length === 0) return { bn: [], en: [] };
  return {
    bn: rows.map((r) => r.title_bn),
    en: rows.map((r) => r.title_en),
  };
}


