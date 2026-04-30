import { supabase } from '../client';
import type { ContactMessageRow, Lang } from '../types';

export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
  lang?: Lang;
}

export async function createMessage(input: ContactInput) {
  const row = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    subject: (input.subject ?? '').trim(),
    message: input.message.trim(),
    lang: input.lang ?? 'bn',
    status: 'unread',
  };
  if (!row.name || !row.email || !row.message) {
    return { data: null as ContactMessageRow | null, error: { message: 'Name, email and message are required.' } };
  }
  const { data, error } = await supabase
    .from('contact_messages')
    .insert(row)
    .select('*')
    .single();
  if (error) return { data: null as ContactMessageRow | null, error: { message: error.message ?? 'Failed to send message.' } };
  return { data: data as ContactMessageRow, error: null };
}

export async function listMessages(limit = 100) {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return { data: (data ?? []) as ContactMessageRow[], error };
}

export async function markStatus(id: string, status: 'unread' | 'read' | 'archived') {
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
  return { data: !error, error };
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from('contact_messages').delete().eq('id', id);
  return { data: !error, error };
}
