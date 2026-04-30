import { supabase } from '../client';
import { logAction } from './audit';
import type { ProfileRow } from '../types';

export async function listUsers() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  return { data: (data ?? []) as ProfileRow[], error };
}

export async function inviteUser(input: { email: string; role: ProfileRow['role'] }) {
  const email = input.email.trim().toLowerCase();
  const fullName = email
    .split('@')[0]
    .split('.')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: `invite-${Date.now()}`,
      email,
      full_name: fullName,
      role: input.role,
      status: 'invited',
      articles_count: 0,
    })
    .select('*')
    .single();

  if (error) {
    const message =
      error.code === '23505'
        ? 'A user with this email already exists.'
        : error.message ?? 'Failed to invite user.';
    return { data: null as ProfileRow | null, error: { message, code: error.code } };
  }
  void logAction('Invited user', email, 'Admin', 'user');
  return { data: data as ProfileRow, error: null };
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<ProfileRow, 'full_name' | 'email' | 'role' | 'status'>>
) {
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
  if (id === 'admin') {
    return { data: null, error: { message: 'The primary admin cannot be removed.' } };
  }
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) return { data: null, error: { message: error.message ?? 'Delete failed.' } };
  void logAction('Removed user', id, 'Admin', 'user');
  return { data: true as const, error: null };
}
