'use client';

import { ErrorState } from '@/components/error-state';

export default function ErrorBoundary({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} />;
}
