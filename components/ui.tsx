import Link from 'next/link';
import type { ReactNode } from 'react';
import { btn, btnSecondary, link } from './styles';

/* Small layout primitives. No hooks, so they work in server and client components. */

type Tone = 'neutral' | 'accent' | 'attention' | 'ok' | 'concern';

const TONE: Record<Tone, string> = {
  neutral: 'bg-soft text-ink',
  accent: 'bg-accent-soft text-accent-strong',
  attention: 'bg-attention-soft text-attention',
  ok: 'bg-ok-soft text-ok',
  concern: 'bg-concern-soft text-concern',
};

export function PageHeader({ title, intro, children }: { title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {intro ? <div className="mt-2 text-muted">{intro}</div> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = '',
  id,
  as: As = 'section',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
}) {
  return (
    <As id={id} className={`rounded-2xl border border-line bg-card p-5 shadow-xs ${className}`}>
      {title || action ? (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </As>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[tone]}`}>{children}</span>;
}

export function Notice({ tone = 'neutral', title, children, role }: { tone?: Tone; title?: ReactNode; children?: ReactNode; role?: 'status' | 'alert' }) {
  return (
    <div role={role} className={`rounded-xl px-4 py-3 text-sm ${TONE[tone]}`}>
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? 'mt-1' : ''}>{children}</div> : null}
    </div>
  );
}

/** A small, always-visible label for anything simulated (5.5). */
export function SimLabel({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-md border border-dashed border-muted/50 px-1.5 py-0.5 text-xs text-muted">{children}</span>;
}

export function ButtonLink({ href, children, variant = 'primary', className = '' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary'; className?: string }) {
  return (
    <Link href={href} className={`${variant === 'primary' ? btn : btnSecondary} ${className}`}>
      {children}
    </Link>
  );
}

export function TextLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${link} ${className}`}>
      {children}
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-muted">{children}</p>;
}

export function Stat({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl bg-soft px-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint ? <dd className="mt-0.5 text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

/** Label/value rows. Empty values show "Not answered". */
export function Facts({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([label, value], i) => (
        <div key={i} className="grid gap-1 py-2 sm:grid-cols-[14rem_1fr] sm:gap-4">
          <dt className="text-sm text-muted">{label}</dt>
          <dd>{value === null || value === undefined || value === '' ? <span className="text-muted">Not answered</span> : value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Muted({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-muted ${className}`}>{children}</p>;
}
