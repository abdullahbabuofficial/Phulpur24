import Link from 'next/link';
import type { Article } from '@/lib/types';
import type { Lang } from '@/lib/types';
import Badge from '@/components/common/Badge';
import { formatDate, getArticleTitle, getArticleSubtitle, getCategoryName, getAuthorName } from '@/lib/i18n';

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

  if (variant === 'lead') {
    return (
      <article className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <Link href={href}>
          <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
            <img
              src={article.image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {article.breaking && (
              <div className="absolute top-3 left-3">
                <Badge variant="breaking">{isBn ? 'ব্রেকিং' : 'BREAKING'}</Badge>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="mb-2">
                <Badge color={article.category.color}>{category}</Badge>
              </div>
              <h2 className={`text-white text-xl md:text-2xl font-bold leading-tight mb-2 ${fontClass}`}>
                {title}
              </h2>
              <p className={`text-gray-300 text-sm line-clamp-2 hidden md:block ${fontClass}`}>{subtitle}</p>
              <div className={`flex items-center gap-3 mt-3 text-xs text-gray-400 ${fontClass}`}>
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
      <article className="group flex gap-4 py-3 border-b border-brand-border last:border-0">
        <Link href={href} className="flex-shrink-0">
          <div className="w-24 h-18 sm:w-32 sm:h-24 bg-gray-200 rounded-lg overflow-hidden">
            <img src={article.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Badge color={article.category.color} className="mb-1.5">{category}</Badge>
          <Link href={href}>
            <h3 className={`font-semibold text-brand-text text-sm leading-snug line-clamp-2 hover:text-primary transition-colors ${fontClass}`}>
              {title}
            </h3>
          </Link>
          <p className={`text-xs text-brand-muted mt-1 ${fontClass}`}>{date} · {author}</p>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group flex gap-3 py-2.5 border-b border-brand-border last:border-0">
        <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded overflow-hidden">
          <img src={article.image} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <Link href={href}>
            <h4 className={`text-xs font-medium text-brand-text line-clamp-2 hover:text-primary transition-colors ${fontClass}`}>
              {title}
            </h4>
          </Link>
          <p className="text-xs text-brand-muted mt-0.5">{date}</p>
        </div>
      </article>
    );
  }

  if (variant === 'sidebar') {
    return (
      <article className="group flex gap-3 items-start">
        <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
          <img src={article.image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        </div>
        <div className="flex-1">
          <Link href={href}>
            <p className={`text-sm font-medium text-brand-text line-clamp-3 hover:text-primary transition-colors leading-snug ${fontClass}`}>
              {title}
            </p>
          </Link>
          <p className={`text-xs text-brand-muted mt-1 ${fontClass}`}>{date}</p>
        </div>
      </article>
    );
  }

  // Default: featured card
  return (
    <article className="group bg-white rounded-xl overflow-hidden border border-brand-border hover:shadow-md transition-shadow">
      <Link href={href}>
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-200">
          <img
            src={article.image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {article.breaking && (
            <div className="absolute top-2 left-2">
              <Badge variant="breaking">{isBn ? 'ব্রেকিং' : 'BREAKING'}</Badge>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge color={article.category.color}>{category}</Badge>
          <span className={`text-xs text-brand-muted ${fontClass}`}>{date}</span>
        </div>
        <Link href={href}>
          <h3 className={`font-bold text-brand-text leading-snug mb-2 line-clamp-2 hover:text-primary transition-colors ${fontClass}`}>
            {title}
          </h3>
        </Link>
        <p className={`text-sm text-brand-muted line-clamp-2 mb-3 ${fontClass}`}>{subtitle}</p>
        <div className={`flex items-center justify-between text-xs text-brand-muted ${fontClass}`}>
          <span>{author}</span>
          <span>{isBn ? `${article.readingTimeBn} মিনিট` : `${article.readingTimeEn} min read`}</span>
        </div>
      </div>
    </article>
  );
}
