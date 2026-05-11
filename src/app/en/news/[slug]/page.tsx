import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';
import ArticleBody from '@/components/articles/ArticleBody';
import ArticleCard from '@/components/articles/ArticleCard';
import Breadcrumb from '@/components/common/Breadcrumb';
import Badge from '@/components/common/Badge';
import NewsletterSignup from '@/components/common/NewsletterSignup';
import AdSlot from '@/components/common/AdSlot';
import ArticleMetaRail from '@/components/articles/ArticleMetaRail';
import {
  getAllPublishedSlugs,
  getArticlePageData,
  getArticleBySlug,
  toAuthorRouteSlug,
} from '@/lib/data';
import { formatDate } from '@/lib/i18n';
import { getPublicSiteConfig } from '@/lib/get-public-site-config';
import CommentsThread from '@/components/articles/CommentsThread';
import ViewBeacon from '@/components/articles/ViewBeacon';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

function normalizeTitleSuffix(suffix: string, siteName: string): string {
  const trimmed = suffix.trim();
  if (!trimmed) return ` | ${siteName}`;
  if (trimmed.startsWith("|") || trimmed.startsWith("-")) return ` ${trimmed}`;
  return ` | ${trimmed}`;
}

export async function generateStaticParams() {
  return getAllPublishedSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [a, config] = await Promise.all([getArticleBySlug(slug), getPublicSiteConfig()]);
  const siteName = config.siteName.trim() || 'Phulpur24';
  const titleSuffix = normalizeTitleSuffix(config.seo.metaTitleSuffix, siteName);
  const fallbackDescription =
    config.seo.metaDescription.trim() ||
    config.descriptionEn.trim() ||
    config.descriptionBn.trim() ||
    siteName;

  if (!a) {
    return {
      title: siteName,
      description: fallbackDescription,
    };
  }

  const description = a.subtitleEn?.trim() || fallbackDescription;

  return {
    title: `${a.titleEn}${titleSuffix}`,
    description,
    openGraph: {
      title: `${a.titleEn}${titleSuffix}`,
      description,
      siteName,
      type: 'article',
      images: a.image ? [{ url: a.image }] : undefined,
      locale: 'en_US',
    },
  };
}

export default async function EnArticlePage({ params }: Props) {
  const { slug } = await params;
  const { article, related, popular, categories } = await getArticlePageData(slug);
  if (!article) notFound();
  const config = await getPublicSiteConfig();
  const date = formatDate(article.publishedAt, 'en');

  return (
    <div className="min-h-screen bg-brand-soft">
      <Header lang="en" />
      <Navigation lang="en" categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Breadcrumb items={[
            { label: 'Home', href: '/en' },
            { label: article.category.nameEn, href: `/en/category/${article.category.slug}` },
            { label: article.titleEn },
          ]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="px-6 pt-6 flex items-center gap-2">
                <Badge color={article.category.color}>{article.category.nameEn}</Badge>
                {article.breaking && <Badge variant="breaking">BREAKING</Badge>}
              </div>

              <div className="px-6 pt-3 pb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text leading-tight mb-3">
                  {article.titleEn}
                </h1>
                <p className="text-lg text-brand-muted">{article.subtitleEn}</p>
              </div>

              <ArticleMetaRail
                lang="en"
                authorName={article.author.nameEn}
                authorRole={article.author.role}
                authorHref={`/en/author/${toAuthorRouteSlug(article.author.id, article.author.nameEn)}`}
                dateLabel={date}
                readingTimeLabel={`${article.readingTimeEn} min read`}
                viewsLabel={`${article.views.toLocaleString()} views`}
                articleTitle={article.titleEn}
                articlePath={`/en/news/${article.slug}`}
              />

              <div className="relative aspect-[16/9] overflow-hidden mx-6 mt-4 rounded-lg">
                {article.image?.trim() ? (
                  <img src={article.image} alt={article.titleEn} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-app text-sm text-ink-faint">
                    No image available
                  </div>
                )}
              </div>
              {article.imageCaption && (
                <p className="px-6 mt-2 text-xs text-brand-muted text-center italic">{article.imageCaption}</p>
              )}

              <div className="px-6 py-6">
                <ArticleBody content={article.bodyEn} lang="en" />
              </div>

              <div className="px-6 pb-4">
                <AdSlot size="468x60" label="Advertisement" />
              </div>

              <div className="px-6 pb-6 border-t border-brand-border pt-4">
                <p className="text-sm font-medium text-brand-text mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/search?lang=en&q=${tag.slug}`}
                      className="text-xs px-3 py-1 bg-brand-soft border border-brand-border rounded-full hover:border-primary hover:text-primary transition-colors"
                    >
                      #{tag.nameEn}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <NewsletterSignup lang="en" />
            </div>

            {related.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-primary pl-3 mb-4">
                  Related Articles
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} lang="en" variant="featured" />
                  ))}
                </div>
              </section>
            )}

            <CommentsThread articleId={article.id} lang="en" enabled={config.features.enableComments} />
            <ViewBeacon articleId={article.id} path={`/en/news/${article.slug}`} lang="en" />
          </article>

          <aside className="space-y-6">
            <AdSlot size="300x250" label="Advertisement" />

            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-primary text-white px-4 py-3">
                <h3 className="font-bold">Most Popular</h3>
              </div>
              <div className="p-4 space-y-4">
                {popular.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="text-2xl font-black text-gray-200 w-6 flex-shrink-0 leading-none">{i + 1}</span>
                    <ArticleCard article={a} lang="en" variant="sidebar" />
                  </div>
                ))}
              </div>
            </div>

            <AdSlot size="300x250" label="Advertisement" />
          </aside>
        </div>
      </main>

      <Footer lang="en" categories={categories} />
    </div>
  );
}
