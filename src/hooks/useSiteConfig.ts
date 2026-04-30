'use client';

import { useContext } from 'react';
import { SiteConfigContext } from '@/components/common/SiteConfigProvider';
import { getSiteConfig, setSiteConfig, resetSiteConfig } from '@/lib/site-config';
import { DEFAULT_SITE_CONFIG, type SiteConfig } from '@/lib/site-config.shared';

/**
 * Site configuration: prefers `SiteConfigProvider` (server + localStorage merge), else localStorage-only.
 */
export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (ctx) {
    return ctx;
  }
  return {
    config: typeof window === 'undefined' ? DEFAULT_SITE_CONFIG : getSiteConfig(),
    isLoaded: true,
    updateConfig: setSiteConfig,
    resetConfig: resetSiteConfig,
  };
}

export function useSiteConfigValue(): SiteConfig {
  const ctx = useContext(SiteConfigContext);
  if (ctx) {
    return ctx.config;
  }
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_CONFIG;
  }
  return getSiteConfig();
}
