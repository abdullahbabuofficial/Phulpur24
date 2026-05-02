/**
 * Re-exports the shared Supabase surface. Implementation lives in `./db` (cookie browser + server anon).
 */
export { getSupabase, supabase, SUPABASE_MODE } from './db';
export type { SupabaseAuthSession } from './db';
