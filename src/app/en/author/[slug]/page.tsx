import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';
import ArticleCard from '@/components/articles/ArticleCard';
import Breadcrumb from '@/components/common/Breadcrumb';
import AdSlot from '@/components/common/AdSlot';
import {
  getAllAuthorRouteSlugs,
  getAuthorPageData,
  toAuthorRouteSlug,
} from '@/lib/data';
import { getPublicSiteConfig } from '@/lib/get-public-site-config';

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
  return getAllAuthorRouteSlugs();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [{ author, articles }, config] = await Promise.all([
    getAuthorPageData(slug),
    getPublicSiteConfig(),
  ]);
  const siteName = config.siteName.trim() || 'Phulpur24';
  const titleSuffix = normalizeTitleSuffix(config.seo.metaTitleSuffix, siteName);
  const fallbackDescription =
    config.seo.metaDescription.trim() ||
    config.descriptionEn.trim() ||
    config.descriptionBn.trim() ||
    siteName;

  if (!author) {
    return {
      title: siteName,
      description: fallbackDescription,
    };
  }

  const description = author.bio?.trim()
    ? `${author.bio} Latest reporting and stories by ${author.nameEn}.`
    : `Read the latest reports and stories by ${author.nameEn}.`;

  return {
    title: `${author.nameEn}${titleSuffix}`,
    description,
    openGraph: {
      title: `${author.nameEn}${titleSuffix}`,
      description,
      siteName,
      type: 'profile',
      locale: 'en_US',
      images: author.avatar ? [{ url: author.avatar }] : undefined,
    },
    alternates: {
      canonical: `/en/author/${toAuthorRouteSlug(author.id, author.nameEn)}`,
    },
    other: {
      'profile:first_name': author.nameEn,
      'profile:username': author.id,
      'article:author': author.nameEn,
      'x-author-post-count': String(articles.length),
    },
  };
}

export default async function EnAuthorPage({ params }: Props) {
  const { slug } = await params;
  const { author, articles, popular, categories } = await getAuthorPageData(slug);
  if (!author) notFound();

  return (
    <div className="min-h-screen bg-brand-soft">
      <Header lang="en" />
      <Navigation lang="en" categories={categories} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/en' },
              { label: 'Authors' },
              { label: author.nameEn },
            ]}
          />
        </div>

        <div className="mb-6 rounded-xl border border-brand-border bg-white p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              {author.nameEn.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-text">{author.nameEn}</h1>
              <p className="text-sm font-medium text-brand-muted">{author.role}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-brand-muted">{author.bio}</p>
          <p className="mt-4 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text">
            {articles.length} published article{articles.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-brand-muted">
                No published articles yet for this reporter.
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <AdSlot size="300x250" label="Advertisement" />
            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <div className="bg-primary px-4 py-3 text-white">
                <h3 className="font-bold">Popular Stories</h3>
              </div>
              <div className="space-y-4 p-4">
                {popular.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <span className="w-6 shrink-0 text-2xl font-black leading-none text-gray-200">{index + 1}</span>
                    <ArticleCard article={item} lang="en" variant="sidebar" />
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
