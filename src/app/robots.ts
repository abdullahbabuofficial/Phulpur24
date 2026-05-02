import type { MetadataRoute } from 'next';
import { getPublicSiteConfig } from '@/lib/get-public-site-config';

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getPublicSiteConfig();
  const base = (config.siteUrl || 'https://phulpur24.com').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/', '/api/*'],
      },
    ],
    sitemap: config.seo.enableSitemap ? `${base}/sitemap.xml` : undefined,
    host: base,
  };
}
