import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../db';
import type { CommentRow, ModerationStatus } from '../types';

export interface CommentInput {
  articleId: string;
  parentId?: string | null;
  authorName: string;
  authorEmail?: string;
  body: string;
}

export async function countByModerationStatus(sb?: SupabaseClient) {
  const supabase = sb ?? getSupabase();
  const statuses: ModerationStatus[] = ['pending', 'approved', 'rejected', 'spam'];
  const results = await Promise.all(
    statuses.map((status) =>
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('status', status)
    )
  );
  const counts = {} as Record<ModerationStatus | 'all', number>;
  for (let i = 0; i < statuses.length; i++) {
    counts[statuses[i]] = results[i].count ?? 0;
  }
  const all = statuses.reduce((s, st) => s + (counts[st] ?? 0), 0);
  counts.all = all;
  return counts;
}

export async function listForArticle(articleId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });
  return { data: (data ?? []) as CommentRow[], error };
}

export async function listAllForModeration(status: ModerationStatus | 'all' = 'pending', limit = 200) {
  const supabase = getSupabase();
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
  // Anon RLS: INSERT is allowed (status='pending' on a published article);
  // SELECT only returns approved comments to anon. Don't chain `.select()` —
  // the just-inserted pending comment is invisible to the submitter.
  const sb = getSupabase();
  const { error } = await sb.from('comments').insert(row);
  if (error) return { data: null as CommentRow | null, error: { message: error.message ?? 'Failed to post comment.' } };
  return { data: row as unknown as CommentRow, error: null };
}

export async function moderate(id: string, status: ModerationStatus) {
  const sb = getSupabase();
  const { error } = await sb.from('comments').update({ status }).eq('id', id);
  return { data: !error, error };
}

export async function deleteComment(id: string) {
  const sb = getSupabase();
  const { error } = await sb.from('comments').delete().eq('id', id);
  return { data: !error, error };
}
