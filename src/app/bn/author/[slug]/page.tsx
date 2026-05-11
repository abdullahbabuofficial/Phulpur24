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
    config.descriptionBn.trim() ||
    config.descriptionEn.trim() ||
    siteName;

  if (!author) {
    return {
      title: siteName,
      description: fallbackDescription,
    };
  }

  const description = author.bio?.trim()
    ? `${author.bio} ${author.nameBn} এর প্রতিবেদন ও সর্বশেষ প্রকাশনা।`
    : `${author.nameBn} এর সর্বশেষ প্রতিবেদন ও প্রকাশিত সংবাদ পড়ুন।`;

  return {
    title: `${author.nameBn}${titleSuffix}`,
    description,
    openGraph: {
      title: `${author.nameBn}${titleSuffix}`,
      description,
      siteName,
      type: 'profile',
      locale: 'bn_BD',
      images: author.avatar ? [{ url: author.avatar }] : undefined,
    },
    alternates: {
      canonical: `/bn/author/${toAuthorRouteSlug(author.id, author.nameEn)}`,
    },
    other: {
      'profile:first_name': author.nameBn,
      'profile:username': author.id,
      'article:author': author.nameBn,
      'x-author-post-count': String(articles.length),
    },
  };
}

export default async function BnAuthorPage({ params }: Props) {
  const { slug } = await params;
  const { author, articles, popular, categories } = await getAuthorPageData(slug);
  if (!author) notFound();

  return (
    <div className="min-h-screen bg-brand-soft font-bangla">
      <Header lang="bn" />
      <Navigation lang="bn" categories={categories} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4">
          <Breadcrumb
            items={[
              { label: 'হোম', href: '/bn' },
              { label: 'রিপোর্টার' },
              { label: author.nameBn },
            ]}
          />
        </div>

        <div className="mb-6 rounded-xl border border-brand-border bg-white p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
              {author.nameBn.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-text font-bangla">{author.nameBn}</h1>
              <p className="text-sm font-medium text-brand-muted font-bangla">{author.role}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-brand-muted font-bangla">{author.bio}</p>
          <p className="mt-4 inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text font-bangla">
            মোট প্রকাশিত সংবাদ: {articles.length}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-brand-muted font-bangla">
                এই রিপোর্টারের কোনো প্রকাশিত সংবাদ এখনো নেই।
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <AdSlot size="300x250" label="বিজ্ঞাপন" />
            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <div className="bg-primary px-4 py-3 text-white">
                <h3 className="font-bold font-bangla">জনপ্রিয় সংবাদ</h3>
              </div>
              <div className="space-y-4 p-4">
                {popular.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <span className="w-6 shrink-0 text-2xl font-black leading-none text-gray-200">{index + 1}</span>
                    <ArticleCard article={item} lang="bn" variant="sidebar" />
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
