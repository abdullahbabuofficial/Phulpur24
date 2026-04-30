'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  lang?: 'bn' | 'en';
}

export default function Pagination({ currentPage, totalPages, onPageChange, lang = 'en' }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1);

  const handleClick = (page: number) => {
    if (onPageChange) onPageChange(page);
  };

  const label = lang === 'bn'
    ? `পৃষ্ঠা ${currentPage} / ${totalPages}`
    : `Page ${currentPage} of ${totalPages}`;

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        onClick={() => handleClick(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm border border-brand-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {lang === 'bn' ? '← আগের' : '← Prev'}
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => handleClick(page)}
          className={`w-9 h-9 text-sm rounded transition-colors ${
            page === currentPage
              ? 'bg-primary text-white font-bold'
              : 'border border-brand-border hover:border-primary hover:text-primary'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => handleClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm border border-brand-border rounded hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {lang === 'bn' ? 'পরের →' : 'Next →'}
      </button>

      <span className="text-xs text-brand-muted ml-2">{label}</span>
    </div>
  );
}
