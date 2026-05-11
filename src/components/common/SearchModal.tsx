'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Lang, Article } from '@/lib/types';
import { searchPublishedArticles } from '@/lib/data';

export interface SearchQuickLink {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
  scope?: 'public' | 'admin';
  quickLinks?: SearchQuickLink[];
}

function articleTitle(a: Article, lang: Lang) {
  return lang === 'bn' ? a.titleBn : a.titleEn;
}

function articleCategory(a: Article, lang: Lang) {
  return lang === 'bn' ? a.category.nameBn : a.category.nameEn;
}

export default function SearchModal({
  isOpen,
  onClose,
  lang,
  scope = 'public',
  quickLinks = [],
}: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();
  const isAdmin = scope === 'admin';

  const matchedQuickLinks = useMemo(() => {
    if (!quickLinks.length) return [];
    if (!normalized) return quickLinks.slice(0, 8);

    return quickLinks
      .filter((link) => {
        const haystack = `${link.title} ${link.subtitle ?? ''} ${(link.keywords ?? []).join(' ')}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 10);
  }, [quickLinks, normalized]);

  useEffect(() => {
    setFetchError(false);

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const handle = setTimeout(async () => {
      try {
        const rows = await searchPublishedArticles(trimmed);
        if (cancelled) return;
        setResults(rows.slice(0, 8));
      } catch {
        if (!cancelled) {
          setFetchError(true);
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [trimmed]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
      setFetchError(false);
      setLoading(false);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Enter' && isAdmin && trimmed.length > 0 && matchedQuickLinks.length > 0) {
        e.preventDefault();
        onClose();
        router.push(matchedQuickLinks[0].href);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAdmin, isOpen, matchedQuickLinks, onClose, router, trimmed.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-2 py-3 sm:px-6 sm:py-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close search"
      />

      <div className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full items-start justify-center pt-1 sm:pt-8">
        <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 sm:px-4">
            <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-line bg-app px-2.5">
              <svg className="h-5 w-5 shrink-0 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35m1.65-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isAdmin
                    ? lang === 'bn'
                      ? 'পেজ, টুল, আর্টিকেল খুঁজুন...'
                      : 'Search pages, tools, articles...'
                    : lang === 'bn'
                      ? 'সংবাদ খুঁজুন...'
                      : 'Search news...'
                }
                className={`h-full flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none ${
                  lang === 'bn' ? 'font-bangla' : ''
                }`}
              />
              {trimmed ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-md px-2 py-1 text-xs font-medium text-ink-muted hover:bg-white hover:text-ink"
                >
                  {lang === 'bn' ? 'মুছুন' : 'Clear'}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-ink-faint hover:bg-app hover:text-ink"
              aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-line px-4 py-2 text-[11px] text-ink-faint">
            <span className={`inline-flex items-center gap-1.5 ${lang === 'bn' ? 'font-bangla' : ''}`}>
              <kbd className="rounded border border-line bg-app px-1.5 py-0.5 text-[10px] font-semibold">Enter</kbd>
              {lang === 'bn' ? 'প্রথম ফলাফল খুলুন' : 'Open first result'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="rounded border border-line bg-app px-1.5 py-0.5 text-[10px] font-semibold">Esc</kbd>
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </span>
          </div>

          <div className="max-h-[min(72vh,34rem)] overflow-y-auto p-2 sm:p-3">
            {isAdmin && matchedQuickLinks.length > 0 ? (
              <section className="mb-2 rounded-xl border border-line bg-app/40 p-2">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {lang === 'bn' ? 'দ্রুত নেভিগেশন' : 'Quick navigation'}
                </p>
                <ul className="space-y-1">
                  {matchedQuickLinks.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.title}</p>
                          {item.subtitle ? <p className="truncate text-xs text-ink-muted">{item.subtitle}</p> : null}
                        </div>
                        <span className="text-xs text-ink-faint">&crarr;</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {loading ? (
              <div className="p-8 text-center text-ink-muted">{lang === 'bn' ? 'খোঁজা হচ্ছে...' : 'Searching...'}</div>
            ) : fetchError ? (
              <div className="p-8 text-center text-ink-muted">
                {lang === 'bn'
                  ? 'এই মুহূর্তে অনুসন্ধান করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।'
                  : 'Search is temporarily unavailable. Please try again.'}
              </div>
            ) : results.length > 0 ? (
              <section>
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  {lang === 'bn' ? 'আর্টিকেল ফলাফল' : 'Article results'}
                </p>
                <ul className="overflow-hidden rounded-xl border border-line">
                  {results.map((article) => (
                    <li key={article.id} className="border-b border-line last:border-b-0">
                      <Link
                        href={`/${lang}/news/${article.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-app"
                      >
                        <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md bg-gray-200">
                          {article.image?.trim() ? (
                            <img src={article.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`line-clamp-2 text-sm font-medium text-ink ${lang === 'bn' ? 'font-bangla' : ''}`}>
                            {articleTitle(article, lang)}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-muted">{articleCategory(article, lang)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : trimmed.length > 1 ? (
              <div className="p-8 text-center text-ink-muted">
                <p className={lang === 'bn' ? 'font-bangla' : ''}>{lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}</p>
              </div>
            ) : (
              <div className="p-8 text-center text-ink-muted">
                <p className={lang === 'bn' ? 'font-bangla text-sm' : 'text-sm'}>
                  {lang === 'bn'
                    ? 'খোঁজা শুরু করতে টাইপ করুন'
                    : isAdmin
                      ? 'Type to search admin tools and news'
                      : 'Type to search news'}
                </p>
              </div>
            )}

            {!isAdmin && trimmed.length < 2 ? (
              <div className="px-2 pb-2 text-center text-xs text-ink-faint">
                {lang === 'bn' ? 'কমপক্ষে ২টি অক্ষর লিখুন' : 'Type at least 2 characters'}
              </div>
            ) : null}

            {isAdmin && matchedQuickLinks.length === 0 && trimmed.length > 1 && results.length === 0 ? (
              <div className="px-2 pb-2 text-center text-xs text-ink-faint">
                {lang === 'bn' ? 'আরও নির্দিষ্ট শব্দ ব্যবহার করুন' : 'Try a more specific keyword'}
              </div>
            ) : null}

            {isAdmin && matchedQuickLinks.length > 0 && trimmed.length === 0 ? (
              <div className="px-2 pb-2 text-center text-xs text-ink-faint">
                {lang === 'bn' ? 'দ্রুত খোলার জন্য টুল নির্বাচন করুন' : 'Select a tool for quick access'}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
