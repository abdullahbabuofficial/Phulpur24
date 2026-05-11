'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Category, Lang } from '@/lib/types';

interface NavigationProps {
  lang: Lang;
  categories?: Category[];
}

export default function Navigation({ lang, categories = [] }: NavigationProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const closeMenu = () => setActiveMenu(null);
  const navItems =
    lang === 'bn'
      ? [
          { label: 'হোম', href: `/${lang}` },
          { label: 'সর্বশেষ', href: `/${lang}/latest` },
          { label: 'বিভাগ', href: '#', hasDropdown: true },
          { label: 'খেলাধুলা', href: `/${lang}/category/sports` },
          { label: 'প্রযুক্তি', href: `/${lang}/category/technology` },
          { label: 'আমাদের সম্পর্কে', href: `/${lang}/about` },
          { label: 'যোগাযোগ', href: `/${lang}/contact` },
          { label: 'অনুসন্ধান', href: `/search?lang=${lang}` },
        ]
      : [
          { label: 'Home', href: `/${lang}` },
          { label: 'Latest', href: `/${lang}/latest` },
          { label: 'Categories', href: '#', hasDropdown: true },
          { label: 'Sports', href: `/${lang}/category/sports` },
          { label: 'Technology', href: `/${lang}/category/technology` },
          { label: 'About', href: `/${lang}/about` },
          { label: 'Contact', href: `/${lang}/contact` },
          { label: 'Search', href: `/search?lang=${lang}` },
        ];

  return (
    <nav className="border-b border-brand-border bg-brand-soft" aria-label={lang === 'bn' ? 'প্রধান নেভিগেশন' : 'Main navigation'}>
      <div className="mx-auto max-w-7xl px-4">
        <ul className="flex items-center gap-0 overflow-x-auto">
          {navItems.map((item) => (
            <li
              key={item.label}
              className="relative shrink-0"
              onMouseEnter={() => (item.hasDropdown ? setActiveMenu(item.label) : closeMenu())}
              onMouseLeave={closeMenu}
            >
              {item.hasDropdown ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === item.label ? null : item.label)}
                    onFocus={() => setActiveMenu(item.label)}
                    aria-expanded={activeMenu === item.label}
                    aria-haspopup="true"
                    className={`flex items-center gap-1 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors hover:text-primary ${lang === 'bn' ? 'font-bangla' : ''}`}
                  >
                    {item.label}
                    <span className="text-xs" aria-hidden="true">▾</span>
                  </button>
                  {activeMenu === item.label && (
                    <div
                      className="absolute left-0 right-auto top-full z-50 w-64 max-w-[calc(100vw-1rem)] rounded-b-lg border border-brand-border bg-white py-2 shadow-xl sm:left-0 sm:right-auto"
                      onFocus={() => setActiveMenu(item.label)}
                    >
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/${lang}/category/${cat.slug}`}
                          className={`block px-4 py-2 text-sm transition-colors hover:bg-brand-soft hover:text-primary ${lang === 'bn' ? 'font-bangla' : ''}`}
                          style={{ borderLeft: `3px solid ${cat.color}` }}
                          onClick={closeMenu}
                        >
                          {lang === 'bn' ? cat.nameBn : cat.nameEn}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`block whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors hover:text-primary ${lang === 'bn' ? 'font-bangla' : ''}`}
                  onFocus={closeMenu}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
