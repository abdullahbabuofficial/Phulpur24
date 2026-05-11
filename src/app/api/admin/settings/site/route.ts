import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { SiteSettingsRow } from '@/lib/supabase/types';
import { json, requireStaff } from '@/app/api/admin/_auth';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES: SiteSettingsRow['default_language'][] = ['bn', 'en'];

function fallbackSettings(): SiteSettingsRow {
  return {
    id: 'site',
    site_name: 'Phulpur24',
    site_url: 'https://phulpur24.com',
    default_language: 'bn',
    logo_url: '/phulpur24_transparent_png_header_footer_900w.png',
    logo_dark_url: '/phulpur24_transparent_png_header_footer_900w.png',
    logo_alt: 'Phulpur24',
    favicon_url: '',
    tagline_bn: '',
    tagline_en: '',
    description_bn: '',
    description_en: '',
    meta_title_bn: 'Phulpur24',
    meta_title_en: 'Phulpur24',
    meta_title_suffix: '',
    meta_description: '',
    enable_sitemap: true,
    enable_ads: true,
    enable_newsletter: true,
    enable_comments: false,
    adsense_id: '',
    social: { facebook: '', twitter: '', youtube: '', instagram: '' },
    contact: { email: '', phone: '', address_bn: '', address_en: '', hours_bn: '', hours_en: '' },
    updated_at: new Date().toISOString(),
  };
}

function normalizeSettings(row: Partial<SiteSettingsRow> | null | undefined): SiteSettingsRow {
  const d = fallbackSettings();
  if (!row) return d;
  const lang = row.default_language;
  return {
    ...d,
    ...row,
    id: 'site',
    default_language: lang && ADMIN_ROLES.includes(lang) ? lang : d.default_language,
    social: { ...d.social, ...(row.social ?? {}) },
    contact: { ...d.contact, ...(row.contact ?? {}) },
    logo_url: row.logo_url ?? d.logo_url,
    logo_dark_url: row.logo_dark_url ?? d.logo_dark_url,
    logo_alt: row.logo_alt ?? d.logo_alt,
    favicon_url: row.favicon_url ?? d.favicon_url,
    meta_title_bn: row.meta_title_bn ?? d.meta_title_bn,
    meta_title_en: row.meta_title_en ?? d.meta_title_en,
  };
}

async function upsertSettingsCompat(
  admin: ReturnType<typeof getSupabaseAdmin>,
  payload: SiteSettingsRow
): Promise<{ data: SiteSettingsRow | null; error: string | null }> {
  if (!admin) return { data: null, error: 'Server admin client unavailable.' };

  const mutable = { ...payload } as Record<string, unknown>;
  for (let i = 0; i < 8; i++) {
    const { data, error } = await admin
      .from('site_settings')
      .upsert(mutable, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error) {
      return { data: normalizeSettings((data ?? mutable) as Partial<SiteSettingsRow>), error: null };
    }

    const msg = error.message ?? '';
    const missing = msg.match(/Could not find the '([^']+)' column/i)?.[1];
    if (!missing || !(missing in mutable)) {
      return { data: null, error: msg || 'Settings save failed.' };
    }
    delete mutable[missing];
  }
  return { data: null, error: 'Settings save failed after compatibility retries.' };
}

export async function GET(request: Request) {
  const access = await requireStaff(['admin', 'editor'], request);
  if (!access.ok) return access.response;

  const admin = getSupabaseAdmin();
  if (!admin) return json({ ok: false, error: 'Server admin client unavailable.' }, 503);

  const { data, error } = await admin.from('site_settings').select('*').eq('id', 'site').maybeSingle();
  if (error) return json({ ok: false, error: error.message }, 500);

  return json({ ok: true, data: normalizeSettings((data ?? null) as Partial<SiteSettingsRow> | null) }, 200);
}

export async function PUT(request: Request) {
  const access = await requireStaff(['admin'], request);
  if (!access.ok) return access.response;

  const admin = getSupabaseAdmin();
  if (!admin) return json({ ok: false, error: 'Server admin client unavailable.' }, 503);

  let patch: Partial<SiteSettingsRow> & { reset?: boolean };
  try {
    patch = (await request.json()) as Partial<SiteSettingsRow> & { reset?: boolean };
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const shouldReset = patch.reset === true;
  const current = await admin.from('site_settings').select('*').eq('id', 'site').maybeSingle();
  const base = shouldReset
    ? fallbackSettings()
    : normalizeSettings((current.data ?? null) as Partial<SiteSettingsRow> | null);
  const merged = normalizeSettings({
    ...base,
    ...patch,
    social: { ...base.social, ...(patch.social ?? {}) },
    contact: { ...base.contact, ...(patch.contact ?? {}) },
    updated_at: new Date().toISOString(),
  });

  const saved = await upsertSettingsCompat(admin, { ...merged, id: 'site' });
  if (saved.error) return json({ ok: false, error: saved.error }, 500);
  return json({ ok: true, data: saved.data ?? merged }, 200);
}
