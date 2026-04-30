'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Lang, Article } from '@/lib/types';
import { searchPublishedArticles } from '@/lib/data';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Lang;
}

export default function SearchModal({ isOpen, onClose, lang }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const rows = await searchPublishedArticles(query);
      if (cancelled) return;
      setResults(rows.slice(0, 6));
      setLoading(false);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-brand-border px-4">
          <svg className="w-5 h-5 text-brand-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'সংবাদ খুঁজুন...' : 'Search news...'}
            className={`flex-1 px-4 py-4 text-lg focus:outline-none ${lang === 'bn' ? 'font-bangla' : ''}`}
          />
          <button onClick={onClose} className="p-2 text-brand-muted hover:text-brand-text">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-brand-muted">
            {lang === 'bn' ? 'খোঁজা হচ্ছে…' : 'Searching…'}
          </div>
        ) : results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto divide-y divide-brand-border">
            {results.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/${lang}/news/${article.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-brand-soft transition-colors"
                >
                  <div className="w-12 h-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                    <img src={article.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium text-brand-text line-clamp-2 ${lang === 'bn' ? 'font-bangla' : ''}`}>
                      {lang === 'bn' ? article.titleBn : article.titleEn}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {lang === 'bn' ? article.category.nameBn : article.category.nameEn}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : query.length > 1 ? (
          <div className="p-8 text-center text-brand-muted">
            <p className={lang === 'bn' ? 'font-bangla' : ''}>
              {lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
            </p>
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-brand-muted">
            {lang === 'bn' ? 'অনুসন্ধান করতে টাইপ করুন' : 'Type to search'} • ESC to close
          </div>
        )}
      </div>
    </div>
  );
}
