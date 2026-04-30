'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SearchModal from '@/components/common/SearchModal';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

interface HeaderProps {
  lang: Lang;
}

export default function Header({ lang }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { config } = useSiteConfig();

  const date = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date());
  const oppLang = lang === 'bn' ? 'en' : 'bn';
  const oppLabel = lang === 'bn' ? 'EN' : 'বাং';
  const searchLabel = lang === 'bn' ? 'অনুসন্ধান খুলুন' : 'Open search';
  const adLabel = lang === 'bn' ? 'বিজ্ঞাপন · 728×90' : 'Advertisement · 728×90';

  const tagline =
    lang === 'bn'
      ? config.taglineBn.trim() || t(lang, 'slogan')
      : config.taglineEn.trim() || t(lang, 'slogan');

  type SocialKind = 'facebook' | 'twitter' | 'youtube' | 'instagram';

  const socialItems = useMemo(() => {
    const entries: { href: string; label: string; kind: SocialKind }[] = [];
    const { facebook, twitter, youtube, instagram } = config.social;
    if (facebook?.trim()) entries.push({ href: facebook.trim(), label: 'Facebook', kind: 'facebook' });
    if (twitter?.trim()) entries.push({ href: twitter.trim(), label: 'Twitter', kind: 'twitter' });
    if (youtube?.trim()) entries.push({ href: youtube.trim(), label: 'YouTube', kind: 'youtube' });
    if (instagram?.trim()) entries.push({ href: instagram.trim(), label: 'Instagram', kind: 'instagram' });
    return entries;
  }, [config.social]);

  const brandName = config.siteName.trim() || 'Phulpur24';

  return (
    <>
      <div className="bg-brand-text text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span className={lang === 'bn' ? 'font-bangla' : ''}>{date}</span>
          <div className="flex items-center gap-3">
            {socialItems.map((item) => (
              <a
                key={item.kind}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="hover:text-primary transition-colors"
              >
                {item.kind === 'youtube' ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                    <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    {item.kind === 'facebook' ? (
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    ) : item.kind === 'twitter' ? (
                      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                    ) : (
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    )}
                  </svg>
                )}
              </a>
            ))}
            <div className="h-3 w-px bg-gray-600" />
            <Link href={`/${oppLang}`} aria-label={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'} className="font-medium hover:text-primary transition-colors tracking-wide">
              {oppLabel}
            </Link>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-brand-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href={`/${lang}`} className="flex items-center gap-2 min-w-0">
            <div
              className="bg-primary text-white font-black text-base sm:text-lg px-2.5 sm:px-3 py-1.5 rounded tracking-tight leading-none shrink-0 max-w-[13rem] sm:max-w-[16rem] truncate"
              title={brandName}
            >
              {brandName}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className={`text-xs text-brand-muted leading-tight truncate ${lang === 'bn' ? 'font-bangla' : ''}`}>{tagline}</p>
            </div>
          </Link>

          {config.features.enableAds ? (
            <div className="hidden lg:flex items-center justify-center flex-1 px-4">
              <div className="bg-gray-100 border border-dashed border-gray-300 rounded text-gray-400 text-xs px-8 py-3 max-w-xl w-full">
                <p className={lang === 'bn' ? 'font-bangla' : ''}>{adLabel}</p>
              </div>
            </div>
          ) : (
            <div className="hidden lg:block flex-1" aria-hidden="true" />
          )}

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2 text-brand-muted hover:text-primary transition-colors rounded-lg hover:bg-brand-soft"
              aria-label={searchLabel}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href={`/${oppLang}`}
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-primary border border-brand-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              {oppLang === 'en' ? 'English' : 'বাংলা'}
            </Link>
            <Link
              href="/admin/dashboard"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </Link>
          </div>
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} lang={lang} />
    </>
  );
}
