import { supabase } from '../client';
import type { Lang, NewsletterSubscriberRow } from '../types';

export async function subscribe(email: string, lang: Lang = 'bn', source = 'public-site') {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { data: null as NewsletterSubscriberRow | null, error: { message: 'Email is required.' } };

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: trimmed, lang, source, status: 'active' })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { data: null as NewsletterSubscriberRow | null, error: { message: 'This email is already subscribed.' } };
    }
    return { data: null as NewsletterSubscriberRow | null, error: { message: error.message ?? 'Failed to subscribe.' } };
  }
  return { data: data as NewsletterSubscriberRow, error: null };
}

export async function listSubscribers(limit = 200) {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
    .limit(limit);
  return { data: (data ?? []) as NewsletterSubscriberRow[], error };
}

export async function unsubscribe(id: string) {
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id);
  return { data: !error, error };
}
