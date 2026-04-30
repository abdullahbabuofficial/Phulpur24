import { supabase } from '../client';
import { logAction } from './audit';
import type {
  ArticleRow,
  ArticleWithRelations,
  PostStatus,
  TranslationStatus,
} from '../types';

const ARTICLE_SELECT = `
  *,
  category:categories(*),
  author:authors(*),
  article_tags(tag:tags(*))
`;

// Flatten the article_tags join into a `tags` array so the public
// shape matches our ArticleWithRelations type.
function flatten(row: Record<string, unknown>): ArticleWithRelations {
  const joins = (row.article_tags as Array<{ tag: unknown }> | undefined) ?? [];
  const tags = joins.map((j) => j.tag);
  const { article_tags, ...rest } = row as { article_tags?: unknown };
  void article_tags;
  return { ...(rest as ArticleWithRelations), tags } as ArticleWithRelations;
}

export interface ListPostsParams {
  search?: string;
  status?: PostStatus | 'all';
  categoryId?: string | 'all';
  translation?: TranslationStatus | 'all';
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest' | 'most-views' | 'best-seo';
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
  } = params;

  let query = supabase.from('articles').select(ARTICLE_SELECT, { count: 'exact' });

  if (status !== 'all') query = query.eq('status', status);
  if (categoryId !== 'all') query = query.eq('category_id', categoryId);
  if (translation !== 'all') query = query.eq('translation_status', translation);
  if (search.trim()) {
    const q = `%${search.trim()}%`;
    query = query.or(
      `title_bn.ilike.${q},title_en.ilike.${q},slug.ilike.${q},subtitle_bn.ilike.${q},subtitle_en.ilike.${q}`
    );
  }

  switch (sort) {
    case 'oldest':
      query = query.order('published_at', { ascending: true });
      break;
    case 'most-views':
      query = query.order('views', { ascending: false });
      break;
    case 'best-seo':
      query = query.order('seo_score', { ascending: false });
      break;
    default:
      query = query.order('published_at', { ascending: false });
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
    .select(ARTICLE_SELECT)
    .eq('id', id)
    .maybeSingle();
  return { data: data ? flatten(data as Record<string, unknown>) : null, error };
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  return { data: data ? flatten(data as Record<string, unknown>) : null, error };
}

export async function topPosts(limit = 5) {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
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
  tag_ids: string[];
}

export async function upsertPost(input: PostUpsert) {
  const now = new Date().toISOString();
  const id = input.id ?? `art-${Date.now()}`;

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

  // Upsert article. If new, set published_at and created_at too.
  const isNew = !input.id;
  const upsertRow = isNew
    ? { ...row, published_at: now, created_at: now }
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
  const { error } = await supabase
    .from('articles')
    .update({ status, updated_at: new Date().toISOString() })
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
