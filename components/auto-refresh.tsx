'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Re-renders the page from the server every few seconds, so a second screen sees changes (5.3).
 * Pauses while the tab is hidden or a form on the page has unsaved input.
 */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const markDirty = (event: Event) => {
      const form = (event.target as HTMLElement | null)?.closest?.('form');
      if (form && !form.hasAttribute('data-no-dirty')) form.setAttribute('data-dirty', 'true');
    };
    const markClean = (event: Event) => (event.target as HTMLElement | null)?.removeAttribute?.('data-dirty');

    document.addEventListener('input', markDirty, true);
    document.addEventListener('submit', markClean, true);
    document.addEventListener('reset', markClean, true);

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (document.querySelector('form[data-dirty="true"]')) return;
      router.refresh();
    }, seconds * 1000);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('input', markDirty, true);
      document.removeEventListener('submit', markClean, true);
      document.removeEventListener('reset', markClean, true);
    };
  }, [router, seconds]);

  return null;
}
