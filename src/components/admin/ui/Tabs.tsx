import type { ReactNode } from 'react';

interface TabsProps<T extends string> {
  tabs: { id: T; label: ReactNode; count?: number; icon?: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  if (variant === 'pills') {
    return (
      <div className={`inline-flex rounded-lg border border-line bg-app p-1 ${className}`} role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-white text-ink shadow-card font-medium'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.icon}
              {tab.label}
              {typeof tab.count === 'number' ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    isActive ? 'bg-accent-soft text-accent' : 'bg-line text-ink-muted'
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-1 overflow-x-auto border-b border-line ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative inline-flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              isActive ? 'text-ink font-medium' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="rounded-full bg-app px-1.5 text-[10px] font-semibold text-ink-muted">
                {tab.count}
              </span>
            ) : null}
            {isActive ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
