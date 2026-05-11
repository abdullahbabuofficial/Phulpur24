import Link from 'next/link';
import type { ReactNode } from 'react';

type Lang = 'en' | 'bn';

interface ArticleMetaRailProps {
  lang: Lang;
  authorName: string;
  authorRole: string;
  authorHref?: string;
  dateLabel: string;
  readingTimeLabel: string;
  viewsLabel: string;
  articleTitle: string;
  articlePath: string;
}

function resolveShareUrl(articlePath: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/+$/, '');
  if (!base) return articlePath;
  return `${base}${articlePath}`;
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M13.5 8.5V6.75c0-.67.53-1.25 1.25-1.25H16V2h-2.34C10.93 2 9 3.93 9 6.66V8.5H6v3.5h3V22h4.5v-10H16l.5-3.5h-3Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M18.12 3H21l-6.3 7.2L22.2 21h-5.87l-4.6-6.01L6.48 21H3.6l6.74-7.7L2 3h6.02l4.15 5.45L18.12 3Zm-1 16h1.63L7.13 4.9H5.37L17.12 19Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12.04 2A9.97 9.97 0 0 0 3.5 17.2L2 22l4.94-1.45A9.98 9.98 0 1 0 12.04 2Zm0 18.11c-1.5 0-2.95-.4-4.2-1.17l-.3-.18-2.94.86.9-2.86-.2-.3a8.14 8.14 0 1 1 6.74 3.65Zm4.46-6.1c-.24-.12-1.4-.68-1.62-.76-.22-.08-.38-.12-.54.12s-.62.76-.76.92c-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.2-.7-.62-1.18-1.38-1.32-1.62-.14-.24-.01-.37.1-.5.1-.1.24-.26.36-.38.12-.12.16-.2.24-.34.08-.14.04-.26-.02-.38-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.42-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.62 4.12 3.67.58.25 1.02.4 1.38.5.58.18 1.1.16 1.52.1.46-.06 1.4-.58 1.6-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

interface ShareLinkProps {
  href: string;
  label: string;
  className: string;
  icon: ReactNode;
}

function ShareLink({ href, label, className, icon }: ShareLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors ${className}`}
    >
      {icon}
    </Link>
  );
}

export default function ArticleMetaRail({
  lang,
  authorName,
  authorRole,
  authorHref,
  dateLabel,
  readingTimeLabel,
  viewsLabel,
  articleTitle,
  articlePath,
}: ArticleMetaRailProps) {
  const first = authorName.trim().charAt(0).toUpperCase() || 'A';
  const shareLabel = lang === 'bn' ? 'শেয়ার করুন' : 'Share';
  const shareUrl = resolveShareUrl(articlePath);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(articleTitle);
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const xHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  const whatsappHref = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

  return (
    <div className="border-y border-brand-border bg-app px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {authorHref ? (
          <Link
            href={authorHref}
            className="group flex min-w-0 items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-white"
            aria-label={lang === 'bn' ? `${authorName} প্রোফাইল` : `${authorName} profile`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/90 text-xs font-bold text-white">
              {first}
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold text-brand-text group-hover:text-primary ${lang === 'bn' ? 'font-bangla' : ''}`}>{authorName}</p>
              <p className={`truncate text-xs text-brand-muted ${lang === 'bn' ? 'font-bangla' : ''}`}>{authorRole}</p>
            </div>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/90 text-xs font-bold text-white">
              {first}
            </div>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold text-brand-text ${lang === 'bn' ? 'font-bangla' : ''}`}>{authorName}</p>
              <p className={`truncate text-xs text-brand-muted ${lang === 'bn' ? 'font-bangla' : ''}`}>{authorRole}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-brand-muted sm:text-sm">
          <span className={lang === 'bn' ? 'font-bangla' : ''}>{dateLabel}</span>
          <span className="text-brand-border">•</span>
          <span className={lang === 'bn' ? 'font-bangla' : ''}>{readingTimeLabel}</span>
          <span className="text-brand-border">•</span>
          <span className={lang === 'bn' ? 'font-bangla' : ''}>{viewsLabel}</span>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <span className={`hidden text-xs font-semibold uppercase tracking-wide text-brand-muted sm:block ${lang === 'bn' ? 'font-bangla normal-case tracking-normal' : ''}`}>
            {shareLabel}
          </span>
          <ShareLink href={facebookHref} label="Share on Facebook" className="bg-[#1877f2] hover:bg-[#166fe0]" icon={<FacebookIcon />} />
          <ShareLink href={xHref} label="Share on X" className="bg-[#0f172a] hover:bg-black" icon={<XIcon />} />
          <ShareLink href={whatsappHref} label="Share on WhatsApp" className="bg-[#22c55e] hover:bg-[#16a34a]" icon={<WhatsAppIcon />} />
        </div>
      </div>
    </div>
  );
}
