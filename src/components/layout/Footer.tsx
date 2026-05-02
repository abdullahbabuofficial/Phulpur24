
'use client';

import Link from 'next/link';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import type { Category, Lang } from '@/lib/types';

interface FooterProps {
  lang: Lang;
  categories?: Category[];
}

export default function Footer({ lang, categories = [] }: FooterProps) {
  const isBn = lang === 'bn';
  const { config } = useSiteConfig();
  const socialLinks = [
    { label: 'FB', href: config.social.facebook, title: 'Facebook' },
    { label: 'TW', href: config.social.twitter, title: 'Twitter' },
    { label: 'YT', href: config.social.youtube, title: 'YouTube' },
    { label: 'IG', href: config.social.instagram, title: 'Instagram' },
  ];

  return (
    <footer className="bg-brand-text text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="bg-primary text-white font-black text-lg px-3 py-1.5 rounded tracking-tight inline-block mb-3 max-w-full truncate" title={config.siteName}>
              {config.siteName.trim() || 'Phulpur24'}
            </div>
            <p className={`text-sm text-gray-400 mb-4 ${isBn ? 'font-bangla' : ''}`}>
                {isBn ? config.descriptionBn : config.descriptionEn}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.title}
                  className="w-8 h-8 bg-gray-700 hover:bg-primary rounded flex items-center justify-center text-xs font-bold transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className={`text-white font-semibold mb-4 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'বিভাগ' : 'Categories'}
            </h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${lang}/category/${cat.slug}`}
                    className={`text-sm hover:text-primary transition-colors ${isBn ? 'font-bangla' : ''}`}
                  >
                    {isBn ? cat.nameBn : cat.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`text-white font-semibold mb-4 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'দ্রুত লিংক' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: isBn ? 'হোম' : 'Home', href: `/${lang}` },
                { label: isBn ? 'সর্বশেষ সংবাদ' : 'Latest News', href: `/${lang}/latest` },
                { label: isBn ? 'আমাদের সম্পর্কে' : 'About Us', href: `/${lang}/about` },
                { label: isBn ? 'যোগাযোগ' : 'Contact', href: `/${lang}/contact` },
                { label: isBn ? 'অনুসন্ধান' : 'Search', href: `/search?lang=${lang}` },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`hover:text-primary transition-colors ${isBn ? 'font-bangla' : ''}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={`text-white font-semibold mb-4 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span className={isBn ? 'font-bangla' : ''}>
                    {isBn ? config.contact.addressBn : config.contact.addressEn}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span>
                  <a href={`mailto:${config.contact.email}`} className="hover:text-primary transition-colors">
                    {config.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                 <span>{config.contact.phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p className={isBn ? 'font-bangla' : ''}>
            {isBn
              ? `© ২০২৬ ${config.siteName.trim() || 'ফুলপুর২৪'}। সর্বস্বত্ব সংরক্ষিত।`
              : `© 2026 ${config.siteName.trim() || 'Phulpur24'}. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            <Link href={`/${lang}/about`} className={`hover:text-gray-300 transition-colors ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'আমাদের সম্পর্কে' : 'About'}
            </Link>
            <Link href={`/${lang}/contact`} className={`hover:text-gray-300 transition-colors ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </Link>
            <Link href={`/search?lang=${lang}`} className={`hover:text-gray-300 transition-colors ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'অনুসন্ধান' : 'Search'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
