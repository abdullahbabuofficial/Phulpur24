import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/articles/ArticleCard';
import { getCategories, searchPublishedArticles } from '@/lib/data';
import { parseLang } from '@/lib/i18n';

interface Props {
  searchParams: Promise<{ q?: string; lang?: string }>;
}

export const dynamic = 'force-dynamic'; // search is query-driven, no caching

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = (params.q ?? '').trim();
  const lang = parseLang(params.lang);
  const isBn = lang === 'bn';

  const [results, categories] = await Promise.all([
    query ? searchPublishedArticles(query) : Promise.resolve([]),
    getCategories(),
  ]);

  return (
    <div className={`min-h-screen bg-brand-soft ${isBn ? 'font-bangla' : ''}`}>
      <Header lang={lang} />
      <Navigation lang={lang} categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold text-brand-text mb-1 ${isBn ? 'font-bangla' : ''}`}>
            {isBn ? 'অনুসন্ধানের ফলাফল' : 'Search Results'}
          </h1>
          {query && (
            <p className={`text-brand-muted ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? `"${query}" এর জন্য ${results.length}টি ফলাফল` : `${results.length} results for "${query}"`}
            </p>
          )}
          <form action="/search" className="mt-4 flex flex-col sm:flex-row gap-3">
            <input type="hidden" name="lang" value={lang} />
            <label htmlFor="public-search" className="sr-only">
              {isBn ? 'সংবাদ অনুসন্ধান করুন' : 'Search news'}
            </label>
            <input
              id="public-search"
              type="search"
              name="q"
              defaultValue={query}
              placeholder={isBn ? 'শিরোনাম, ট্যাগ বা বিষয় লিখুন' : 'Search title, tag, or topic'}
              className={`min-h-11 flex-1 rounded-lg border border-brand-border bg-white px-4 text-sm text-brand-text outline-none focus:border-primary ${isBn ? 'font-bangla' : ''}`}
            />
            <button
              type="submit"
              className={`min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark ${isBn ? 'font-bangla' : ''}`}
            >
              {isBn ? 'খুঁজুন' : 'Search'}
            </button>
          </form>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((article) => (
              <ArticleCard key={article.id} article={article} lang={lang} variant="featured" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-border p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className={`text-xl font-semibold text-brand-text mb-2 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
            </p>
            <p className={`text-brand-muted ${isBn ? 'font-bangla' : ''}`}>
              {query
                ? (isBn ? 'অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন' : 'Try different keywords')
                : (isBn ? 'একটি শব্দ টাইপ করুন' : 'Enter a search term')}
            </p>
          </div>
        )}
      </main>

      <Footer lang={lang} categories={categories} />
    </div>
  );
}
