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
  if (trimmed.startsWith('|') || trimmed.startsWith('-')) return ` ${trimmed}`;
  return ` | ${trimmed}`;
}

export async function generateStaticParams() {
  return getAllPublishedSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [article, config] = await Promise.all([getArticleBySlug(slug), getPublicSiteConfig()]);
  const siteName = config.siteName.trim() || 'Phulpur24';
  const titleSuffix = normalizeTitleSuffix(config.seo.metaTitleSuffix, siteName);
  const fallbackDescription =
    config.seo.metaDescription.trim() ||
    config.descriptionBn.trim() ||
    config.descriptionEn.trim() ||
    siteName;

  if (!article) {
    return {
      title: siteName,
      description: fallbackDescription,
    };
  }

  const description = article.subtitleBn?.trim() || fallbackDescription;

  return {
    title: `${article.titleBn}${titleSuffix}`,
    description,
    openGraph: {
      title: `${article.titleBn}${titleSuffix}`,
      description,
      siteName,
      type: 'article',
      images: article.image ? [{ url: article.image }] : undefined,
      locale: 'bn_BD',
    },
  };
}

export default async function BnArticlePage({ params }: Props) {
  const { slug } = await params;
  const { article, related, popular, categories } = await getArticlePageData(slug);
  if (!article) notFound();
  const config = await getPublicSiteConfig();

  const date = formatDate(article.publishedAt, 'bn');

  return (
    <div className="min-h-screen bg-brand-soft font-bangla">
      <Header lang="bn" />
      <Navigation lang="bn" categories={categories} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <Breadcrumb
            items={[
              { label: 'হোম', href: '/bn' },
              { label: article.category.nameBn, href: `/bn/category/${article.category.slug}` },
              { label: article.titleBn },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <div className="flex items-center gap-2 px-6 pt-6">
                <Badge color={article.category.color}>{article.category.nameBn}</Badge>
                {article.breaking ? <Badge variant="breaking">ব্রেকিং</Badge> : null}
              </div>

              <div className="px-6 pb-4 pt-3">
                <h1 className="mb-3 text-2xl font-bold leading-tight text-brand-text md:text-3xl font-bangla">
                  {article.titleBn}
                </h1>
                <p className="text-lg text-brand-muted font-bangla">{article.subtitleBn}</p>
              </div>

              <ArticleMetaRail
                lang="bn"
                authorName={article.author.nameBn}
                authorRole={article.author.role}
                authorHref={`/bn/author/${toAuthorRouteSlug(article.author.id, article.author.nameEn)}`}
                dateLabel={date}
                readingTimeLabel={`${article.readingTimeBn} মিনিট পড়া`}
                viewsLabel={`${article.views.toLocaleString()} বার দেখা হয়েছে`}
                articleTitle={article.titleBn}
                articlePath={`/bn/news/${article.slug}`}
              />

              <div className="relative mx-6 mt-4 aspect-[16/9] overflow-hidden rounded-lg">
                {article.image?.trim() ? (
                  <img src={article.image} alt={article.titleBn} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-app text-sm text-ink-faint">ছবি নেই</div>
                )}
              </div>
              {article.imageCaption ? (
                <p className="mt-2 px-6 text-center text-xs italic text-brand-muted font-bangla">{article.imageCaption}</p>
              ) : null}

              <div className="px-6 py-6">
                <ArticleBody content={article.bodyBn} lang="bn" />
              </div>

              <div className="px-6 pb-4">
                <AdSlot size="468x60" label="বিজ্ঞাপন" />
              </div>

              <div className="border-t border-brand-border px-6 pb-6 pt-4">
                <p className="mb-2 text-sm font-medium text-brand-text font-bangla">ট্যাগ:</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/search?lang=bn&q=${tag.slug}`}
                      className="rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs font-bangla transition-colors hover:border-primary hover:text-primary"
                    >
                      #{tag.nameBn}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <NewsletterSignup lang="bn" />
            </div>

            {related.length > 0 ? (
              <section className="mt-8">
                <h2 className="mb-4 border-l-4 border-primary pl-3 text-xl font-bold text-brand-text font-bangla">
                  সম্পর্কিত সংবাদ
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} lang="bn" variant="featured" />
                  ))}
                </div>
              </section>
            ) : null}

            <CommentsThread articleId={article.id} lang="bn" enabled={config.features.enableComments} />
            <ViewBeacon articleId={article.id} path={`/bn/news/${article.slug}`} lang="bn" />
          </article>

          <aside className="space-y-6">
            <AdSlot size="300x250" label="বিজ্ঞাপন" />

            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <div className="bg-primary px-4 py-3 text-white">
                <h3 className="font-bold font-bangla">জনপ্রিয় সংবাদ</h3>
              </div>
              <div className="space-y-4 p-4">
                {popular.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="w-6 shrink-0 text-2xl font-black leading-none text-gray-200">{i + 1}</span>
                    <ArticleCard article={a} lang="bn" variant="sidebar" />
                  </div>
                ))}
              </div>
            </div>

            <AdSlot size="300x250" label="বিজ্ঞাপন" />
          </aside>
        </div>
      </main>

      <Footer lang="bn" categories={categories} />
    </div>
  );
}
