'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { demoMenu, resetDemo, viewAs, type DemoMenu } from '@/app/actions/demo';
import { ActionForm, ConfirmSubmit } from './forms';
import { Icon, type IconName } from './icons';
import { initials, Spinner, Wordmark } from './ui';

/*
 * The app frame (README "App shell"). From 720px: a sticky 256px sidebar with the home card, grouped
 * navigation and the persona button. Below 720px: a sticky top bar with a menu drawer.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
  badgeTone?: 'attention' | 'high';
  badgeLabel?: string;
  /** Match only this exact path (the overview). */
  exact?: boolean;
  /** Other path prefixes that belong to this item, e.g. task pages under the care plan. */
  also?: string[];
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface HomeCard {
  title: string;
  line: string;
  active: boolean;
}

export interface Persona {
  name: string;
  role: string;
}

export function ShellFrame({ home, groups, persona, children }: { home?: HomeCard; groups: NavGroup[]; persona: Persona; children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (navOpen) setNavOpen(false);
  }

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  return (
    <div className="flex min-h-screen items-stretch">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-sidebar-line bg-sidebar px-3.5 pt-[22px] pb-3.5 wide:flex">
        <div className="px-2.5">
          <Wordmark />
        </div>
        {home ? <HomeCardView home={home} /> : null}
        <SideNav groups={groups} pathname={pathname} />
        <div className="flex-1" />
        <PersonaButton persona={persona} placement="sidebar" />
      </aside>

      {navOpen ? (
        <div className="no-print fixed inset-0 z-[45] bg-[rgba(42,21,41,0.38)] wide:hidden" onMouseDown={(e) => e.target === e.currentTarget && setNavOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="flex h-full w-[280px] max-w-[86vw] flex-col gap-[22px] overflow-y-auto bg-sidebar px-3.5 py-[22px]"
          >
            <div className="flex items-center justify-between px-2.5">
              <Wordmark />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setNavOpen(false)}
                className="flex size-[34px] cursor-pointer items-center justify-center rounded-lg text-ink hover:bg-hover-btn"
              >
                <Icon name="close" size={18} strokeWidth={2} />
              </button>
            </div>
            {home ? <HomeCardView home={home} /> : null}
            <SideNav groups={groups} pathname={pathname} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-[rgba(250,246,243,0.94)] px-4 py-2.5 backdrop-blur-md wide:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
              className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-line-input bg-card text-ink"
            >
              <Icon name="menu" size={18} strokeWidth={2} />
            </button>
            <span className="hidden min-[400px]:block">
              <Wordmark />
            </span>
          </div>
          <PersonaButton persona={persona} placement="topbar" />
        </header>
        <main id="main" className="mx-auto w-full max-w-[1100px] flex-1 px-[18px] pt-[22px] pb-[88px] wide:px-12 wide:pt-10 wide:pb-24">
          {children}
        </main>
      </div>
    </div>
  );
}

function HomeCardView({ home }: { home: HomeCard }) {
  return (
    <div className="flex flex-col gap-[3px] rounded-xl border border-sidebar-line bg-card px-3.5 py-3">
      <span className="flex items-center gap-[7px] text-sm font-semibold">
        <span aria-hidden="true" className={`size-[7px] shrink-0 rounded-full ${home.active ? 'bg-ok' : 'bg-dot-normal'}`} />
        {home.title}
      </span>
      <span className="text-xs text-muted">{home.line}</span>
    </div>
  );
}

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href;
  return [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`));
}

function SideNav({ groups, pathname }: { groups: NavGroup[]; pathname: string }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-[18px]">
      {groups.map((g, gi) => (
        <div key={g.title ?? gi} className="flex flex-col gap-0.5">
          {g.title ? <span className="px-2.5 pb-1.5 text-[11px] font-bold tracking-[0.08em] text-faint uppercase">{g.title}</span> : null}
          {g.items.map((item) => {
            const active = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-[38px] items-center gap-[11px] rounded-[9px] px-2.5 text-sm hover:text-ink ${
                  active ? 'bg-card font-semibold text-ink shadow-[0_1px_2px_rgba(59,31,58,0.08),0_0_0_1px_#eadcd3]' : 'font-medium text-nav'
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                      item.badgeTone === 'high' ? 'bg-high-soft text-high' : 'bg-attention-soft text-attention'
                    }`}
                  >
                    {item.badge}
                    {item.badgeLabel ? <span className="sr-only"> {item.badgeLabel}</span> : null}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** "Viewing as …": opens the demo's "View the demo as" menu. */
function PersonaButton({ persona, placement }: { persona: Persona; placement: 'sidebar' | 'topbar' }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<DemoMenu | null | undefined>(undefined);
  const [picking, setPicking] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    if (menu === undefined) demoMenu().then(setMenu, () => setMenu(null));
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Clicks inside a confirmation dialog opened from the menu don't close it.
      if (box.current?.contains(target) || (target as Element).closest?.('[role=alertdialog]')) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[role=alertdialog]')) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, menu]);

  const pick = (actor: string, landing: string) => {
    setPicking(actor);
    startTransition(async () => {
      await viewAs(actor, landing, null);
    });
  };

  const sidebar = placement === 'sidebar';
  const item = 'flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-ink hover:bg-hover-btn';

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Viewing as ${persona.name}, ${persona.role}. Switch person`}
        onClick={() => setOpen((o) => !o)}
        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border border-line-input bg-card text-left text-ink hover:bg-hover ${
          sidebar ? 'h-[52px] w-full pr-2.5 pl-2' : 'h-10 max-w-[56vw] pr-2.5 pl-[5px]'
        }`}
      >
        <span className={`flex shrink-0 items-center justify-center rounded-[9px] bg-ink text-xs font-bold text-white ${sidebar ? 'size-[34px]' : 'size-[30px]'}`}>
          {initials(persona.name)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-[1.2]">
          <span className="truncate text-[13px] font-semibold">{persona.name}</span>
          <span className="truncate text-[11px] text-muted">{persona.role}</span>
        </span>
        <Icon name="updown" size={14} strokeWidth={2} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="View the demo as"
          className={`absolute z-[60] rounded-[14px] border border-line bg-card p-2 shadow-[0_18px_50px_rgba(59,31,58,0.18)] ${
            sidebar ? 'right-0 bottom-[60px] left-0' : 'top-[50px] right-0 w-[290px] max-w-[calc(100vw-32px)]'
          }`}
        >
          <p className="mx-2.5 mt-1.5 mb-2 text-xs font-bold tracking-[0.07em] text-faint uppercase">View the demo as</p>
          {menu === undefined ? (
            <div className="flex items-center gap-2 px-2.5 py-3 text-sm text-muted">
              <Spinner tone="dark" /> Loading people…
            </div>
          ) : menu === null ? (
            <p className="px-2.5 py-2 text-sm text-muted">The demo service isn’t responding.</p>
          ) : (
            <div className="flex max-h-[min(60vh,420px)] flex-col overflow-y-auto">
              {menu.personas.map((p) => {
                const current = p.actor === menu.current;
                return (
                  <button
                    key={p.actor}
                    type="button"
                    role="menuitemradio"
                    aria-checked={current}
                    disabled={!!picking}
                    onClick={() => (current ? setOpen(false) : pick(p.actor, p.landing))}
                    className={`${item} ${current ? 'bg-chosen' : ''}`}
                  >
                    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold">{initials(p.label)}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-xs text-muted">{p.subtitle}</span>
                    </span>
                    {picking === p.actor ? <Spinner tone="dark" /> : current ? <Icon name="check" size={16} strokeWidth={2.2} color="var(--color-ok)" /> : null}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mx-1 my-2 h-px bg-line" />
          {menu?.inviteUrl ? (
            <Link role="menuitem" href={menu.inviteUrl} className="block w-full rounded-[10px] p-2.5 text-sm text-ink hover:bg-hover-btn">
              Preview the setup flow
            </Link>
          ) : null}
          <Link role="menuitem" href="/demo" className="block w-full rounded-[10px] p-2.5 text-sm text-ink hover:bg-hover-btn">
            Demo controls
          </Link>
          <ActionForm action={resetDemo}>
            <ConfirmSubmit
              label="Reset demo data"
              title="Reset the demo?"
              confirmLabel="Yes, reset everything"
              cancelLabel="Cancel"
              pendingText="Resetting…"
              triggerClassName="block w-full cursor-pointer rounded-[10px] p-2.5 text-left text-sm text-concern hover:bg-concern-soft"
            >
              This deletes everything created in the demo and restores the starting point. Everyone using the demo sees the reset.
            </ConfirmSubmit>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
