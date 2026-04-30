import type { Lang } from './types';

export type { Lang };

export const translations = {
  bn: {
    siteName: 'ফুলপুর২৪',
    slogan: 'সবার আগে ফুলপুরের খবর',
    search: 'খুঁজুন...',
    searchPlaceholder: 'সংবাদ অনুসন্ধান করুন',
    latestNews: 'সর্বশেষ সংবাদ',
    breakingNews: 'ব্রেকিং নিউজ',
    featuredNews: 'বিশেষ সংবাদ',
    topStories: 'শীর্ষ সংবাদ',
    popularNews: 'জনপ্রিয় সংবাদ',
    readMore: 'বিস্তারিত পড়ুন',
    by: 'লিখেছেন',
    minRead: 'মিনিট পড়া',
    views: 'বার দেখা হয়েছে',
    tags: 'ট্যাগ',
    relatedArticles: 'সম্পর্কিত সংবাদ',
    newsletter: 'নিউজলেটার',
    newsletterDesc: 'সর্বশেষ সংবাদ সরাসরি আপনার ইনবক্সে পান',
    emailPlaceholder: 'আপনার ইমেইল লিখুন',
    subscribe: 'সাবস্ক্রাইব করুন',
    home: 'হোম',
    about: 'আমাদের সম্পর্কে',
    contact: 'যোগাযোগ',
    categories: 'বিভাগসমূহ',
    allNews: 'সব সংবাদ',
    date: '২৯ এপ্রিল ২০২৬',
    loading: 'লোড হচ্ছে...',
    notFound: 'পাওয়া যায়নি',
    searchResults: 'অনুসন্ধানের ফলাফল',
    noResults: 'কোনো ফলাফল পাওয়া যায়নি',
    breadcrumbHome: 'হোম',
    publishedOn: 'প্রকাশিত',
    updatedOn: 'আপডেট',
  },
  en: {
    siteName: 'Phulpur24',
    slogan: 'Phulpur News First',
    search: 'Search...',
    searchPlaceholder: 'Search news',
    latestNews: 'Latest News',
    breakingNews: 'Breaking News',
    featuredNews: 'Featured News',
    topStories: 'Top Stories',
    popularNews: 'Popular News',
    readMore: 'Read More',
    by: 'By',
    minRead: 'min read',
    views: 'views',
    tags: 'Tags',
    relatedArticles: 'Related Articles',
    newsletter: 'Newsletter',
    newsletterDesc: 'Get the latest news directly to your inbox',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    home: 'Home',
    about: 'About Us',
    contact: 'Contact',
    categories: 'Categories',
    allNews: 'All News',
    date: 'April 29, 2026',
    loading: 'Loading...',
    notFound: 'Not Found',
    searchResults: 'Search Results',
    noResults: 'No results found',
    breadcrumbHome: 'Home',
    publishedOn: 'Published',
    updatedOn: 'Updated',
  },
} as const;

export function isLang(value: unknown): value is Lang {
  return value === 'bn' || value === 'en';
}

export function parseLang(value: unknown, fallback: Lang = 'bn'): Lang {
  return isLang(value) ? value : fallback;
}

export function t(lang: Lang, key: keyof typeof translations['en']): string {
  return translations[lang][key] ?? key;
}

export function formatDate(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr);
  if (lang === 'bn') {
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const bnDigits = (n: number) => n.toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[parseInt(d)]);
    return `${bnDigits(date.getDate())} ${months[date.getMonth()]} ${bnDigits(date.getFullYear())}`;
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getArticleTitle(article: { titleBn: string; titleEn: string }, lang: Lang): string {
  return lang === 'bn' ? article.titleBn : article.titleEn;
}

export function getArticleSubtitle(article: { subtitleBn: string; subtitleEn: string }, lang: Lang): string {
  return lang === 'bn' ? article.subtitleBn : article.subtitleEn;
}

export function getArticleBody(article: { bodyBn: string; bodyEn: string }, lang: Lang): string {
  return lang === 'bn' ? article.bodyBn : article.bodyEn;
}

export function getCategoryName(category: { nameBn: string; nameEn: string }, lang: Lang): string {
  return lang === 'bn' ? category.nameBn : category.nameEn;
}

export function getAuthorName(author: { nameBn: string; nameEn: string }, lang: Lang): string {
  return lang === 'bn' ? author.nameBn : author.nameEn;
}
