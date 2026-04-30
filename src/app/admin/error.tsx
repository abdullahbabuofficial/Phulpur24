'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[admin error boundary]', error);
  }, [error]);

  return (
    <div className="admin-scope min-h-screen bg-app flex items-center justify-center px-4">
      <div className="ui-card max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger text-xl">
          !
        </div>
        <h1 className="text-xl font-semibold text-ink mb-2">Admin error</h1>
        <p className="text-sm text-ink-muted mb-5">
          {error.message || 'Something went wrong while loading this admin page.'}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={reset} className="ui-btn ui-btn-primary">
            Retry
          </button>
          <Link href="/admin/dashboard" className="ui-btn ui-btn-secondary">
            Dashboard
          </Link>
          <Link href="/admin/diagnostic" className="ui-btn ui-btn-ghost">
            Run diagnostics
          </Link>
        </div>
        {error.digest ? <p className="mt-5 text-[11px] text-ink-faint">Ref: {error.digest}</p> : null}
      </div>
    </div>
  );
}
