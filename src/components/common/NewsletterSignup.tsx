'use client';

import { useState } from 'react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { newsletter } from '@/lib/supabase';

interface NewsletterSignupProps {
  lang?: 'bn' | 'en';
  variant?: 'default' | 'compact';
}

export default function NewsletterSignup({ lang = 'bn', variant = 'default' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const { config } = useSiteConfig();

  if (!config.features.enableNewsletter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('submitting');
    setError('');
    const res = await newsletter.subscribe(email.trim(), lang, 'public-site');
    if (res.error) {
      setState('error');
      setError(res.error.message);
      return;
    }
    setState('success');
  };

  const subscribed = state === 'success';
  const submitting = state === 'submitting';

  if (variant === 'compact') {
    return (
      <div className="bg-primary text-white rounded-lg p-4">
        {subscribed ? (
          <p className="text-center text-sm font-medium">
            {lang === 'bn' ? '✓ সাবস্ক্রাইব হয়েছে!' : '✓ Subscribed!'}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={lang === 'bn' ? 'ইমেইল' : 'Email'}
              className="flex-1 px-3 py-1.5 text-sm rounded text-gray-800 focus:outline-none"
              required
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 bg-white text-primary text-sm font-semibold rounded hover:bg-gray-100 disabled:opacity-60"
            >
              {submitting ? '…' : lang === 'bn' ? 'সাবস্ক্রাইব' : 'Subscribe'}
            </button>
          </form>
        )}
        {error ? <p className="mt-2 text-xs text-red-100">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark text-white rounded-xl p-8 text-center">
      <h3 className={`text-2xl font-bold mb-2 ${lang === 'bn' ? 'font-bangla' : ''}`}>
        {lang === 'bn' ? 'নিউজলেটার সাবস্ক্রাইব করুন' : 'Subscribe to Newsletter'}
      </h3>
      <p className={`text-red-100 mb-6 ${lang === 'bn' ? 'font-bangla' : ''}`}>
        {lang === 'bn'
          ? 'সর্বশেষ সংবাদ সরাসরি আপনার ইনবক্সে পান'
          : 'Get the latest news directly to your inbox'}
      </p>
      {subscribed ? (
        <div className="bg-white/20 rounded-lg p-4">
          <p className={`font-semibold text-lg ${lang === 'bn' ? 'font-bangla' : ''}`}>
            {lang === 'bn' ? '✓ ধন্যবাদ! সাবস্ক্রাইব হয়েছে।' : '✓ Thank you! You are subscribed.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === 'bn' ? 'আপনার ইমেইল লিখুন' : 'Enter your email'}
            className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            required
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-white text-primary font-bold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            {submitting ? '…' : lang === 'bn' ? 'সাবস্ক্রাইব করুন' : 'Subscribe'}
          </button>
        </form>
      )}
      {error ? <p className="mt-3 text-sm text-red-100">{error}</p> : null}
    </div>
  );
}
