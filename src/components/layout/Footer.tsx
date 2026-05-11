'use client';

import Link from 'next/link';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import type { Category, Lang } from '@/lib/types';

interface FooterProps {
  lang: Lang;
  categories?: Category[];
}

function isValidExternalUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function getConfiguredLogo(config: unknown, fallbackName: string): { src: string; alt: string } | null {
  const root = config as Record<string, unknown>;
  const branding = (root.branding ?? {}) as Record<string, unknown>;
  const logo = (root.logo ?? {}) as Record<string, unknown>;
  const candidateSrc = [
    branding.logoUrl,
    branding.logo_url,
    root.logoUrl,
    root.logo_url,
    logo.url,
  ].find((v): v is string => typeof v === 'string' && v.trim().length > 0);

  if (!isValidExternalUrl(candidateSrc)) return null;

  const candidateAlt = [
    branding.logoAlt,
    branding.logo_alt,
    root.logoAlt,
    root.logo_alt,
    logo.alt,
  ].find((v): v is string => typeof v === 'string' && v.trim().length > 0);

  return {
    src: candidateSrc.trim(),
    alt: candidateAlt?.trim() || `${fallbackName} logo`,
  };
}

export default function Footer({ lang, categories = [] }: FooterProps) {
  const isBn = lang === 'bn';
  const { config } = useSiteConfig();
  const brandName = config.siteName.trim() || 'Phulpur24';
  const logo = getConfiguredLogo(config, brandName);
  const year = new Date().getFullYear();
  const yearBn = new Intl.NumberFormat('bn-BD', { useGrouping: false }).format(year);

  const socialLinks = [
    { label: 'FB', href: config.social.facebook, title: 'Facebook' },
    { label: 'TW', href: config.social.twitter, title: 'Twitter' },
    { label: 'YT', href: config.social.youtube, title: 'YouTube' },
    { label: 'IG', href: config.social.instagram, title: 'Instagram' },
  ].filter((item) => isValidExternalUrl(item.href));

  const description = (isBn ? config.descriptionBn : config.descriptionEn).trim();

  return (
    <footer className="mt-12 bg-brand-text text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            {logo ? (
              <div className="mb-3 inline-flex rounded-md border border-gray-700 bg-white/95 px-2 py-1">
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="h-10 w-auto max-w-[12rem] object-contain sm:max-w-[14rem]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div
                className="mb-3 inline-block max-w-full truncate rounded bg-primary px-3 py-1.5 text-lg font-black tracking-tight text-white"
                title={brandName}
              >
                {brandName}
              </div>
            )}
            {description ? (
              <p className={`mb-4 text-sm text-gray-400 ${isBn ? 'font-bangla' : ''}`}>{description}</p>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.title}
                    className="flex h-8 w-8 items-center justify-center rounded bg-gray-700 text-xs font-bold transition-colors hover:bg-primary"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h4 className={`mb-4 font-semibold text-white ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'বিভাগ' : 'Categories'}
            </h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${lang}/category/${cat.slug}`}
                    className={`text-sm transition-colors hover:text-primary ${isBn ? 'font-bangla' : ''}`}
                  >
                    {isBn ? cat.nameBn : cat.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`mb-4 font-semibold text-white ${isBn ? 'font-bangla' : ''}`}>
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
                  <Link href={link.href} className={`transition-colors hover:text-primary ${isBn ? 'font-bangla' : ''}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`mb-4 font-semibold text-white ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </h4>
            <ul className="space-y-3 text-sm">
              {(isBn ? config.contact.addressBn : config.contact.addressEn).trim() ? (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-gray-500">Addr:</span>
                  <span className={isBn ? 'font-bangla' : ''}>{isBn ? config.contact.addressBn : config.contact.addressEn}</span>
                </li>
              ) : null}

              {config.contact.email.trim() ? (
                <li className="flex items-center gap-2">
                  <span className="text-gray-500">Email:</span>
                  <a href={`mailto:${config.contact.email}`} className="transition-colors hover:text-primary">
                    {config.contact.email}
                  </a>
                </li>
              ) : null}

              {config.contact.phone.trim() ? (
                <li className="flex items-center gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span>{config.contact.phone}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-700 pt-6 text-xs text-gray-500 sm:flex-row">
          <p className={isBn ? 'font-bangla' : ''}>
            {isBn
              ? `© ${yearBn} ${config.siteName.trim() || 'ফুলপুর২৪'}। সর্বস্বত্ব সংরক্ষিত।`
              : `© ${year} ${config.siteName.trim() || 'Phulpur24'}. All rights reserved.`}
          </p>
          <div className="flex gap-4">
            <Link href={`/${lang}/about`} className={`transition-colors hover:text-gray-300 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'আমাদের সম্পর্কে' : 'About'}
            </Link>
            <Link href={`/${lang}/contact`} className={`transition-colors hover:text-gray-300 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </Link>
            <Link href={`/search?lang=${lang}`} className={`transition-colors hover:text-gray-300 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'অনুসন্ধান' : 'Search'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
