import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
  rightSlot?: ReactNode;
  langClass?: 'font-bangla';
}

export function Input({
  label,
  hint,
  error,
  iconLeft,
  rightSlot,
  langClass,
  id,
  className = '',
  ...rest
}: InputProps) {
  const reactId = useId();
  const fieldId = id ?? `in-${reactId}`;
  return (
    <div>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {iconLeft ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {iconLeft}
          </span>
        ) : null}
        <input
          id={fieldId}
          {...rest}
          className={`w-full rounded-lg border border-line bg-white text-sm text-ink placeholder:text-ink-faint
                      focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15
                      disabled:bg-app disabled:text-ink-muted transition-colors
                      ${iconLeft ? 'pl-9' : 'pl-3'} ${rightSlot ? 'pr-10' : 'pr-3'} py-2
                      ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''}
                      ${langClass ?? ''} ${className}`}
        />
        {rightSlot ? <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{rightSlot}</span> : null}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  langClass?: 'font-bangla';
}

export function Textarea({ label, hint, error, langClass, id, className = '', ...rest }: TextareaProps) {
  const reactId = useId();
  const fieldId = id ?? `ta-${reactId}`;
  return (
    <div>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        {...rest}
        className={`ui-input resize-y min-h-[88px] ${langClass ?? ''} ${
          error ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''
        } ${className}`}
      />
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export function Select({ label, hint, id, className = '', children, ...rest }: SelectProps) {
  const reactId = useId();
  const fieldId = id ?? `sel-${reactId}`;
  return (
    <div>
      {label ? (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <select id={fieldId} {...rest} className={`ui-input pr-8 ${className}`}>
        {children}
      </select>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
