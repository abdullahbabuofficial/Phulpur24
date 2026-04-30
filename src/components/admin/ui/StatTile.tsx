import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon?: ReactNode;
  hint?: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const toneRing: Record<NonNullable<StatTileProps['tone']>, string> = {
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  neutral: 'bg-app text-ink-muted',
};

export function StatTile({ label, value, delta, icon, hint, tone = 'accent' }: StatTileProps) {
  return (
    <div className="ui-card p-5 transition-shadow hover:shadow-elev">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink sm:text-[28px]">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        {icon ? (
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneRing[tone]}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${
              delta.positive
                ? 'bg-success-soft text-success-text'
                : 'bg-danger-soft text-danger-text'
            }`}
          >
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
        ) : null}
        {hint ? <span className="text-ink-muted">{hint}</span> : null}
      </div>
    </div>
  );
}
