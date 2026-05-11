import { supabase } from '../client';
import { logAction } from './audit';
import type { SiteSettingsRow } from '../types';

export async function getSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'site')
    .maybeSingle();
  return { data: normalizeSettings(data as Partial<SiteSettingsRow> | null), error };
}

export async function updateSettings(patch: Partial<SiteSettingsRow>) {
  const current = await getSettings();
  const base = normalizeSettings(current.data);
  const merged = normalizeSettings({
    ...base,
    ...patch,
    social: { ...base.social, ...(patch.social ?? {}) },
    contact: { ...base.contact, ...(patch.contact ?? {}) },
  });
  const payload: SiteSettingsRow = {
    ...merged,
    id: 'site',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (!error) void logAction('Updated settings', 'Site configuration', 'Admin', 'settings');
  return { data: normalizeSettings((data as SiteSettingsRow | null) ?? payload), error };
}

function fallback(): SiteSettingsRow {
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
  const d = fallback();
  if (!row) return d;
  return {
    ...d,
    ...row,
    id: 'site',
    social: {
      ...d.social,
      ...(row.social ?? {}),
    },
    contact: {
      ...d.contact,
      ...(row.contact ?? {}),
    },
    logo_url: row.logo_url ?? d.logo_url,
    logo_dark_url: row.logo_dark_url ?? d.logo_dark_url,
    logo_alt: row.logo_alt ?? d.logo_alt,
    favicon_url: row.favicon_url ?? d.favicon_url,
    meta_title_bn: row.meta_title_bn ?? d.meta_title_bn,
    meta_title_en: row.meta_title_en ?? d.meta_title_en,
  };
}
