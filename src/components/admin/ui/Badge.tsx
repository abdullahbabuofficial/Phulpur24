import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const toneClass: Record<Tone, string> = {
  neutral: 'bg-app text-ink-muted border border-line',
  success: 'bg-success-soft text-success-text border border-success/20',
  warning: 'bg-warning-soft text-warning-text border border-warning/20',
  danger: 'bg-danger-soft text-danger-text border border-danger/20',
  info: 'bg-info-soft text-info-text border border-info/20',
  accent: 'bg-accent-soft text-accent border border-accent/20',
};

const dotClass: Record<Tone, string> = {
  neutral: 'bg-ink-faint',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
};

export function Badge({ tone = 'neutral', dot = false, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} /> : null}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    published: 'success',
    draft: 'warning',
    pending: 'info',
    archived: 'neutral',
    complete: 'success',
    partial: 'warning',
    missing: 'danger',
    active: 'success',
    invited: 'info',
    suspended: 'danger',
  };
  const tone = map[status.toLowerCase()] ?? 'neutral';
  return (
    <Badge tone={tone} dot>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
