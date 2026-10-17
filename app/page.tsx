/* eslint-disable @next/next/no-img-element -- one static hero photo */
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui';
import { api } from '@/lib/api';
import type { ActorGrant, MeResponse } from '@/lib/contract';

/*
 * The insurer's homepage, where Home Watch appears as a new service (design: Insurer Landing v2).
 * The brand is plain text with no logo or brand assets. Only the Home Watch links go anywhere:
 * the rest of the insurer's site isn't part of this prototype.
 */

// 1280px of content plus the 40px gutters (the design's container is content-box).
const wrap = 'mx-auto w-full max-w-[1360px] px-5 wide:px-10';

/** A full navigation, so prefetching can't set the demo-person cookie. */
const HOME_WATCH = '/demo/start';

function Svg({ size = 28, stroke = 'currentColor', width = 1.4, children }: { size?: number; stroke?: string; width?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={width} aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

const PRODUCTS: { label: string; icon: ReactNode }[] = [
  {
    label: 'Car',
    icon: (
      <>
        <path d="M3 15v-3l2-5h14l2 5v3H3z" />
        <circle cx="7" cy="16" r="2" />
        <circle cx="17" cy="16" r="2" />
      </>
    ),
  },
  {
    label: 'Home',
    icon: (
      <>
        <path d="M3 11l9-7 9 7v9H3z" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
  },
  {
    label: 'Travel',
    icon: (
      <>
        <rect x="4" y="7" width="16" height="13" rx="2" />
        <path d="M9 7V4h6v3" />
      </>
    ),
  },
  {
    label: 'Person',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
      </>
    ),
  },
  {
    label: 'Pet',
    icon: (
      <>
        <circle cx="8" cy="7" r="2" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="5" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
        <path d="M8 19c0-3 2-5 4-5s4 2 4 5z" />
      </>
    ),
  },
];

const HELP = ['My pages', 'Customer service', 'Report a claim'];

const FOOTER: { title: string; links: string[] }[] = [
  { title: 'Insurance', links: ['Car insurance', 'Home insurance', 'Travel insurance', 'Personal insurance', 'All insurance', 'Terms and conditions'] },
  { title: 'Claims', links: ['Report a claim', 'Vehicle damage', 'Property damage', 'Personal injury', 'Travel damage', 'Appeals'] },
  { title: 'Services', links: ['My pages', 'Contact us', 'Frequently asked questions', 'E-invoice'] },
  { title: 'About us', links: ['About If', 'Sustainability', 'Careers', 'Newsroom'] },
];

const Arrow = ({ size = 18 }: { size?: number }) => (
  <Svg size={size} width={1.6}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

const Brand = ({ className }: { className: string }) => (
  <span className={`font-display font-medium tracking-[-0.02em] ${className}`}>
    If<span className="text-accent">.</span>
  </span>
);

const New = ({ className }: { className: string }) => <span className={`rounded-full bg-accent font-semibold text-ink-strong ${className}`}>New</span>;

/** Who the Home Watch tile signs in as, so the header shows the same person as logged in. Null if the service is down. */
async function demoUser(): Promise<string | null> {
  try {
    const grant = await api<ActorGrant>('/api/demo/entry', { actor: null });
    const me = await api<MeResponse>('/api/me', { actor: grant.actor });
    return me.kind === 'member' ? me.member.name : null;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const user = await demoUser();
  return (
    <div className="flex min-h-screen flex-col bg-landing text-ink">
      <div className="bg-ink text-sm text-landing">
        <div className={`${wrap} flex flex-wrap items-stretch justify-between gap-4`}>
          <div className="flex gap-1">
            <span className="mr-6 border-b-2 border-accent py-3 font-semibold text-white">Private</span>
            <span className="py-3 text-on-dark">Business</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-on-dark">EN</span>
            {user ? (
              <a href={HOME_WATCH} className="flex items-center gap-2 font-medium text-white hover:underline">
                <Avatar name={user} size={24} />
                {user}
              </a>
            ) : (
              <span className="font-medium text-white">Log in</span>
            )}
          </div>
        </div>
      </div>

      <header className="border-b border-landing-line">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-6 py-6`}>
          <div className="flex flex-wrap items-baseline gap-12">
            <Brand className="text-[30px]" />
            <div className="flex gap-8 text-base font-medium">
              <span>Insurance</span>
              <span>Claims</span>
              <span>Help</span>
            </div>
          </div>
          <span className="flex items-center gap-2 text-base font-medium">
            <Svg size={18} width={1.6}>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </Svg>
            Search
          </span>
        </div>
      </header>

      <main id="main">
        <section className={`${wrap} grid items-center gap-[72px] pt-20 pb-24 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]`}>
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-5">
              <h1 className="font-display text-[68px] leading-[1.02] font-normal tracking-[-0.03em] text-balance">
                Cover for the moments that <em className="text-accent-text">change things</em>
              </h1>
              <p className="max-w-[520px] text-[19px] leading-[1.55] text-muted">
                Moving, buying a car, losing someone close. We help you prepare for what life brings, and we’re here when something happens.
              </p>
            </div>

            <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
              {PRODUCTS.map((p) => (
                <span key={p.label} className="flex flex-col gap-[18px] rounded-[14px] border border-landing-line bg-landing-tile p-5 text-[17px] font-medium">
                  <Svg stroke="var(--color-accent-text)">{p.icon}</Svg>
                  {p.label}
                </span>
              ))}
              <a
                href={HOME_WATCH}
                className="relative flex flex-col gap-[18px] rounded-[14px] border border-ink bg-ink p-5 text-[17px] font-medium text-white hover:bg-ink-strong"
              >
                <Svg stroke="var(--color-accent-on-dark)">
                  <path d="M3 11l9-7 9 7v9H3z" />
                  <path d="M9 14l2 2 4-4" />
                </Svg>
                Home Watch
                <New className="absolute top-3.5 right-3.5 px-[9px] py-[3px] text-xs" />
              </a>
            </div>

            <span className="self-start text-[17px] font-semibold underline decoration-accent decoration-2 underline-offset-[5px]">All insurance</span>
          </div>

          <div className="aspect-[4/5] max-h-[640px] w-full overflow-hidden rounded-[200px] bg-line-soft">
            <img src="/landing-hero.jpg" alt="" className="size-full object-cover" />
          </div>
        </section>

        <section aria-labelledby="help" className="bg-landing-band">
          <div className={`${wrap} flex flex-col gap-7 pt-16 pb-[88px]`}>
            <h2 id="help" className="font-display text-[36px] font-normal tracking-[-0.02em]">
              How can we help?
            </h2>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
              {HELP.map((h) => (
                <span key={h} className="flex items-center justify-between gap-4 rounded-[14px] bg-landing-tile px-7 py-[26px] text-lg font-medium">
                  {h}
                  <Arrow />
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-landing">
        <div className={`${wrap} flex flex-col gap-14 pt-[72px] pb-14`}>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <Brand className="text-[34px] text-white" />
            <p className="font-display text-[22px] text-on-dark italic">Here for the moments that change things.</p>
          </div>
          <div className="grid gap-x-8 gap-y-10 text-base [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
            {FOOTER.map((col) => (
              <div key={col.title} className="flex flex-col gap-3.5">
                <h3 className="mb-1.5 text-[13px] font-semibold tracking-[0.08em] text-accent-on-dark uppercase">{col.title}</h3>
                {col.title === 'Services' ? (
                  <a href={HOME_WATCH} className="flex items-center gap-2 font-semibold text-white hover:underline">
                    Home Watch
                    <New className="px-2 py-0.5 text-[11px]" />
                  </a>
                ) : null}
                {col.links.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-5 border-t border-on-dark-line pt-7 text-sm text-on-dark">
            <div className="flex flex-wrap gap-7">
              <span>Terms of use</span>
              <span>Privacy</span>
              <span>Cookies</span>
              <span>Accessibility</span>
            </div>
            <span>Hackathon prototype · Not an If service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
