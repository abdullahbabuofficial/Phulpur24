'use client';

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SiteConfig } from '@/lib/site-config.shared';
import {
  DEFAULT_SITE_CONFIG,
  mergeSiteConfigLayers,
  normalizeLegacyContact,
} from '@/lib/site-config.shared';
import { resetSiteConfig, readStoredSiteConfigPartial, setSiteConfig } from '@/lib/site-config';

export interface SiteConfigContextValue {
  config: SiteConfig;
  isLoaded: boolean;
  updateConfig: typeof setSiteConfig;
  resetConfig: typeof resetSiteConfig;
}

export const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

function mergeServerWithBrowserStorage(server: SiteConfig): SiteConfig {
  if (typeof window === 'undefined') {
    return server;
  }
  const partial = readStoredSiteConfigPartial();
  if (!partial) {
    return server;
  }
  return normalizeLegacyContact(mergeSiteConfigLayers(DEFAULT_SITE_CONFIG, server, partial));
}

interface Props {
  serverConfig: SiteConfig;
  children: ReactNode;
}

export default function SiteConfigProvider({ serverConfig, children }: Props) {
  const [config, setInner] = useState<SiteConfig>(() =>
    mergeSiteConfigLayers(DEFAULT_SITE_CONFIG, serverConfig)
  );
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setInner(mergeServerWithBrowserStorage(serverConfig));
    setIsLoaded(true);

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<SiteConfig>).detail;
      if (detail) setInner(detail);
    };
    window.addEventListener('siteConfigChanged', onChange);
    return () => window.removeEventListener('siteConfigChanged', onChange);
  }, [serverConfig]);

  const updateConfig = useCallback((patch: Partial<SiteConfig>) => {
    return setSiteConfig(patch);
  }, []);

  const resetConfig = useCallback(() => {
    return resetSiteConfig();
  }, []);

  const value = useMemo(
    () => ({
      config,
      isLoaded,
      updateConfig,
      resetConfig,
    }),
    [config, isLoaded, updateConfig, resetConfig]
  );

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}
