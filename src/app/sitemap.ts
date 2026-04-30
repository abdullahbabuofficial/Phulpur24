import type { MetadataRoute } from 'next';
import { getAllPublishedSlugs, getCategories } from '@/lib/data';
import { getPublicSiteConfig } from '@/lib/get-public-site-config';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getPublicSiteConfig();
  if (!config.seo.enableSitemap) return [];

  const base = (config.siteUrl || 'https://phulpur24.com').replace(/\/$/, '');
  const [slugs, categories] = await Promise.all([getAllPublishedSlugs(), getCategories()]);

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/bn`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/en`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/bn/latest`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${base}/en/latest`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/bn/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/en/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/bn/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/en/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const articleEntries: MetadataRoute.Sitemap = slugs.flatMap((s) => [
    { url: `${base}/bn/news/${s.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/en/news/${s.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
  ]);

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((c) => [
    { url: `${base}/bn/category/${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/en/category/${c.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.5 },
  ]);

  return [...staticEntries, ...categoryEntries, ...articleEntries];
}
