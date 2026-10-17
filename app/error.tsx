'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { btn, btnSecondary } from '@/components/styles';
import { BACKEND_UNREACHABLE, UNREACHABLE_MESSAGE } from '@/lib/errors';

export default function ErrorBoundary({ error, retry }: { error: unknown; retry: () => void }) {
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  const unreachable = digest === BACKEND_UNREACHABLE;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-2xl font-semibold">{unreachable ? 'The service isn’t responding' : 'Something went wrong.'}</h1>
      <p className="mt-2 text-muted">{unreachable ? UNREACHABLE_MESSAGE : 'Please try again. If it keeps happening, reset the demo.'}</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" className={btn} onClick={() => retry()}>
          Try again
        </button>
        <Link href="/demo" className={btnSecondary}>
          Demo
        </Link>
      </div>
    </div>
  );
}
