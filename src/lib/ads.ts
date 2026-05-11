import type { SiteConfig } from '@/lib/site-config.shared';

const SLOT_IDS: Record<string, string | undefined> = {
  '728x90': process.env.NEXT_PUBLIC_AD_SLOT_728X90,
  '300x250': process.env.NEXT_PUBLIC_AD_SLOT_300X250,
  '468x60': process.env.NEXT_PUBLIC_AD_SLOT_468X60,
};

export function hasAdsenseEnabled(config: Pick<SiteConfig, 'features' | 'ads'> | null | undefined): boolean {
  if (!config) return false;
  const id = (config.ads?.adsenseId ?? '').trim();
  return Boolean(config.features?.enableAds && id.startsWith('ca-pub-'));
}

export function getAdSlotId(size: string): string | null {
  const id = (SLOT_IDS[size] ?? '').trim();
  return id || null;
}

export function canRenderAdSlot(
  config: Pick<SiteConfig, 'features' | 'ads'> | null | undefined,
  size: string
): boolean {
  return hasAdsenseEnabled(config) && Boolean(getAdSlotId(size));
}
