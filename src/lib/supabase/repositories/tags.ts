import { supabase } from '../client';
import type { TagRow } from '../types';

export async function listTags() {
  const { data, error } = await supabase.from('tags').select('*').order('name_en');
  return { data: (data ?? []) as TagRow[], error };
}

export async function getTagsForArticle(articleId: string) {
  const { data, error } = await supabase
    .from('article_tags')
    .select('tag:tags(*)')
    .eq('article_id', articleId);
  const rows = (data ?? []) as unknown as Array<{ tag: TagRow | TagRow[] | null }>;
  const tags = rows.flatMap((r) => {
    const t = r.tag;
    if (!t) return [];
    return Array.isArray(t) ? t : [t];
  });
  return { data: tags, error };
}
