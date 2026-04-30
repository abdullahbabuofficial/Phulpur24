import { supabase } from '../client';
import type { CategoryRow } from '../types';

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  return { data: (data ?? []) as CategoryRow[], error };
}

export async function getCategory(id: string) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
  return { data: (data as CategoryRow | null) ?? null, error };
}
