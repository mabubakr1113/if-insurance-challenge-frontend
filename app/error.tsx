'use client';

import { ErrorState } from '@/components/error-state';
import { Wordmark } from '@/components/ui';

/** Outside the app frames (landing, demo, invitation): a minimal header and the shared error block. */
export default function ErrorBoundary({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line px-[18px] py-4 wide:px-12">
        <Wordmark />
      </header>
      <main id="main" className="px-[18px]">
        <ErrorState error={error} retry={retry} />
      </main>
    </div>
  );
}
