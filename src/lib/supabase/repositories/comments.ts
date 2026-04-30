import { supabase } from '../client';
import type { CommentRow, ModerationStatus } from '../types';

export interface CommentInput {
  articleId: string;
  parentId?: string | null;
  authorName: string;
  authorEmail?: string;
  body: string;
}

export async function listForArticle(articleId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });
  return { data: (data ?? []) as CommentRow[], error };
}

export async function listAllForModeration(status: ModerationStatus | 'all' = 'pending', limit = 200) {
  let query = supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  return { data: (data ?? []) as CommentRow[], error };
}

export async function createComment(input: CommentInput) {
  const row = {
    article_id: input.articleId,
    parent_id: input.parentId ?? null,
    author_name: input.authorName.trim(),
    author_email: (input.authorEmail ?? '').trim().toLowerCase(),
    body: input.body.trim(),
    status: 'pending' as ModerationStatus,
  };
  if (!row.author_name || !row.body) {
    return { data: null as CommentRow | null, error: { message: 'Name and body are required.' } };
  }
  const { data, error } = await supabase.from('comments').insert(row).select('*').single();
  if (error) return { data: null as CommentRow | null, error: { message: error.message ?? 'Failed to post comment.' } };
  return { data: data as CommentRow, error: null };
}

export async function moderate(id: string, status: ModerationStatus) {
  const { error } = await supabase.from('comments').update({ status }).eq('id', id);
  return { data: !error, error };
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  return { data: !error, error };
}
