/**
 * @deprecated The application now reads from Supabase via `src/lib/data.ts`
 * (public site) and `src/lib/supabase/repositories/*` (admin). This file
 * is kept only because the original seed values were copied out of it
 * into the Supabase migration `phulpur24_01_init`. No runtime code
 * imports it. Safe to delete after the next refresh.
 */
export {};
