'use client';

import {
  DEFAULT_SITE_CONFIG,
  mergeSiteConfigLayers,
  normalizeLegacyContact,
  type SiteConfig,
} from '@/lib/site-config.shared';

export type { SiteConfig };
export { DEFAULT_SITE_CONFIG } from '@/lib/site-config.shared';

const CONFIG_STORAGE_KEY = 'phulpur24:siteConfig';

function parseStored(raw: string | null): Partial<SiteConfig> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<SiteConfig>;
  } catch {
    return null;
  }
}

export function getSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_CONFIG;
  }

  const partial = parseStored(localStorage.getItem(CONFIG_STORAGE_KEY));
  if (!partial) {
    return DEFAULT_SITE_CONFIG;
  }

  const merged = mergeSiteConfigLayers(DEFAULT_SITE_CONFIG, partial);
  return normalizeLegacyContact(merged);
}

export function setSiteConfig(config: Partial<SiteConfig>): SiteConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_CONFIG;
  }

  const current = getSiteConfig();
  const updated = normalizeLegacyContact(mergeSiteConfigLayers(current, config));

  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('siteConfigChanged', { detail: updated }));
  } catch (error) {
    console.error('Failed to save site config:', error);
  }

  return updated;
}

export function resetSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_CONFIG;
  }

  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('siteConfigChanged', { detail: DEFAULT_SITE_CONFIG }));
  } catch (error) {
    console.error('Failed to reset site config:', error);
  }

  return DEFAULT_SITE_CONFIG;
}

export function readStoredSiteConfigPartial(): Partial<SiteConfig> | null {
  if (typeof window === 'undefined') return null;
  return parseStored(localStorage.getItem(CONFIG_STORAGE_KEY));
}
