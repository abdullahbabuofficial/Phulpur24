import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Navigation from '@/components/layout/Navigation';
import ArticleCard from '@/components/articles/ArticleCard';
import Breadcrumb from '@/components/common/Breadcrumb';
import AdSlot from '@/components/common/AdSlot';
import { getArticlesByCategory, getCategories, getCategoryBySlug } from '@/lib/data';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function BnCategoryPage({ params }: Props) {
  const { slug } = await params;
  const [category, categories, catArticles] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getArticlesByCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <div className="min-h-screen bg-brand-soft font-bangla">
      <Header lang="bn" />
      <Navigation lang="bn" categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Breadcrumb items={[
            { label: 'হোম', href: '/bn' },
            { label: category.nameBn },
          ]} />
        </div>

        <div className="bg-white rounded-xl border border-brand-border p-6 mb-6" style={{ borderTop: `4px solid ${category.color}` }}>
          <h1 className="text-2xl font-bold text-brand-text font-bangla">{category.nameBn}</h1>
          <p className="text-brand-muted text-sm mt-1 font-bangla">{catArticles.length}টি সংবাদ পাওয়া গেছে</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {catArticles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {catArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} lang="bn" variant="featured" />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-brand-border p-12 text-center">
                <p className="text-brand-muted font-bangla">এই বিভাগে কোনো সংবাদ নেই</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <AdSlot size="300x250" label="বিজ্ঞাপন" />
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="bg-brand-text text-white px-4 py-3">
                <h3 className="font-bold font-bangla">সব বিভাগ</h3>
              </div>
              <div className="p-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/bn/category/${cat.slug}`}
                    className={`flex items-center justify-between px-3 py-2 rounded transition-colors group ${cat.slug === slug ? 'bg-brand-soft' : 'hover:bg-brand-soft'}`}
                  >
                    <span
                      className="text-sm font-medium font-bangla group-hover:text-primary transition-colors"
                      style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: '8px' }}
                    >
                      {cat.nameBn}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer lang="bn" categories={categories} />
    </div>
  );
}
