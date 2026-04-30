'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[public error boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black text-primary mb-3">500</div>
        <h1 className="text-2xl font-bold text-brand-text mb-3">Something went wrong</h1>
        <p className="text-brand-muted mb-6">
          We hit an error loading this page. The team has been notified — please try again in a moment.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Try again
          </button>
          <Link
            href="/bn"
            className="px-5 py-2.5 border border-brand-border rounded-lg font-medium hover:bg-brand-soft transition-colors"
          >
            Go home
          </Link>
        </div>
        {error.digest ? <p className="mt-6 text-[11px] text-brand-muted">Reference: {error.digest}</p> : null}
      </div>
    </div>
  );
}
