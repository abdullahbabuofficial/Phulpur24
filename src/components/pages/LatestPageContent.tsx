import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import BreakingNewsTicker from '@/components/layout/BreakingNewsTicker';
import Footer from '@/components/layout/Footer';
import ArticleCard from '@/components/articles/ArticleCard';
import Breadcrumb from '@/components/common/Breadcrumb';
import { getBreakingNewsItems, getCategories, getLatestArticles } from '@/lib/data';
import type { Lang } from '@/lib/types';

interface LatestPageContentProps {
  lang: Lang;
}

const copy = {
  bn: {
    title: 'সর্বশেষ সংবাদ',
    count: (count: number) => `${count}টি প্রকাশিত সংবাদ`,
    home: 'হোম',
  },
  en: {
    title: 'Latest News',
    count: (count: number) => `${count} published articles`,
    home: 'Home',
  },
} satisfies Record<Lang, {
  title: string;
  count: (count: number) => string;
  home: string;
}>;

export default async function LatestPageContent({ lang }: LatestPageContentProps) {
  const [articles, categories, breaking] = await Promise.all([
    getLatestArticles(50),
    getCategories(),
    getBreakingNewsItems(),
  ]);
  const content = copy[lang];
  const banglaClass = lang === 'bn' ? 'font-bangla' : '';

  return (
    <div className={`min-h-screen bg-brand-soft ${banglaClass}`}>
      <Header lang={lang} />
      <Navigation lang={lang} categories={categories} />
      <BreakingNewsTicker lang={lang} items={breaking[lang]} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Breadcrumb items={[
            { label: content.home, href: `/${lang}` },
            { label: content.title },
          ]} />
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6 mb-6">
          <h1 className={`text-2xl font-bold text-brand-text ${banglaClass}`}>{content.title}</h1>
          <p className={`text-brand-muted text-sm mt-1 ${banglaClass}`}>{content.count(articles.length)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} lang={lang} variant="featured" />
          ))}
        </div>
      </main>

      <Footer lang={lang} categories={categories} />
    </div>
  );
}
