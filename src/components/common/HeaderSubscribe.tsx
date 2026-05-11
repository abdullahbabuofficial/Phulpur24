'use client';

import { useEffect, useRef, useState } from 'react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { newsletter } from '@/lib/supabase';
import type { Lang } from '@/lib/types';

interface HeaderSubscribeProps {
  lang: Lang;
}

type State = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Compact "Subscribe by email" CTA used in the public site header.
 * Replaces the old `/admin/dashboard` button so the public header no
 * longer surfaces admin entry points.
 */
export default function HeaderSubscribe({ lang }: HeaderSubscribeProps) {
  const { config } = useSiteConfig();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBn = lang === 'bn';
  const labels = {
    button: isBn ? 'ইমেইলে সাবস্ক্রাইব' : 'Subscribe by email',
    short: isBn ? 'সাবস্ক্রাইব' : 'Subscribe',
    placeholder: isBn ? 'আপনার ইমেইল লিখুন' : 'Enter your email',
    submit: isBn ? 'যোগ দিন' : 'Join',
    sending: isBn ? 'পাঠানো হচ্ছে...' : 'Sending...',
    success: isBn ? 'সাবস্ক্রাইব সম্পন্ন হয়েছে। ধন্যবাদ।' : 'Thank you. You are subscribed.',
    close: isBn ? 'বন্ধ করুন' : 'Close',
    blurb: isBn
      ? 'সর্বশেষ ফুলপুর সংবাদ সরাসরি আপনার ইনবক্সে।'
      : 'Latest Phulpur news delivered to your inbox.',
  };

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!config.features.enableNewsletter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('submitting');
    setError('');
    const res = await newsletter.subscribe(email.trim(), lang, 'public-header');
    if (res.error) {
      setState('error');
      setError(res.error.message);
      return;
    }
    setState('success');
    setEmail('');
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark ${
          isBn ? 'font-bangla' : ''
        }`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 11H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2z"
          />
        </svg>
        {labels.short}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={labels.button}
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-brand-border bg-white p-4 shadow-xl"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className={`text-sm font-semibold text-brand-text ${isBn ? 'font-bangla' : ''}`}>
                {labels.button}
              </h3>
              <p className={`mt-0.5 text-xs text-brand-muted ${isBn ? 'font-bangla' : ''}`}>
                {labels.blurb}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="text-brand-muted hover:text-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {state === 'success' ? (
            <p
              className={`rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 ${
                isBn ? 'font-bangla' : ''
              }`}
            >
              {labels.success}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={labels.placeholder}
                required
                disabled={state === 'submitting'}
                className={`flex-1 rounded-md border border-brand-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  isBn ? 'font-bangla' : ''
                }`}
              />
              <button
                type="submit"
                disabled={state === 'submitting'}
                className={`whitespace-nowrap rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 ${
                  isBn ? 'font-bangla' : ''
                }`}
              >
                {state === 'submitting' ? labels.sending : labels.submit}
              </button>
            </form>
          )}

          {error ? (
            <p className={`mt-2 text-xs text-red-600 ${isBn ? 'font-bangla' : ''}`}>{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
