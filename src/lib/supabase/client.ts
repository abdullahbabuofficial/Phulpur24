/**
 * Live Supabase client.
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or
 * publishable key). Safe to import from both server and client components
 * because both env vars carry the `NEXT_PUBLIC_` prefix.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // We don't throw here so the app can still build without env, but every
  // repository call will fail fast with a clear message.
  // eslint-disable-next-line no-console
  console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing.');
}

export const supabase: SupabaseClient = createClient(url ?? 'http://localhost:54321', key ?? 'missing-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_MODE = url && key ? ('live' as const) : ('mock' as const);

export interface SupabaseAuthSession {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'editor' | 'reporter' | 'translator' | 'seo_editor' | 'sports_reporter' | 'local_correspondent';
  };
  access_token: string;
  expires_at: number;
}
