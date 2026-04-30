import { supabase } from '../client';
import { logAction } from './audit';
import type { SiteSettingsRow } from '../types';

export async function getSettings() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 'site')
    .maybeSingle();
  return { data: (data as SiteSettingsRow | null) ?? fallback(), error };
}

export async function updateSettings(patch: Partial<SiteSettingsRow>) {
  const { id, ...rest } = patch as SiteSettingsRow;
  void id;
  const { data, error } = await supabase
    .from('site_settings')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', 'site')
    .select('*')
    .single();
  if (!error) void logAction('Updated settings', 'Site configuration', 'Admin', 'settings');
  return { data: (data as SiteSettingsRow | null) ?? fallback(), error };
}

function fallback(): SiteSettingsRow {
  return {
    id: 'site',
    site_name: 'Phulpur24',
    site_url: 'https://phulpur24.com',
    default_language: 'bn',
    tagline_bn: '',
    tagline_en: '',
    description_bn: '',
    description_en: '',
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
