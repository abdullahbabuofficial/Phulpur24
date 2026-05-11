'use client';

import Link from 'next/link';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import type { Category, Lang } from '@/lib/types';

interface FooterProps {
  lang: Lang;
  categories?: Category[];
}

const DEFAULT_BRAND_LOGO = '/phulpur24_transparent_png_header_footer_900w.png';

function isRenderableLogoUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  const candidate = value.trim();
  if (candidate.startsWith('/')) return true;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
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

  const resolvedSrc = isRenderableLogoUrl(candidateSrc)
    ? candidateSrc.trim()
    : DEFAULT_BRAND_LOGO;

  const candidateAlt = [
    branding.logoAlt,
    branding.logo_alt,
    root.logoAlt,
    root.logo_alt,
    logo.alt,
  ].find((v): v is string => typeof v === 'string' && v.trim().length > 0);

  return {
    src: resolvedSrc,
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
    { href: config.social.facebook, title: 'Facebook', kind: 'facebook' as const },
    { href: config.social.twitter, title: 'Twitter', kind: 'twitter' as const },
    { href: config.social.youtube, title: 'YouTube', kind: 'youtube' as const },
    { href: config.social.instagram, title: 'Instagram', kind: 'instagram' as const },
  ].filter((item) => isValidExternalUrl(item.href));

  const description = (isBn ? config.descriptionBn : config.descriptionEn).trim();
  const addressLabel = isBn ? 'ঠিকানা' : 'Address';
  const emailLabel = isBn ? 'ইমেইল' : 'Email';
  const sectionTitleClass = `mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 ${
    isBn ? 'font-bangla' : ''
  }`;
  const backToTopLabel = isBn ? 'উপরে যান' : 'Back to top';
  const footerBrandText = isBn
    ? `© ${yearBn} ${config.siteName.trim() || 'ফুলপুর২৪'}। সর্বস্বত্ব সংরক্ষিত।`
    : `© ${year} ${config.siteName.trim() || 'Phulpur24'}. All rights reserved.`;
  const safeCategories = categories.slice(0, 6);

  return (
    <footer className="mt-12 border-t border-white/10 bg-brand-text text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-2 md:gap-x-6 md:divide-y-0 lg:grid-cols-4 lg:gap-x-8">
            <section className="py-5 first:pt-0 last:pb-0 md:py-0">
            <div className="mb-3 inline-flex rounded-md border border-gray-700 bg-white/95 px-2 py-1">
              <img
                src={(logo?.src ?? DEFAULT_BRAND_LOGO)}
                alt={(logo?.alt ?? `${brandName} logo`)}
                className="h-12 w-auto max-w-[14rem] object-contain sm:h-14 sm:max-w-[18rem]"
                loading="lazy"
                decoding="async"
              />
            </div>
            {description ? (
              <p className={`mb-4 max-w-xs text-sm leading-relaxed text-gray-400 ${isBn ? 'font-bangla' : ''}`}>
                {description}
              </p>
            ) : null}
            {socialLinks.length > 0 ? (
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.kind}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.title}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 transition-colors hover:border-primary/60 hover:bg-primary/20 hover:text-white"
                  >
                    {social.kind === 'youtube' ? (
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
                        <polygon fill="white" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                        {social.kind === 'facebook' ? (
                          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                        ) : social.kind === 'twitter' ? (
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                        ) : (
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        )}
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            ) : null}
            </section>

            <section className="py-5 first:pt-0 last:pb-0 md:py-0">
              <h4 className={sectionTitleClass}>
              {isBn ? 'বিভাগ' : 'Categories'}
            </h4>
            <ul className="space-y-2">
              {safeCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/${lang}/category/${cat.slug}`}
                    className={`text-sm text-gray-300 transition-colors hover:text-primary ${isBn ? 'font-bangla' : ''}`}
                  >
                    {isBn ? cat.nameBn : cat.nameEn}
                  </Link>
                </li>
              ))}
              {safeCategories.length === 0 ? (
                <li className={`text-sm text-gray-500 ${isBn ? 'font-bangla' : ''}`}>
                  {isBn ? 'কোনো বিভাগ পাওয়া যায়নি' : 'No categories available'}
                </li>
              ) : null}
            </ul>
            </section>

            <section className="py-5 first:pt-0 last:pb-0 md:py-0">
              <h4 className={sectionTitleClass}>
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
                  <Link href={link.href} className={`text-gray-300 transition-colors hover:text-primary ${isBn ? 'font-bangla' : ''}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            </section>

            <section className="py-5 first:pt-0 last:pb-0 md:py-0">
              <h4 className={sectionTitleClass}>
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </h4>
            <ul className="space-y-3 text-sm">
              {(isBn ? config.contact.addressBn : config.contact.addressEn).trim() ? (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-gray-500">{addressLabel}:</span>
                  <span className={isBn ? 'font-bangla' : ''}>{isBn ? config.contact.addressBn : config.contact.addressEn}</span>
                </li>
              ) : null}

              {config.contact.email.trim() ? (
                <li className="flex items-center gap-2">
                  <span className="text-gray-500">{emailLabel}:</span>
                  <a href={`mailto:${config.contact.email}`} className="transition-colors hover:text-primary hover:underline">
                    {config.contact.email}
                  </a>
                </li>
              ) : null}

            </ul>
          </section>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-gray-500 sm:flex-row">
          <p className={isBn ? 'font-bangla' : ''}>{footerBrandText}</p>
          <div className="flex items-center gap-4">
            <Link href={`/${lang}/about`} className={`transition-colors hover:text-gray-300 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'আমাদের সম্পর্কে' : 'About'}
            </Link>
            <Link href={`/${lang}/contact`} className={`transition-colors hover:text-gray-300 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'যোগাযোগ' : 'Contact'}
            </Link>
            <Link href={`/search?lang=${lang}`} className={`transition-colors hover:text-gray-300 ${isBn ? 'font-bangla' : ''}`}>
              {isBn ? 'অনুসন্ধান' : 'Search'}
            </Link>
            <button
              type="button"
              className={`rounded border border-white/10 px-2 py-0.5 text-[11px] text-gray-400 transition-colors hover:border-white/25 hover:text-white ${isBn ? 'font-bangla' : ''}`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {backToTopLabel}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
