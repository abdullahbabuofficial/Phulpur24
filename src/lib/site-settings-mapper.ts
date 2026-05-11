import type { SiteSettingsRow } from '@/lib/supabase/types';
import { DEFAULT_SITE_CONFIG, mergeSiteConfigLayers, type SiteConfig } from '@/lib/site-config.shared';

function nonEmpty(value: string | undefined | null, fallback: string): string {
  const t = (value ?? '').trim();
  return t || fallback;
}

/**
 * Map Supabase `site_settings` row to the public `SiteConfig` shape.
 */
export function siteSettingsRowToSiteConfig(row: SiteSettingsRow): SiteConfig {
  const hoursBn = nonEmpty(
    row.contact.hours_bn,
    DEFAULT_SITE_CONFIG.contact.hoursBn
  );
  const hoursEn = nonEmpty(
    row.contact.hours_en,
    DEFAULT_SITE_CONFIG.contact.hoursEn
  );

  return mergeSiteConfigLayers(DEFAULT_SITE_CONFIG, {
    siteName: nonEmpty(row.site_name, DEFAULT_SITE_CONFIG.siteName),
    siteUrl: nonEmpty(row.site_url, DEFAULT_SITE_CONFIG.siteUrl),
    defaultLanguage: row.default_language,
    branding: {
      logoUrl: nonEmpty(row.logo_url, DEFAULT_SITE_CONFIG.branding.logoUrl),
      logoDarkUrl: nonEmpty(row.logo_dark_url, DEFAULT_SITE_CONFIG.branding.logoDarkUrl),
      logoAlt: nonEmpty(row.logo_alt, DEFAULT_SITE_CONFIG.branding.logoAlt),
      faviconUrl: nonEmpty(row.favicon_url, DEFAULT_SITE_CONFIG.branding.faviconUrl),
    },
    taglineBn: nonEmpty(row.tagline_bn, DEFAULT_SITE_CONFIG.taglineBn),
    taglineEn: nonEmpty(row.tagline_en, DEFAULT_SITE_CONFIG.taglineEn),
    descriptionBn: nonEmpty(row.description_bn, DEFAULT_SITE_CONFIG.descriptionBn),
    descriptionEn: nonEmpty(row.description_en, DEFAULT_SITE_CONFIG.descriptionEn),
    social: {
      facebook: nonEmpty(row.social.facebook, DEFAULT_SITE_CONFIG.social.facebook),
      twitter: nonEmpty(row.social.twitter, DEFAULT_SITE_CONFIG.social.twitter),
      youtube: nonEmpty(row.social.youtube, DEFAULT_SITE_CONFIG.social.youtube),
      instagram: nonEmpty(row.social.instagram, DEFAULT_SITE_CONFIG.social.instagram),
    },
    contact: {
      email: nonEmpty(row.contact.email, DEFAULT_SITE_CONFIG.contact.email),
      phone: nonEmpty(row.contact.phone, DEFAULT_SITE_CONFIG.contact.phone),
      addressBn: nonEmpty(row.contact.address_bn, DEFAULT_SITE_CONFIG.contact.addressBn),
      addressEn: nonEmpty(row.contact.address_en, DEFAULT_SITE_CONFIG.contact.addressEn),
      hoursBn,
      hoursEn,
    },
    seo: {
      metaTitleBn: nonEmpty(row.meta_title_bn, DEFAULT_SITE_CONFIG.seo.metaTitleBn ?? DEFAULT_SITE_CONFIG.siteName),
      metaTitleEn: nonEmpty(row.meta_title_en, DEFAULT_SITE_CONFIG.seo.metaTitleEn ?? DEFAULT_SITE_CONFIG.siteName),
      metaTitleSuffix: nonEmpty(row.meta_title_suffix, DEFAULT_SITE_CONFIG.seo.metaTitleSuffix),
      metaDescription: nonEmpty(row.meta_description, DEFAULT_SITE_CONFIG.seo.metaDescription),
      enableSitemap: row.enable_sitemap,
    },
    features: {
      enableAds: row.enable_ads,
      enableNewsletter: row.enable_newsletter,
      enableComments: row.enable_comments,
    },
    ads: {
      adsenseId: row.adsense_id ?? '',
    },
  });
}
