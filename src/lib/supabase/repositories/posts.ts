import { supabase } from '../client';
import { logAction } from './audit';
import type {
  ArticleRow,
  ArticleWithRelations,
  PostStatus,
  TranslationStatus,
} from '../types';

const ARTICLE_LIST_COLUMNS =
  'id,slug,title_bn,title_en,subtitle_bn,subtitle_en,category_id,author_id,cover_image_url,cover_image_caption,reading_time_bn,reading_time_en,views,status,translation_status,seo_score,seo_title,seo_description,seo_focus_keyword,featured,breaking,published_at,updated_at,created_at';

const ARTICLE_CONTENT_COLUMNS = 'body_bn,body_en';

const ARTICLE_RELATION_COLUMNS =
  'category:categories(id,slug,name_bn,name_en,color,sort_order,created_at),author:authors(id,name_bn,name_en,role,avatar_url,bio,created_at),article_tags(tag:tags(id,slug,name_bn,name_en,created_at))';

const ARTICLE_SELECT_LIST = `${ARTICLE_LIST_COLUMNS},${ARTICLE_RELATION_COLUMNS}`;
const ARTICLE_SELECT_WITH_CONTENT = `${ARTICLE_LIST_COLUMNS},${ARTICLE_CONTENT_COLUMNS},${ARTICLE_RELATION_COLUMNS}`;

// Flatten the article_tags join into a `tags` array so the public
// shape matches our ArticleWithRelations type.
function flatten(row: Record<string, unknown>): ArticleWithRelations {
  const joins = (row.article_tags as Array<{ tag: unknown }> | undefined) ?? [];
  const tags = joins.map((j) => j.tag);
  const { article_tags, ...rest } = row as { article_tags?: unknown };
  void article_tags;
  // List views can intentionally skip large HTML fields. Keep the return
  // shape stable so callers don't need nullable checks for body fields.
  const normalized = rest as Partial<ArticleWithRelations>;
  if (typeof normalized.body_bn !== 'string') normalized.body_bn = '';
  if (typeof normalized.body_en !== 'string') normalized.body_en = '';
  return { ...(normalized as ArticleWithRelations), tags } as ArticleWithRelations;
}

export interface ListPostsParams {
  search?: string;
  status?: PostStatus | 'all' | 'scheduled';
  categoryId?: string | 'all';
  translation?: TranslationStatus | 'all';
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest' | 'most-views' | 'best-seo';
  includeContent?: boolean;
}

export interface ListPostsResult {
  rows: ArticleWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listPosts(params: ListPostsParams = {}): Promise<ListPostsResult> {
  const {
    search = '',
    status = 'all',
    categoryId = 'all',
    translation = 'all',
    page = 1,
    pageSize = 10,
    sort = 'newest',
    includeContent = false,
  } = params;

  const articleSelect = includeContent ? ARTICLE_SELECT_WITH_CONTENT : ARTICLE_SELECT_LIST;
  let query = supabase.from('articles').select(articleSelect as '*', { count: 'exact' });

  const nowIso = new Date().toISOString();
  if (status === 'scheduled') {
    query = query.eq('status', 'published').gt('published_at', nowIso);
  } else if (status === 'published') {
    query = query
      .eq('status', 'published')
      .or(`published_at.lte.${nowIso},published_at.is.null`);
  } else if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (categoryId !== 'all') query = query.eq('category_id', categoryId);
  if (translation !== 'all') query = query.eq('translation_status', translation);
  if (search.trim()) {
    const needle = search.trim();
    const q = `%${needle}%`;
    const orFilters = [
      `title_bn.ilike.${q}`,
      `title_en.ilike.${q}`,
      `slug.ilike.${q}`,
      `subtitle_bn.ilike.${q}`,
      `subtitle_en.ilike.${q}`,
    ];

    const { data: authors } = await supabase
      .from('authors')
      .select('id')
      .or(`name_en.ilike.${q},name_bn.ilike.${q}`);
    const authorIds = (authors ?? []).map((a) => a.id).filter(Boolean);
    if (authorIds.length > 0) {
      const idList = authorIds.map((id) => String(id).replace(/,/g, '')).join(',');
      orFilters.push(`author_id.in.(${idList})`);
    }

    query = query.or(orFilters.join(','));
  }

  switch (sort) {
    case 'oldest':
      query = query.order('updated_at', { ascending: true });
      break;
    case 'most-views':
      query = query.order('views', { ascending: false });
      break;
    case 'best-seo':
      query = query.order('seo_score', { ascending: false });
      break;
    default:
      query = query.order('updated_at', { ascending: false });
  }

  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[posts.listPosts]', error);
    return { rows: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const rows = (data ?? []).map((r) => flatten(r as Record<string, unknown>));
  const total = count ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { rows, total, page: Math.min(page, totalPages), pageSize, totalPages };
}

export async function getPostById(id: string) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT_WITH_CONTENT as '*')
    .eq('id', id)
    .maybeSingle();
  return { data: data ? flatten(data as Record<string, unknown>) : null, error };
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT_WITH_CONTENT as '*')
    .eq('slug', slug)
    .maybeSingle();
  return { data: data ? flatten(data as Record<string, unknown>) : null, error };
}

export async function topPosts(limit = 5) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT_LIST as '*')
    .eq('status', 'published')
    .lte('published_at', nowIso)
    .order('views', { ascending: false })
    .limit(limit);
  return {
    data: (data ?? []).map((r) => flatten(r as Record<string, unknown>)),
    error,
  };
}

export interface PostUpsert {
  id?: string;
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
  status: PostStatus;
  translation_status: TranslationStatus;
  featured: boolean;
  breaking: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_focus_keyword: string | null;
  publish_at?: string | null;
  tag_ids: string[];
}

export async function upsertPost(input: PostUpsert) {
  const now = new Date().toISOString();
  const id = input.id ?? `art-${Date.now()}`;
  const isNew = !input.id;
  const { data: existingRow } = isNew
    ? { data: null as Pick<ArticleRow, 'status' | 'published_at'> | null }
    : await supabase.from('articles').select('status,published_at').eq('id', id).maybeSingle();
  const requestedPublishAtMs =
    input.status === 'published' && input.publish_at ? Date.parse(input.publish_at) : Number.NaN;
  const requestedPublishAtIso =
    Number.isFinite(requestedPublishAtMs) && requestedPublishAtMs > 0
      ? new Date(requestedPublishAtMs).toISOString()
      : null;

  const row: Partial<ArticleRow> & { id: string } = {
    id,
    slug: input.slug || `post-${id}`,
    title_bn: input.title_bn,
    title_en: input.title_en,
    subtitle_bn: input.subtitle_bn,
    subtitle_en: input.subtitle_en,
    body_bn: input.body_bn,
    body_en: input.body_en,
    category_id: input.category_id,
    author_id: input.author_id,
    cover_image_url: input.cover_image_url,
    cover_image_caption: input.cover_image_caption,
    status: input.status,
    translation_status: input.translation_status,
    featured: input.featured,
    breaking: input.breaking,
    seo_title: input.seo_title,
    seo_description: input.seo_description,
    seo_focus_keyword: input.seo_focus_keyword,
    seo_score: computeSeoScore(input),
    reading_time_bn: Math.max(1, Math.ceil(input.body_bn.length / 1200)),
    reading_time_en: Math.max(1, Math.ceil(input.body_en.length / 1200)),
    updated_at: now,
  };

  // Auto-create unknown tags so the join references valid rows.
  if (input.tag_ids.length > 0) {
    const { data: existingTags } = await supabase.from('tags').select('id').in('id', input.tag_ids);
    const known = new Set((existingTags ?? []).map((t) => t.id));
    const missing = input.tag_ids.filter((tid) => !known.has(tid));
    if (missing.length > 0) {
      const newTagRows = missing.map((tid) => {
        const slug = tid.replace(/^tag-/, '').toLowerCase();
        return {
          id: tid,
          slug,
          name_bn: slug,
          name_en: slug.replace(/(?:^|-)([a-z])/g, (_, c: string) => ` ${c.toUpperCase()}`).trim(),
        };
      });
      await supabase.from('tags').insert(newTagRows);
    }
  }

  // Stamp published_at when a post becomes published.
  const shouldStampPublishedAt =
    input.status === 'published' &&
    (requestedPublishAtIso
      ? requestedPublishAtIso !== (existingRow?.published_at ?? null)
      : isNew || existingRow?.status !== 'published');
  const upsertRow = isNew
    ? { ...row, published_at: requestedPublishAtIso ?? now, created_at: now }
    : shouldStampPublishedAt
    ? { ...row, published_at: requestedPublishAtIso ?? now }
    : row;

  const { error: upsertErr } = await supabase
    .from('articles')
    .upsert(upsertRow, { onConflict: 'id' });
  if (upsertErr) {
    return { data: null as ArticleWithRelations | null, error: upsertErr };
  }

  // Replace article_tags
  await supabase.from('article_tags').delete().eq('article_id', id);
  if (input.tag_ids.length > 0) {
    await supabase
      .from('article_tags')
      .insert(input.tag_ids.map((tag_id) => ({ article_id: id, tag_id })));
  }

  // Audit
  const action = isNew
    ? 'Created article'
    : input.status === 'published'
    ? 'Published article'
    : 'Updated article';
  const icon =
    input.status === 'published' ? 'check' : input.status === 'pending' ? 'clock' : 'pencil';
  void logAction(action, input.title_en || input.title_bn || id, 'Admin', icon);

  return getPostById(id);
}

export async function deletePost(id: string) {
  // Soft delete: archive + stamp deleted_at
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (!error) void logAction('Archived article', id, 'Admin', 'pencil');
  return { data: error ? false : true, error };
}

export async function hardDeletePost(id: string) {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  if (!error) void logAction('Deleted article', id, 'Admin', 'pencil');
  return { data: error ? false : true, error };
}

export async function restorePost(id: string) {
  const { error } = await supabase
    .from('articles')
    .update({ status: 'draft', deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (!error) void logAction('Restored article', id, 'Admin', 'pencil');
  return { data: error ? false : true, error };
}

export async function bulkUpdateStatus(ids: string[], status: PostStatus) {
  const now = new Date().toISOString();
  const patch: Partial<ArticleRow> & { updated_at: string } =
    status === 'published'
      ? { status, updated_at: now, published_at: now }
      : { status, updated_at: now };
  const { error } = await supabase
    .from('articles')
    .update(patch)
    .in('id', ids);
  if (!error) {
    void logAction(`Bulk → ${status}`, `${ids.length} article${ids.length === 1 ? '' : 's'}`, 'Admin', 'pencil');
  }
  return { data: error ? 0 : ids.length, error };
}

export async function bulkDelete(ids: string[]) {
  const { error } = await supabase
    .from('articles')
    .update({ status: 'archived', deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .in('id', ids);
  if (!error) {
    void logAction('Bulk archive', `${ids.length} article${ids.length === 1 ? '' : 's'}`, 'Admin', 'pencil');
  }
  return { data: error ? 0 : ids.length, error };
}

function computeSeoScore(p: {
  title_en: string;
  subtitle_en: string;
  body_en: string;
  seo_focus_keyword: string | null;
}) {
  let score = 30;
  if (p.title_en.length >= 30 && p.title_en.length <= 70) score += 20;
  if (p.subtitle_en.length >= 80) score += 15;
  if (p.body_en.length > 600) score += 15;
  const kw = (p.seo_focus_keyword ?? '').toLowerCase();
  if (kw && (p.title_en + ' ' + p.body_en).toLowerCase().includes(kw)) score += 20;
  return Math.min(100, score);
}
