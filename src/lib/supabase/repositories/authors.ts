import { supabase } from '../client';
import type { AuthorRow } from '../types';

export async function listAuthors() {
  const { data, error } = await supabase.from('authors').select('*').order('name_en');
  return { data: (data ?? []) as AuthorRow[], error };
}

export async function getAuthor(id: string) {
  const { data, error } = await supabase.from('authors').select('*').eq('id', id).maybeSingle();
  return { data: (data as AuthorRow | null) ?? null, error };
}
