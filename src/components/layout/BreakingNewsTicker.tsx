'use client';

interface BreakingNewsTickerProps {
  lang?: 'bn' | 'en';
  items?: string[];
}

export default function BreakingNewsTicker({ lang = 'bn', items = [] }: BreakingNewsTickerProps) {
  const label = lang === 'bn' ? 'ব্রেকিং নিউজ' : 'BREAKING';
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-primary text-white flex items-center overflow-hidden h-9">
      <div className="flex-shrink-0 bg-primary-dark px-4 h-full flex items-center z-10">
        <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
          {label}
        </span>
        <span className="ml-2 text-red-300">▶</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-scroll flex gap-12 whitespace-nowrap text-sm py-2 px-4">
          {items.map((item, i) => (
            <span key={i} className={`${lang === 'bn' ? 'font-bangla' : ''}`}>
              {item}
              <span className="mx-6 text-red-300">◆</span>
            </span>
          ))}
          {items.map((item, i) => (
            <span key={`dup-${i}`} className={`${lang === 'bn' ? 'font-bangla' : ''}`}>
              {item}
              <span className="mx-6 text-red-300">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
