'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { Icon } from './icons';

/* Success feedback after every action: a small toast at the bottom centre that dismisses itself after 3 s. */

interface Toast {
  id: number;
  message: string;
}

let queue: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string) {
  const item = { id: nextId++, message };
  // One at a time: a new message replaces the current one.
  queue = [item];
  emit();
  window.setTimeout(() => {
    queue = queue.filter((t) => t.id !== item.id);
    emit();
  }, 3000);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function Toaster() {
  const items = useSyncExternalStore(
    subscribe,
    () => queue,
    () => queue,
  );
  const current = items[items.length - 1];
  return (
    <div role="status" aria-live="polite" className="no-print">
      {current ? (
        <div
          key={current.id}
          className="fixed bottom-7 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 animate-toast items-center gap-2.5 rounded-xl bg-ink-strong px-[18px] py-[13px] text-sm text-white shadow-[0_16px_40px_rgba(42,21,41,0.3)]"
        >
          <Icon name="check" size={16} strokeWidth={2.4} color="var(--color-accent-on-dark)" />
          {current.message}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Shows a toast once when a page opens after a redirect (e.g. `?saved=1`), then removes the flag from the URL
 * so a reload doesn't repeat it.
 */
export function ToastOnLoad({ message, removeParams = [] }: { message: string; removeParams?: string[] }) {
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast(message);
    if (removeParams.length) {
      const url = new URL(window.location.href);
      removeParams.forEach((p) => url.searchParams.delete(p));
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [message, removeParams]);
  return null;
}
