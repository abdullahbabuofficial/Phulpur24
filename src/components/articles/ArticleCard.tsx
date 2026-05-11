import Link from 'next/link';
import type { Article, Lang } from '@/lib/types';
import Badge from '@/components/common/Badge';
import {
  formatDate,
  getArticleTitle,
  getArticleSubtitle,
  getCategoryName,
  getAuthorName,
} from '@/lib/i18n';

interface ArticleCardProps {
  article: Article;
  lang: Lang;
  variant?: 'lead' | 'featured' | 'horizontal' | 'compact' | 'sidebar' | 'video' | 'photo';
}

export default function ArticleCard({ article, lang, variant = 'featured' }: ArticleCardProps) {
  const title = getArticleTitle(article, lang);
  const subtitle = getArticleSubtitle(article, lang);
  const category = getCategoryName(article.category, lang);
  const author = getAuthorName(article.author, lang);
  const date = formatDate(article.publishedAt, lang);
  const href = `/${lang}/news/${article.slug}`;
  const isBn = lang === 'bn';
  const fontClass = isBn ? 'font-bangla' : '';
  const imageSrc = article.image?.trim() || null;

  const ImageOrPlaceholder = ({
    className,
    hoverClass = '',
  }: {
    className: string;
    hoverClass?: string;
  }) =>
    imageSrc ? (
      <img src={imageSrc} alt={title} className={`${className} ${hoverClass}`.trim()} />
    ) : (
      <div className={`${className} flex items-center justify-center bg-gray-200 text-[11px] text-gray-500`}>
        No image
      </div>
    );

  if (variant === 'lead') {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
        <Link href={href}>
          <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
            <ImageOrPlaceholder className="h-full w-full object-cover" hoverClass="group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {article.breaking && (
              <div className="absolute left-3 top-3">
                <Badge variant="breaking">{isBn ? 'ব্রেকিং' : 'BREAKING'}</Badge>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="mb-2">
                <Badge color={article.category.color}>{category}</Badge>
              </div>
              <h2 className={`mb-2 text-xl font-bold leading-tight text-white md:text-2xl ${fontClass}`}>
                {title}
              </h2>
              <p className={`hidden line-clamp-2 text-sm text-gray-300 md:block ${fontClass}`}>{subtitle}</p>
              <div className={`mt-3 flex items-center gap-3 text-xs text-gray-400 ${fontClass}`}>
                <span>{author}</span>
                <span>·</span>
                <span>{date}</span>
                <span>·</span>
                <span>{isBn ? `${article.readingTimeBn} মিনিট` : `${article.readingTimeEn} min read`}</span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'horizontal') {
    return (
      <article className="group flex gap-4 border-b border-brand-border py-3 last:border-0">
        <Link href={href} className="shrink-0">
          <div className="h-18 w-24 overflow-hidden rounded-lg bg-gray-200 sm:h-24 sm:w-32">
            <ImageOrPlaceholder className="h-full w-full object-cover" hoverClass="group-hover:scale-105 transition-transform duration-300" />
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Badge color={article.category.color} className="mb-1.5">
            {category}
          </Badge>
          <Link href={href}>
            <h3 className={`line-clamp-2 text-sm font-semibold leading-snug text-brand-text transition-colors hover:text-primary ${fontClass}`}>
              {title}
            </h3>
          </Link>
          <p className={`mt-1 text-xs text-brand-muted ${fontClass}`}>
            {date} · {author}
          </p>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group flex gap-3 border-b border-brand-border py-2.5 last:border-0">
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-200">
          <ImageOrPlaceholder className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={href}>
            <h4 className={`line-clamp-2 text-xs font-medium text-brand-text transition-colors hover:text-primary ${fontClass}`}>
              {title}
            </h4>
          </Link>
          <p className="mt-0.5 text-xs text-brand-muted">{date}</p>
        </div>
      </article>
    );
  }

  if (variant === 'sidebar') {
    return (
      <article className="group flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-200">
          <ImageOrPlaceholder className="h-full w-full object-cover" hoverClass="group-hover:scale-105 transition-transform duration-200" />
        </div>
        <div className="flex-1">
          <Link href={href}>
            <p className={`line-clamp-3 text-sm font-medium leading-snug text-brand-text transition-colors hover:text-primary ${fontClass}`}>
              {title}
            </p>
          </Link>
          <p className={`mt-1 text-xs text-brand-muted ${fontClass}`}>{date}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="group overflow-hidden rounded-xl border border-brand-border bg-white transition-shadow hover:shadow-md">
      <Link href={href}>
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-200">
          <ImageOrPlaceholder className="h-full w-full object-cover" hoverClass="group-hover:scale-105 transition-transform duration-300" />
          {article.breaking && (
            <div className="absolute left-2 top-2">
              <Badge variant="breaking">{isBn ? 'ব্রেকিং' : 'BREAKING'}</Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <Badge color={article.category.color}>{category}</Badge>
          <span className={`text-xs text-brand-muted ${fontClass}`}>{date}</span>
        </div>
        <Link href={href}>
          <h3 className={`mb-2 line-clamp-2 font-bold leading-snug text-brand-text transition-colors hover:text-primary ${fontClass}`}>
            {title}
          </h3>
        </Link>
        <p className={`mb-3 line-clamp-2 text-sm text-brand-muted ${fontClass}`}>{subtitle}</p>
        <div className={`flex items-center justify-between text-xs text-brand-muted ${fontClass}`}>
          <span>{author}</span>
          <span>{isBn ? `${article.readingTimeBn} মিনিট` : `${article.readingTimeEn} min read`}</span>
        </div>
      </div>
    </article>
  );
}
