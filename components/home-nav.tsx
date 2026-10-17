'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavItem {
  href: string;
  label: string;
  badge?: number;
  badgeLabel?: string;
  /** Other path prefixes that belong to this item, e.g. task pages under Plan. */
  also?: string[];
}

/** The home navigation (6.3). Scrolls sideways on narrow screens. */
export function HomeNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const overview = items[0]?.href;
  return (
    <nav aria-label="Home" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {items.map((item) => {
          const active = item.href === overview ? pathname === item.href : [item.href, ...(item.also ?? [])].some((p) => pathname.startsWith(p));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${active ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}
              >
                {item.label}
                {item.badge ? (
                  <span className="rounded-full bg-attention-soft px-1.5 text-xs font-semibold text-attention">
                    {item.badge}
                    <span className="sr-only"> {item.badgeLabel}</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
