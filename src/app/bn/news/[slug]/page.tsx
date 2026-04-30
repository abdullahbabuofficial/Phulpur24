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
import {
  getAllPublishedSlugs,
  getArticleBySlug,
  getCategories,
  getPopularArticles,
  getRelatedArticles,
} from '@/lib/data';
import { formatDate } from '@/lib/i18n';
import { getPublicSiteConfig } from '@/lib/get-public-site-config';
import CommentsThread from '@/components/articles/CommentsThread';
import ViewBeacon from '@/components/articles/ViewBeacon';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  return getAllPublishedSlugs();
}

export default async function BnArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [related, popular, categories, config] = await Promise.all([
    getRelatedArticles(article, 4),
    getPopularArticles(5),
    getCategories(),
    getPublicSiteConfig(),
  ]);
  const date = formatDate(article.publishedAt, 'bn');

  return (
    <div className="min-h-screen bg-brand-soft font-bangla">
      <Header lang="bn" />
      <Navigation lang="bn" categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Breadcrumb items={[
            { label: 'হোম', href: '/bn' },
            { label: article.category.nameBn, href: `/bn/category/${article.category.slug}` },
            { label: article.titleBn },
          ]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="px-6 pt-6 flex items-center gap-2">
                <Badge color={article.category.color}>{article.category.nameBn}</Badge>
                {article.breaking && <Badge variant="breaking">ব্রেকিং</Badge>}
              </div>

              <div className="px-6 pt-3 pb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-brand-text leading-tight mb-3 font-bangla">
                  {article.titleBn}
                </h1>
                <p className="text-lg text-brand-muted font-bangla">{article.subtitleBn}</p>
              </div>

              <div className="px-6 pb-4 flex flex-wrap items-center gap-4 text-sm text-brand-muted border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {article.author.nameBn.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-brand-text font-bangla">{article.author.nameBn}</p>
                    <p className="text-xs font-bangla">{article.author.role}</p>
                  </div>
                </div>
                <span className="text-brand-border">|</span>
                <span className="font-bangla">{date}</span>
                <span className="text-brand-border">|</span>
                <span className="font-bangla">{article.readingTimeBn} মিনিট পড়া</span>
                <span className="text-brand-border">|</span>
                <span className="font-bangla">{article.views.toLocaleString()} বার দেখা হয়েছে</span>

                <div className="flex items-center gap-2 ml-auto">
                  <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">FB</button>
                  <button className="text-xs px-2 py-1 bg-sky-500 text-white rounded hover:bg-sky-600">TW</button>
                  <button className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">WA</button>
                </div>
              </div>

              <div className="relative aspect-[16/9] overflow-hidden mx-6 mt-4 rounded-lg">
                <img src={article.image} alt={article.titleBn} className="w-full h-full object-cover" />
              </div>
              {article.imageCaption && (
                <p className="px-6 mt-2 text-xs text-brand-muted text-center italic font-bangla">
                  {article.imageCaption}
                </p>
              )}

              <div className="px-6 py-6">
                <ArticleBody content={article.bodyBn} lang="bn" />
              </div>

              <div className="px-6 pb-4">
                <AdSlot size="468x60" label="বিজ্ঞাপন" />
              </div>

              <div className="px-6 pb-6 border-t border-brand-border pt-4">
                <p className="text-sm font-medium text-brand-text mb-2 font-bangla">ট্যাগ:</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/search?lang=bn&q=${tag.slug}`}
                      className="text-xs px-3 py-1 bg-brand-soft border border-brand-border rounded-full hover:border-primary hover:text-primary transition-colors font-bangla"
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

            {related.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-primary pl-3 mb-4 font-bangla">
                  সম্পর্কিত সংবাদ
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} lang="bn" variant="featured" />
                  ))}
                </div>
              </section>
            )}

            <CommentsThread articleId={article.id} lang="bn" enabled={config.features.enableComments} />
            <ViewBeacon articleId={article.id} path={`/bn/news/${article.slug}`} lang="bn" />
          </article>

          <aside className="space-y-6">
            <AdSlot size="300x250" label="বিজ্ঞাপন" />

            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-primary text-white px-4 py-3">
                <h3 className="font-bold font-bangla">জনপ্রিয় সংবাদ</h3>
              </div>
              <div className="p-4 space-y-4">
                {popular.map((a, i) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="text-2xl font-black text-gray-200 w-6 flex-shrink-0 leading-none">{i + 1}</span>
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
