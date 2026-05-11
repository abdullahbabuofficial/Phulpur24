/**
 * Site configuration types and defaults (safe to import from Server Components).
 */

export interface SiteConfig {
  siteName: string;
  siteUrl: string;
  defaultLanguage: 'bn' | 'en';
  branding: {
    logoUrl: string;
    logoDarkUrl: string;
    logoAlt: string;
    faviconUrl: string;
  };
  taglineBn: string;
  taglineEn: string;
  descriptionBn: string;
  descriptionEn: string;
  social: {
    facebook: string;
    twitter: string;
    youtube: string;
    instagram: string;
  };
  contact: {
    email: string;
    phone: string;
    addressBn: string;
    addressEn: string;
    hoursBn: string;
    hoursEn: string;
  };
  seo: {
    metaTitleBn?: string;
    metaTitleEn?: string;
    metaTitleSuffix: string;
    metaDescription: string;
    enableSitemap: boolean;
  };
  features: {
    enableAds: boolean;
    enableNewsletter: boolean;
    enableComments: boolean;
  };
  ads: {
    adsenseId: string;
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: 'Phulpur24',
  siteUrl: 'https://phulpur24.com',
  defaultLanguage: 'bn',
  branding: {
    logoUrl: '/phulpur24_transparent_png_header_footer_900w.png',
    logoDarkUrl: '/phulpur24_transparent_png_header_footer_900w.png',
    logoAlt: 'Phulpur24',
    faviconUrl: '',
  },
  taglineBn: 'সবার আগে ফুলপুরের খবর',
  taglineEn: 'Phulpur News First',
  descriptionBn: 'সবার আগে ফুলপুরের খবর। স্থানীয় সংবাদ, জাতীয় আপডেট এবং আরও অনেক কিছু।',
  descriptionEn: 'Phulpur News First. Local news, national updates and much more.',
  social: {
    facebook: 'https://facebook.com/phulpur24',
    twitter: 'https://twitter.com/phulpur24',
    youtube: 'https://youtube.com/@phulpur24',
    instagram: 'https://instagram.com/phulpur24',
  },
  contact: {
    email: 'info@phulpur24.com',
    phone: '+880 1700-000000',
    addressBn: 'ফুলপুর, ময়মনসিংহ, বাংলাদেশ',
    addressEn: 'Phulpur, Mymensingh, Bangladesh',
    hoursBn: 'সোম-শুক্র: সকাল ৯টা - রাত ৮টা',
    hoursEn: 'Mon–Fri: 9:00 AM – 8:00 PM',
  },
  seo: {
    metaTitleBn: 'Phulpur24',
    metaTitleEn: 'Phulpur24',
    metaTitleSuffix: '| Phulpur24',
    metaDescription: 'সবার আগে ফুলপুরের খবর। Phulpur24 - Your source for local and national news.',
    enableSitemap: true,
  },
  features: {
    enableAds: true,
    enableNewsletter: true,
    enableComments: false,
  },
  ads: {
    adsenseId: '',
  },
};

/** Deep-merge site config layers (later layers override). */
export function mergeSiteConfigLayers(base: SiteConfig, ...layers: Partial<SiteConfig>[]): SiteConfig {
  let out: SiteConfig = { ...base };
  for (const layer of layers) {
    if (!layer || typeof layer !== 'object') continue;
    out = {
      ...out,
      ...layer,
      branding: { ...out.branding, ...layer.branding },
      social: { ...out.social, ...layer.social },
      contact: { ...out.contact, ...layer.contact },
      seo: { ...out.seo, ...layer.seo },
      features: { ...out.features, ...layer.features },
      ads: { ...out.ads, ...layer.ads },
    };
  }
  return normalizeLegacyContact(out);
}

/** Migrate older localStorage blobs that used hoursOfOperation only. */
export function normalizeLegacyContact(config: SiteConfig): SiteConfig {
  const raw = config.contact as Record<string, unknown>;
  const c = config.contact;
  const legacyHo = typeof raw.hoursOfOperation === 'string' ? raw.hoursOfOperation.trim() : '';
  const hoursBn = (c.hoursBn || legacyHo || DEFAULT_SITE_CONFIG.contact.hoursBn).trim();
  const hoursEn = (c.hoursEn || DEFAULT_SITE_CONFIG.contact.hoursEn).trim();
  return {
    ...config,
    contact: {
      ...DEFAULT_SITE_CONFIG.contact,
      ...c,
      hoursBn: hoursBn || DEFAULT_SITE_CONFIG.contact.hoursBn,
      hoursEn: hoursEn || DEFAULT_SITE_CONFIG.contact.hoursEn,
    },
  };
}

