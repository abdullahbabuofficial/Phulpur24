'use client';

import { useEffect } from 'react';
import { views } from '@/lib/supabase';

interface Props {
  articleId?: string | null;
  path: string;
  lang?: 'bn' | 'en';
}

/**
 * Tiny beacon that records a page view once per mount and bumps the
 * articles.views counter. Renders nothing.
 */
export default function ViewBeacon({ articleId, path, lang }: Props) {
  useEffect(() => {
    let cancelled = false;
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    void views
      .recordView({ articleId, path, lang, referrer })
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, path, lang]);

  return null;
}
