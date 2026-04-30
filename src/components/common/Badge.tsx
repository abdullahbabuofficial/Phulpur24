import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'default' | 'outline' | 'breaking' | 'status';
  className?: string;
}

export default function Badge({ children, color, variant = 'default', className = '' }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold';

  if (variant === 'breaking') {
    return (
      <span className={`${base} bg-primary text-white uppercase tracking-wide ${className}`}>
        {children}
      </span>
    );
  }

  if (variant === 'outline') {
    return (
      <span
        className={`${base} border ${className}`}
        style={color ? { borderColor: color, color } : undefined}
      >
        {children}
      </span>
    );
  }

  if (variant === 'status') {
    const statusClasses: Record<string, string> = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800',
      complete: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      missing: 'bg-red-100 text-red-800',
    };
    const key = typeof children === 'string' ? children.toLowerCase() : '';
    return (
      <span className={`${base} ${statusClasses[key] ?? 'bg-gray-100 text-gray-700'} ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={`${base} text-white ${className}`}
      style={color ? { backgroundColor: color } : { backgroundColor: '#B91C1C' }}
    >
      {children}
    </span>
  );
}
