import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';
import BreakingNewsTicker from '@/components/layout/BreakingNewsTicker';
import ArticleCard from '@/components/articles/ArticleCard';
import NewsletterSignup from '@/components/common/NewsletterSignup';
import AdSlot from '@/components/common/AdSlot';
import {
  getArticlesByCategory,
  getBreakingNewsItems,
  getCategories,
  getFeaturedArticles,
  getLatestArticles,
  getPopularArticles,
} from '@/lib/data';

export const revalidate = 60;

export default async function EnHomePage() {
  const [featured, latest, popular, localNews, sportsNews, techNews, categories, breaking] =
    await Promise.all([
      getFeaturedArticles(5),
      getLatestArticles(8),
      getPopularArticles(6),
      getArticlesByCategory('local', 4),
      getArticlesByCategory('sports', 3),
      getArticlesByCategory('technology', 3),
      getCategories(),
      getBreakingNewsItems(),
    ]);

  const leadArticle = featured[0];
  const heroSecondary = featured.slice(1, 3);

  return (
    <div className="min-h-screen bg-brand-soft">
      <Header lang="en" />
      <Navigation lang="en" categories={categories} />
      <BreakingNewsTicker lang="en" items={breaking.en} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-primary pl-3">
                  Latest News
                </h2>
                <Link href="/en/latest" className="text-sm text-primary hover:underline">View All →</Link>
              </div>
              <div className="space-y-0 divide-y divide-brand-border bg-white rounded-xl border border-brand-border overflow-hidden">
                {latest.map((article) => (
                  <div key={article.id} className="px-4">
                    <ArticleCard article={article} lang="en" variant="horizontal" />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-primary pl-3">
                  Local News
                </h2>
                <Link href="/en/category/local" className="text-sm text-primary hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-accent-green pl-3">
                  Sports
                </h2>
                <Link href="/en/category/sports" className="text-sm text-primary hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sportsNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            </section>

            <NewsletterSignup lang="en" />

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-blue-500 pl-3">
                  Technology
                </h2>
                <Link href="/en/category/technology" className="text-sm text-primary hover:underline">View All →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {techNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="en" variant="featured" />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <AdSlot size="300x250" label="Advertisement" />

            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-primary text-white px-4 py-3">
                <h3 className="font-bold">Most Popular</h3>
              </div>
              <div className="p-4 space-y-4">
                {popular.map((article, i) => (
                  <div key={article.id} className="flex items-start gap-3">
                    <span className="text-2xl font-black text-gray-200 w-6 flex-shrink-0 leading-none">{i + 1}</span>
                    <ArticleCard article={article} lang="en" variant="sidebar" />
                  </div>
                ))}
              </div>
            </div>

            <AdSlot size="300x250" label="Advertisement" />

            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-brand-text text-white px-4 py-3">
                <h3 className="font-bold">Categories</h3>
              </div>
              <div className="p-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/en/category/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-brand-soft transition-colors group"
                  >
                    <span
                      className="text-sm font-medium group-hover:text-primary transition-colors"
                      style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: '8px' }}
                    >
                      {cat.nameEn}
                    </span>
                    <span className="text-xs text-brand-muted">→</span>
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
