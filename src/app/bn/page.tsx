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

export default async function BnHomePage() {
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
  const heroTertiary = featured.slice(3, 5);

  return (
    <div className="min-h-screen bg-brand-soft font-bangla">
      <Header lang="bn" />
      <Navigation lang="bn" categories={categories} />
      <BreakingNewsTicker lang="bn" items={breaking.bn} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {leadArticle && (
              <div className="lg:col-span-2">
                <ArticleCard article={leadArticle} lang="bn" variant="lead" />
              </div>
            )}
            <div className="flex flex-col gap-4">
              {heroSecondary.map((article) => (
                <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
              ))}
            </div>
          </div>
          {heroTertiary.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {heroTertiary.map((article) => (
                <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
              ))}
              {latest.slice(0, 2).map((article) => (
                <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
              ))}
            </div>
          )}
        </section>

        <div className="mb-6">
          <AdSlot size="728x90" label="বিজ্ঞাপন" className="mx-auto max-w-3xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-primary pl-3 font-bangla">
                  সর্বশেষ সংবাদ
                </h2>
                <Link href="/bn/latest" className="text-sm text-primary hover:underline font-bangla">সব দেখুন →</Link>
              </div>
              <div className="space-y-0 divide-y divide-brand-border bg-white rounded-xl border border-brand-border overflow-hidden">
                {latest.map((article) => (
                  <div key={article.id} className="px-4">
                    <ArticleCard article={article} lang="bn" variant="horizontal" />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-primary pl-3 font-bangla">
                  স্থানীয় সংবাদ
                </h2>
                <Link href="/bn/category/local" className="text-sm text-primary hover:underline font-bangla">সব দেখুন →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {localNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-accent-green pl-3 font-bangla">
                  খেলাধুলা
                </h2>
                <Link href="/bn/category/sports" className="text-sm text-primary hover:underline font-bangla">সব দেখুন →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sportsNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
                ))}
              </div>
            </section>

            <NewsletterSignup lang="bn" />

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-text border-l-4 border-blue-500 pl-3 font-bangla">
                  প্রযুক্তি
                </h2>
                <Link href="/bn/category/technology" className="text-sm text-primary hover:underline font-bangla">সব দেখুন →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {techNews.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <AdSlot size="300x250" label="বিজ্ঞাপন" />

            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-primary text-white px-4 py-3">
                <h3 className="font-bold font-bangla">জনপ্রিয় সংবাদ</h3>
              </div>
              <div className="p-4 space-y-4">
                {popular.map((article, i) => (
                  <div key={article.id} className="flex items-start gap-3">
                    <span className="text-2xl font-black text-gray-200 w-6 flex-shrink-0 leading-none">
                      {i + 1}
                    </span>
                    <ArticleCard article={article} lang="bn" variant="sidebar" />
                  </div>
                ))}
              </div>
            </div>

            <AdSlot size="300x250" label="বিজ্ঞাপন" />

            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-brand-text text-white px-4 py-3">
                <h3 className="font-bold font-bangla">বিভাগসমূহ</h3>
              </div>
              <div className="p-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/bn/category/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-brand-soft transition-colors group"
                  >
                    <span
                      className="text-sm font-medium font-bangla group-hover:text-primary transition-colors"
                      style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: '8px' }}
                    >
                      {cat.nameBn}
                    </span>
                    <span className="text-xs text-brand-muted">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer lang="bn" categories={categories} />
    </div>
  );
}
