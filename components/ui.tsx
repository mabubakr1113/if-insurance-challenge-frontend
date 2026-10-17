import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';
import { backLink, button, card, eyebrow, h1, intro as introClass, listBox, type ButtonSize, type ButtonVariant } from './styles';

/* Layout primitives from the design system. No hooks, so they work in server and client components. */

export type Tone = 'neutral' | 'accent' | 'attention' | 'high' | 'ok' | 'concern' | 'category' | 'role';

export const TONE: Record<Tone, string> = {
  neutral: 'bg-neutral text-muted',
  accent: 'bg-accent-soft text-ink',
  attention: 'bg-attention-soft text-attention',
  high: 'bg-high-soft text-high',
  ok: 'bg-ok-soft text-ok',
  concern: 'bg-concern-soft text-concern',
  category: 'bg-chip text-muted',
  role: 'bg-chip text-ink',
};

/** "Aino Lindqvist" → "AL" */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/* ---------------- brand ---------------- */

/** Text-only wordmark: "If Home Watch." No If logo or brand assets. */
export function Wordmark({ href = '/' }: { href?: string | null }) {
  const mark = (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="font-display text-[22px] font-medium tracking-[-0.02em] whitespace-nowrap text-ink">
        If Home Watch<span className="text-accent">.</span>
      </span>
    </span>
  );
  if (!href) return mark;
  return (
    <Link href={href} className="rounded-md hover:text-ink">
      {mark}
    </Link>
  );
}

/* ---------------- motion ---------------- */

/** 14px pending spinner. `light` on dark buttons, `dark` on secondary buttons. */
export function Spinner({ tone = 'light', size = 14 }: { tone?: 'light' | 'dark' | 'sim'; size?: 12 | 14 }) {
  const ring =
    tone === 'light' ? 'border-white/35 border-t-white' : tone === 'sim' ? 'border-[#f0d9b5] border-t-attention-ink' : 'border-line-input border-t-ink';
  return <span aria-hidden="true" className={`inline-block shrink-0 animate-spin-fast rounded-full border-2 ${ring} ${size === 12 ? 'size-3' : 'size-3.5'}`} />;
}

/* ---------------- page structure ---------------- */

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={backLink}>
      <Icon name="back" size={16} strokeWidth={2} />
      {children}
    </Link>
  );
}

/** Title block on the left (optional back link, eyebrow, H1, one muted line) and the single primary action on the right. */
export function PageHeader({
  title,
  intro,
  eyebrow: over,
  back,
  actions,
  className = '',
}: {
  title: ReactNode;
  intro?: ReactNode;
  eyebrow?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-[18px] ${className}`}>
      {back ? <BackLink href={back.href}>{back.label}</BackLink> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-[620px] min-w-0 flex-col gap-2">
          {over ? <span className="text-sm text-muted">{over}</span> : null}
          <h1 className={h1}>{title}</h1>
          {intro ? <div className={introClass}>{intro}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Eyebrow({ children, as: As = 'span', id, className = '' }: { children: ReactNode; as?: 'span' | 'h2' | 'h3' | 'p'; id?: string; className?: string }) {
  return (
    <As id={id} className={`${eyebrow} ${className}`}>
      {children}
    </As>
  );
}

/**
 * A card: warm white, 1px border, 16px radius, no shadow.
 * `rail` (18×20 padding, 14px title) sits beside content; `section` (22px padding, 16px title) holds a page section.
 */
export function Card({
  title,
  action,
  children,
  className = '',
  id,
  size = 'rail',
  as: As = 'section',
  'aria-live': ariaLive,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
  size?: 'rail' | 'section';
  as?: 'section' | 'div' | 'article' | 'aside';
  'aria-live'?: 'polite';
}) {
  const pad = size === 'rail' ? 'px-5 py-[18px]' : 'p-[22px]';
  // A gap passed in `className` replaces the default one (two gap utilities would fight).
  const gap = /(^|\s)gap-/.test(className) ? '' : 'gap-3';
  return (
    <As id={id} aria-live={ariaLive} className={`${card} flex flex-col ${pad} ${gap} ${className}`}>
      {title || action ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title ? <h2 className={size === 'rail' ? 'text-sm font-semibold' : 'text-base font-semibold'}>{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </As>
  );
}

/** A list container: card styling, no padding, rows separated by soft dividers. Preferred over nested cards. */
export function ListBox({ children, className = '', as: As = 'div', 'aria-label': ariaLabel }: { children: ReactNode; className?: string; as?: 'div' | 'ul' | 'ol'; 'aria-label'?: string }) {
  return (
    <As aria-label={ariaLabel} className={`${listBox} ${className}`}>
      {children}
    </As>
  );
}

/* ---------------- small parts ---------------- */

const BADGE_SIZE = {
  sm: 'px-2 py-0.5 text-[11px]',
  /** Checklist results in a visit report. */
  row: 'px-2.5 py-0.5 text-xs',
  md: 'px-2.5 py-[3px] text-xs',
  lg: 'px-3 py-1 text-xs',
};

export function Badge({ tone = 'neutral', size = 'sm', children, className = '' }: { tone?: Tone; size?: keyof typeof BADGE_SIZE; children: ReactNode; className?: string }) {
  const s = BADGE_SIZE[size];
  return <span className={`inline-flex shrink-0 items-center rounded-full font-bold whitespace-nowrap ${s} ${TONE[tone]} ${className}`}>{children}</span>;
}

/** A small, always-visible label for anything simulated or fictional (FRONTEND.md 5.5). */
export function SimLabel({ children }: { children: ReactNode }) {
  return <span className="inline-flex shrink-0 items-center rounded-full bg-attention-soft px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-attention">{children}</span>;
}

type NoticeTone = 'info' | 'neutral' | 'success' | 'warning';

const NOTICE: Record<NoticeTone, string> = {
  info: 'bg-accent-soft text-ink',
  neutral: 'bg-neutral text-ink',
  success: 'bg-ok-soft text-ok-strong',
  warning: 'bg-attention-soft text-attention-ink',
};

export function Notice({
  tone = 'neutral',
  title,
  children,
  action,
  role,
  className = '',
}: {
  tone?: NoticeTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert';
  className?: string;
}) {
  return (
    <div role={role} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl px-[18px] py-3.5 text-sm leading-[1.55] ${NOTICE[tone]} ${className}`}>
      <div className="min-w-0 flex-[1_1_260px]">
        {title ? <strong className="font-bold">{title}</strong> : null}
        {title && children ? ' ' : null}
        {children}
      </div>
      {action}
    </div>
  );
}

/** Dashed empty state: Newsreader title, one muted line and an optional action. */
export function Empty({
  title,
  children,
  action,
  tall = false,
  className = '',
}: {
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** 56px of padding instead of 48px: the empty care plan and visits pages. */
  tall?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-input px-6 text-center ${tall ? 'py-14' : 'py-12'} ${className}`}>
      {title ? <p className="font-display text-2xl">{title}</p> : null}
      {children ? <div className="max-w-[440px] text-sm text-muted">{children}</div> : null}
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  );
}

export type DotTone = 'overdue' | 'urgent' | 'high' | 'normal' | 'done';

const DOT: Record<DotTone, string> = {
  overdue: 'bg-accent-text',
  urgent: 'bg-attention-dot',
  high: 'bg-accent',
  normal: 'bg-dot-normal',
  done: 'bg-ok',
};

export function StatusDot({ tone, className = '' }: { tone: DotTone; className?: string }) {
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${DOT[tone]} ${className}`} />;
}

/** Initials on plum-soft. Invited members use the neutral tint. */
export function Avatar({
  name,
  size = 28,
  invited = false,
  square = false,
  label,
}: {
  name: string;
  size?: 24 | 28 | 30 | 34 | 40 | 44;
  invited?: boolean;
  square?: boolean;
  label?: string;
}) {
  const dims: Record<number, string> = {
    24: 'size-6 text-[11px]',
    28: 'size-7 text-[11px]',
    30: 'size-[30px] text-xs',
    34: 'size-[34px] text-xs',
    40: 'size-10 text-[13px]',
    44: 'size-11 text-sm',
  };
  const shape = square ? (size >= 40 ? 'rounded-xl' : 'rounded-lg') : 'rounded-full';
  return (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center font-bold text-ink ${dims[size]} ${shape} ${invited ? 'bg-neutral' : 'bg-accent-soft'}`}>
      {label ?? initials(name)}
    </span>
  );
}

/** A big number tile: Newsreader value, 13px label, optional 12px hint. */
export function Stat({ label, value, hint, tone = 'card' }: { label: ReactNode; value: ReactNode; hint?: ReactNode; tone?: 'card' | 'ok' | 'concern' }) {
  const box = tone === 'ok' ? 'bg-ok-soft' : tone === 'concern' ? 'bg-concern-soft' : 'border border-line bg-card';
  return (
    <div className={`flex flex-col gap-1.5 rounded-[14px] p-[18px] ${box}`}>
      <dt className="order-2 text-[13px] leading-[1.4]">{label}</dt>
      <dd className="order-1 font-display text-[34px] leading-none tabular-nums">{value}</dd>
      {hint ? <dd className="order-3 text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

/** Label/value facts. `stack` puts the label above (rails); `grid` puts it beside (cards). Empty values say "Not answered". */
export function Facts({ items, layout = 'grid', className = '' }: { items: [ReactNode, ReactNode][]; layout?: 'stack' | 'grid'; className?: string }) {
  const empty = (v: ReactNode) => v === null || v === undefined || v === '';
  if (layout === 'stack') {
    return (
      <dl className={`flex flex-col gap-2.5 ${className}`}>
        {items.map(([k, v], i) => (
          <div key={i} className="flex flex-col gap-0.5 text-[13px]">
            <dt className="text-muted">{k}</dt>
            <dd className="leading-[1.45]">{empty(v) ? <span className="text-muted">Not answered</span> : v}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className={`flex flex-col gap-2 ${className}`}>
      {items.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[minmax(100px,150px)_minmax(0,1fr)] gap-3 py-1 text-sm">
          <dt className="text-muted">{k}</dt>
          <dd>{empty(v) ? <span className="text-muted">Not answered</span> : v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Segmented control as links: active item has a white background and a soft shadow; each ends with its count. */
export function Segmented({ label, items }: { label: string; items: { href: string; label: string; count?: number; active: boolean }[] }) {
  return (
    <nav aria-label={label} className="flex max-w-full flex-wrap gap-0.5 self-start rounded-xl bg-segment p-1">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          scroll={false}
          aria-current={it.active ? 'page' : undefined}
          className={`flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold ${
            it.active ? 'bg-white text-ink shadow-[0_1px_3px_rgba(59,31,58,0.12)]' : 'text-muted hover:text-ink'
          }`}
        >
          {it.label}
          {it.count !== undefined ? <span className="font-medium text-faint">{it.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  scroll,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <Link href={href} scroll={scroll} className={button(variant, size, className)}>
      {icon ? <Icon name={icon} size={16} strokeWidth={2} /> : null}
      {children}
    </Link>
  );
}

/** "Care plan →" */
export function ArrowLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`text-[13px] font-semibold text-muted hover:text-ink ${className}`}>
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

/* ---------------- loading ---------------- */

const pulse = 'animate-pulse-soft';

/** The shared loading skeleton for every route segment. */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className={`h-3.5 w-[140px] rounded-md bg-skeleton ${pulse}`} />
        <div className={`h-9 w-[360px] max-w-[80%] rounded-lg bg-skeleton ${pulse}`} />
        <div className={`h-4 w-[480px] max-w-[90%] rounded-md bg-skeleton-mid ${pulse}`} />
      </div>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-[200px] rounded-2xl bg-skeleton-soft ${pulse}`} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-[72px] rounded-xl bg-skeleton-soft ${pulse}`} />
        ))}
      </div>
    </div>
  );
}
