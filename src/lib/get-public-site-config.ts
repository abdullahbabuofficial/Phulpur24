import { getSettings } from '@/lib/supabase/repositories/settings';
import { siteSettingsRowToSiteConfig } from '@/lib/site-settings-mapper';
import { DEFAULT_SITE_CONFIG, type SiteConfig } from '@/lib/site-config.shared';

/**
 * Load site settings for Server Components (Supabase when configured).
 */
export async function getPublicSiteConfig(): Promise<SiteConfig> {
  try {
    const { data, error } = await getSettings();
    if (error || !data) {
      return DEFAULT_SITE_CONFIG;
    }
    return siteSettingsRowToSiteConfig(data);
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}
