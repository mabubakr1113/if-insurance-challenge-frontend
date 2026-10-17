'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { fmtDateTime, fmtTime } from '@/lib/format';
import type { HomeSummary } from '@/lib/home-summary';
import { Icon } from './icons';
import { button } from './styles';
import { Spinner } from './ui';

export function HomeSummaryDrawer({ summary }: { summary: HomeSummary }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousOverflow = useRef<string | null>(null);
  const titleId = useId();
  const addressId = useId();
  const [snapshot, setSnapshot] = useState<HomeSummary | null>(null);
  const [preparedAt, setPreparedAt] = useState<string | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
  }, []);

  function open() {
    if (!dialog.current || dialog.current.open) return;
    setSnapshot(summary);
    setPreparedAt(null);
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current.showModal();
    // Simulates preparing the summary locally. No AI service or credentials are needed.
    timer.current = setTimeout(() => {
      setPreparedAt(new Date().toISOString());
      timer.current = null;
    }, 1100);
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current;
    previousOverflow.current = null;
    setPreparedAt(null);
    trigger.current?.focus();
  }

  const close = () => dialog.current?.close();

  return (
    <>
      <button ref={trigger} type="button" aria-haspopup="dialog" onClick={open} className={button('secondary')}>
        <Icon name="sparkles" size={17} />
        Summarise this home
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={addressId}
        onClose={reset}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]');
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const box = event.currentTarget.getBoundingClientRect();
          if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
        }}
        className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-[520px] overflow-hidden border-0 border-l border-line bg-card p-0 text-ink shadow-[-16px_0_60px_rgba(42,21,41,0.12)] backdrop:bg-[rgba(42,21,41,0.38)] open:flex open:flex-col wide:rounded-l-[22px] motion-safe:open:animate-[hw-drawer-in_220ms_ease-out]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line-soft px-6 pt-7 pb-5">
          <div className="min-w-0">
            <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent-soft text-ink"><Icon name="sparkles" size={22} /></span>
            <h2 id={titleId} className="font-display text-[32px] leading-tight font-normal">Home summary</h2>
            <p id={addressId} className="mt-1.5 text-[13px] text-muted">{snapshot?.address ?? summary.address}</p>
          </div>
          <button type="button" aria-label="Close home summary" onClick={close} className={button('quiet', 'md', 'w-[42px] px-0')}><Icon name="close" size={20} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6" aria-busy={!preparedAt} aria-live="polite">
          {!preparedAt || !snapshot ? (
            <div role="status" className="flex flex-col gap-6">
              <div className="flex items-center gap-3 text-sm font-semibold"><Spinner tone="dark" /> Preparing your summary…</div>
              <p className="-mt-3 text-sm leading-relaxed text-muted">Bringing together the care plan, weather and recent updates.</p>
              <div aria-hidden="true" className="flex flex-col gap-5 motion-safe:animate-pulse-soft">
                <div className="h-28 rounded-2xl bg-tile" />
                <div className="h-4 w-2/3 rounded bg-skeleton" />
                <div className="h-20 rounded-xl bg-tile" />
                <div className="h-20 rounded-xl bg-tile" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              <section aria-labelledby={`${titleId}-glance`}>
                <h3 id={`${titleId}-glance`} className="text-sm font-semibold">At a glance</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{snapshot.overview}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2">
                  {snapshot.stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-tile px-3 py-3.5">
                      <dd className="font-display text-[28px] leading-none">{stat.value}</dd>
                      <dt className="mt-2 text-xs text-muted">{stat.label}</dt>
                    </div>
                  ))}
                </dl>
              </section>

              <section aria-labelledby={`${titleId}-steps`}>
                <h3 id={`${titleId}-steps`} className="text-sm font-semibold">Suggested next steps</h3>
                {snapshot.nextSteps.length ? (
                  <ol className="mt-3 flex flex-col gap-2">
                    {snapshot.nextSteps.map((step, index) => (
                      <li key={step.href}>
                        <Link href={step.href} onClick={close} className="flex items-start gap-3 rounded-xl border border-line p-3.5 hover:bg-hover">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold">{index + 1}</span>
                          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{step.title}</span><span className="mt-1 block text-[13px] leading-relaxed text-muted">{step.detail}</span></span>
                          <Icon name="next" size={15} className="mt-1 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : <p className="mt-2 text-sm leading-relaxed text-muted">No next steps to highlight. You can review the care plan for the full picture.</p>}
              </section>

              {[
                { title: 'Weather outlook', icon: 'weather' as const, text: snapshot.weather, href: snapshot.weatherHref },
                { title: 'Visits', icon: 'visits' as const, text: snapshot.visits, href: snapshot.visitsHref },
              ].map((section) => (
                <section key={section.title}>
                  <Link href={section.href} onClick={close} className="flex items-center gap-2 text-sm font-semibold hover:text-accent-text"><Icon name={section.icon} size={17} />{section.title}<Icon name="next" size={14} className="ml-auto text-muted" /></Link>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{section.text}</p>
                </section>
              ))}

              <section aria-labelledby={`${titleId}-updates`}>
                <h3 id={`${titleId}-updates`} className="text-sm font-semibold">Recent updates</h3>
                {snapshot.updates.length ? (
                  <ul className="mt-3 flex flex-col gap-3">
                    {snapshot.updates.map((update) => (
                      <li key={update.id} className="border-l-2 border-line pl-3 text-sm leading-relaxed text-ink-soft">
                        {update.href ? <Link href={update.href} onClick={close} className="hover:text-accent-text">{update.message}</Link> : update.message}
                        <time dateTime={update.at} className="mt-1 block text-xs text-muted">{fmtDateTime(update.at)}</time>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-muted">No updates have been recorded yet.</p>}
              </section>
              <p className="text-xs text-muted">Prepared at {fmtTime(preparedAt)} · Based on the care plan, weather and recorded updates.</p>
            </div>
          )}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line-soft bg-paper px-6 py-4">
          <span className="truncate text-xs text-muted">{snapshot?.homeName ?? summary.homeName}</span>
          <Link href={snapshot?.planHref ?? summary.planHref} onClick={close} className={button('secondary', 'sm')}>Open care plan <Icon name="next" size={14} /></Link>
        </footer>
      </dialog>
    </>
  );
}
