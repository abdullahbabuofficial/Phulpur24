import { getSupabase } from '../db';
import { logAction } from './audit';
import type { ProfileRow } from '../types';

export async function listUsers() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  return { data: (data ?? []) as ProfileRow[], error };
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<ProfileRow, 'full_name' | 'email' | 'role' | 'status' | 'avatar_url'>>
) {
  const supabase = getSupabase();
  if (patch.email) patch.email = patch.email.toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    const message =
      error.code === '23505'
        ? 'Another user already uses this email.'
        : error.message ?? 'Failed to update user.';
    return { data: null as ProfileRow | null, error: { message, code: error.code } };
  }
  void logAction('Updated user', (data as ProfileRow).full_name, 'Admin', 'user');
  return { data: data as ProfileRow, error: null };
}

export async function removeUser(id: string) {
  const supabase = getSupabase();
  const { data: victim } = await supabase.from('profiles').select('role').eq('id', id).maybeSingle();
  if (victim?.role === 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');
    if ((count ?? 0) <= 1) {
      return { data: null, error: { message: 'Cannot remove the last admin account.' } };
    }
  }
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) return { data: null, error: { message: error.message ?? 'Delete failed.' } };
  void logAction('Removed user', id, 'Admin', 'user');
  return { data: true as const, error: null };
}
