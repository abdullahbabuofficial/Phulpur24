interface ArticleBodyProps {
  content: string;
  lang?: 'bn' | 'en';
}

export default function ArticleBody({ content, lang = 'bn' }: ArticleBodyProps) {
  return (
    <div
      className={`prose prose-lg max-w-none ${lang === 'bn' ? 'font-bangla' : ''} text-brand-text`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
