import Link from 'next/link';
import type { ReactNode } from 'react';
import { actorLabel, getMe } from '@/lib/guards';
import { StartDemoLink } from './start-demo-link';
import { ButtonLink, Wordmark } from './ui';

/** Header, content and footer for pages outside the app: landing, demo hub, invitation, join, errors. */
export async function PublicShell({ children, width = 'wide' }: { children: ReactNode; width?: 'wide' | 'narrow' }) {
  // The header never takes the page down: if the backend is unreachable the page itself says so.
  const me = await getMe().catch(() => null);
  const who = me ? actorLabel(me) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print border-b border-line">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-[18px] py-4 wide:px-12">
          <Wordmark />
          {who ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">
                Viewing as <span className="font-semibold text-ink">{who.name}</span> · {who.role}
              </span>
              <ButtonLink href="/demo" variant="secondary" size="sm">
                Switch person
              </ButtonLink>
              <ButtonLink href={who.home} size="sm">
                Open
              </ButtonLink>
            </div>
          ) : (
            <StartDemoLink small />
          )}
        </div>
      </header>
      <main id="main" className={`mx-auto w-full flex-1 px-[18px] pt-8 pb-[88px] wide:px-12 wide:pt-10 ${width === 'narrow' ? 'max-w-[760px]' : 'max-w-[1100px]'}`}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-3 px-[18px] py-8 text-[13px] text-muted wide:flex-row wide:justify-between wide:px-12">
        <p className="max-w-2xl">
          Hackathon prototype for the If challenge “If Insurance Could Do More”, JunctionX Turku 2026. Fictional people, homes and partner. Messages and
          bookings are simulated. Not an If service.
        </p>
        <nav aria-label="Footer" className="flex gap-4 font-semibold">
          <Link href="/demo" className="hover:text-ink">
            Demo
          </Link>
        </nav>
      </div>
    </footer>
  );
}
