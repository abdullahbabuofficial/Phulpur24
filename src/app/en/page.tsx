import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';
import BreakingNewsTicker from '@/components/layout/BreakingNewsTicker';
import ArticleCard from '@/components/articles/ArticleCard';
import NewsletterSignup from '@/components/common/NewsletterSignup';
import AdSlot from '@/components/common/AdSlot';
import {
  getHomePageData,
} from '@/lib/data';

export const revalidate = 60;

export default async function EnHomePage() {
  const { featured, latest, popular, localNews, sportsNews, techNews, categories, breaking } =
    await getHomePageData();

  const leadArticle = featured[0];
  const heroSecondary = featured.slice(1, 3);

  return (
    <div className="min-h-screen bg-brand-soft">
      <Header lang="en" />
      <Navigation lang="en" categories={categories} />
      <BreakingNewsTicker lang="en" items={breaking.en} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {leadArticle && (
              <div className="lg:col-span-2">
                <ArticleCard article={leadArticle} lang="en" variant="lead" />
              </div>
            )}
            <div className="flex flex-col gap-4">
              {heroSecondary.map((article) => (
                <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
              ))}
            </div>
          </div>
        </section>

        <div className="mb-6">
          <AdSlot size="728x90" label="Advertisement" className="mx-auto max-w-3xl" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="border-l-4 border-primary pl-3 text-xl font-bold text-brand-text">Latest News</h2>
                <Link href="/en/latest" className="text-sm text-primary hover:underline">
                  View All -&gt;
                </Link>
              </div>
              <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
                <div className="divide-y divide-brand-border">
                  {latest.map((article) => (
                    <div key={article.id} className="px-4">
                      <ArticleCard article={article} lang="en" variant="horizontal" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="border-l-4 border-primary pl-3 text-xl font-bold text-brand-text">Local News</h2>
                <Link href="/en/category/local" className="text-sm text-primary hover:underline">
                  View All -&gt;
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {localNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="border-l-4 border-accent-green pl-3 text-xl font-bold text-brand-text">Sports</h2>
                <Link href="/en/category/sports" className="text-sm text-primary hover:underline">
                  View All -&gt;
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {sportsNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            </section>

            <NewsletterSignup lang="en" />

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="border-l-4 border-blue-500 pl-3 text-xl font-bold text-brand-text">Technology</h2>
                <Link href="/en/category/technology" className="text-sm text-primary hover:underline">
                  View All -&gt;
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {techNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <AdSlot size="300x250" label="Advertisement" />

            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <div className="bg-primary px-4 py-3 text-white">
                <h3 className="font-bold">Most Popular</h3>
              </div>
              <div className="space-y-4 p-4">
                {popular.map((article, i) => (
                  <div key={article.id} className="flex items-start gap-3">
                    <span className="w-6 shrink-0 text-2xl font-black leading-none text-gray-200">{i + 1}</span>
                    <ArticleCard article={article} lang="en" variant="sidebar" />
                  </div>
                ))}
              </div>
            </div>

            <AdSlot size="300x250" label="Advertisement" />

            <div className="overflow-hidden rounded-xl border border-brand-border bg-white">
              <div className="bg-brand-text px-4 py-3 text-white">
                <h3 className="font-bold">Categories</h3>
              </div>
              <div className="p-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/en/category/${cat.slug}`}
                    className="group flex items-center justify-between rounded px-3 py-2 transition-colors hover:bg-brand-soft"
                  >
                    <span
                      className="text-sm font-medium transition-colors group-hover:text-primary"
                      style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: '8px' }}
                    >
                      {cat.nameEn}
                    </span>
                    <span className="text-xs text-brand-muted">-&gt;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer lang="en" categories={categories} />
    </div>
  );
}
