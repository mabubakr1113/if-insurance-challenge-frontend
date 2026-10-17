'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { BACKEND_UNREACHABLE } from '@/lib/errors';
import { Icon } from './icons';
import { button } from './styles';
import { Spinner } from './ui';

const TITLES: [RegExp, string][] = [
  [/\/plan$/, 'We couldn’t load the care plan'],
  [/\/tasks\//, 'We couldn’t load this task'],
  [/\/visits\/new$/, 'We couldn’t open the visit form'],
  [/\/visits/, 'We couldn’t load the visits'],
  [/\/notes/, 'We couldn’t load the house notes'],
  [/\/weather$/, 'We couldn’t load the weather'],
  [/\/help\/[^/]+$/, 'We couldn’t load this visit'],
  [/\/help$/, 'We couldn’t load local visits'],
  [/\/family$/, 'We couldn’t load the family'],
  [/\/record$/, 'We couldn’t load the home record'],
  [/\/settings$/, 'We couldn’t load the settings'],
  [/^\/notifications/, 'We couldn’t load your messages'],
  [/^\/partner/, 'We couldn’t load the visit requests'],
  [/^\/insights/, 'We couldn’t load the pilot dashboard'],
  [/^\/setup\//, 'We couldn’t load the setup'],
  [/^\/homes\/[^/]+$/, 'We couldn’t load the overview'],
];

/** The error block shared by every error.tsx: page-specific title, a calm body and "Try again". */
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
  const unreachable = digest === BACKEND_UNREACHABLE;
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Something went wrong';

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto my-12 flex max-w-[520px] flex-col items-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-concern-soft text-concern">
        <Icon name="warning" size={26} strokeWidth={1.8} />
      </span>
      <h1 className="font-display text-[32px] font-normal tracking-[-0.02em]">{title}</h1>
      <p className="text-base leading-[1.55] text-muted">
        {unreachable
          ? 'The Home Watch service didn’t respond. Nothing you entered was lost. Try again in a moment. If you’re running locally, start the backend on port 3001.'
          : 'The Home Watch service didn’t respond. Nothing you entered was lost. Try again in a moment.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2.5">
        <button type="button" className={button('primary', 'md', 'px-[18px]')} disabled={pending} onClick={() => startTransition(() => retry())}>
          {pending ? <Spinner /> : null}
          Try again
        </button>
      </div>
      <p className="text-xs text-muted">Error code {unreachable ? 'HW-503' : digest ? `HW-${digest.slice(0, 8)}` : 'HW-500'}</p>
    </div>
  );
}
