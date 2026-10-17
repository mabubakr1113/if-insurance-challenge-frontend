import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { HomeMap } from '@/components/home-map';
import { HomeSummaryDrawer } from '@/components/home-summary-drawer';
import { Icon } from '@/components/icons';
import { h1, row, rowHover } from '@/components/styles';
import { SupervisionCard } from '@/components/supervision';
import { TaskRow } from '@/components/task-item';
import { ToastOnLoad } from '@/components/toaster';
import { ArrowLink, Badge, ButtonLink, ListBox, Notice } from '@/components/ui';
import { WeatherAlertCard } from '@/components/weather';
import type { Task } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtSlot, helsinkiHour } from '@/lib/format';
import { canHelp, getDashboard, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { getPlan } from '@/lib/home-data';
import { buildHomeSummary } from '@/lib/home-summary';
import { BOOKING_STATUS, firstName } from '@/lib/labels';

export const metadata: Metadata = { title: 'Overview' };

const greetingFor = (hour: number) => (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

/** Deliberately sparse: one question, what needs me now? */
export default async function OverviewPage({ params, searchParams }: PageProps<'/homes/[homeId]'>) {
  const { homeId } = await params;
  const { welcome, closed: justClosed } = await searchParams;
  await requireMember(homeId);
  const [d, plan] = await Promise.all([getDashboard(homeId), getPlan(homeId)]);
  const base = `/homes/${homeId}`;
  const closed = isClosed(d.home);
  const helper = canHelp(d.me) && !closed;
  const coordinator = isCoordinator(d.me) && !closed;
  const tasksById = new Map<string, Task>(plan.tasks.map((t) => [t.id, t]));

  const empty = plan.counts.all === 0;
  const n = d.counts.needsOwner;
  const headline = empty ? 'Let’s build the care plan' : n ? `${n} ${n === 1 ? 'thing needs' : 'things need'} an owner` : 'Nothing urgent';
  const sub = empty
    ? 'No tasks yet. Add the first one or record a visit.'
    : [d.counts.overdue ? `${d.counts.overdue} overdue` : null, `next visit due ${fmtDate(d.supervision.nextDueAt)}`]
        .filter(Boolean)
        .join(' · ')
        .replace(/^./, (c) => c.toUpperCase());

  const attention = d.needsAttention.slice(0, 4);
  const myTasks = d.myTasks.slice(0, 3);
  const missing = d.essentialsMissing.length;
  const booking = d.activeBooking;

  return (
    <div className="flex flex-col gap-8">
      {!closed ? <AutoRefresh seconds={10} /> : null}
      {justClosed === '1' ? <ToastOnLoad message="Plan closed. The record stays available." removeParams={['closed']} /> : null}

      {welcome === '1' ? (
        <Notice
          tone="success"
          role="status"
          action={
            <Link
              href={coordinator ? `${base}/family?invite=1` : `${base}/family`}
              className="inline-flex h-9 items-center rounded-[9px] border border-ok px-3.5 text-[13px] font-semibold text-ok-strong hover:bg-white/50"
            >
              Invite family
            </Link>
          }
        >
          <span className="text-[15px] font-medium">Your care plan is ready. Start with the urgent tasks, then invite family to share them.</span>
        </Notice>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-sm text-muted">
            {greetingFor(helsinkiHour())}, {firstName(d.me.name)}
          </span>
          <h1 className={h1}>{headline}</h1>
          <span className="text-[15px] text-muted">{sub}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <HomeSummaryDrawer summary={buildHomeSummary(d, plan)} />
          {helper ? (
            <ButtonLink href={`${base}/visits/new`} icon="plus">
              Record a visit
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[999_1_440px] flex-col gap-8">
          <section aria-labelledby="attention" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="attention" className="text-[15px] font-semibold">
                Needs attention
              </h2>
              <ArrowLink href={`${base}/plan`}>Care plan</ArrowLink>
            </div>
            {attention.length ? (
              <ListBox>
                {attention.map((t) => (
                  <TaskRow key={t.id} task={t} homeId={homeId} variant="attention" canAccept={helper} />
                ))}
              </ListBox>
            ) : (
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-line-input px-5 py-7 text-center">
                <span className="text-[15px] font-semibold">Nothing needs attention</span>
                <span className="text-sm text-muted">Urgent, overdue and unowned tasks show up here.</span>
              </div>
            )}
          </section>

          {myTasks.length ? (
            <section aria-labelledby="mine" className="flex flex-col gap-2.5">
              <h2 id="mine" className="text-[15px] font-semibold">
                My tasks
              </h2>
              <ListBox>
                {myTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`${base}/tasks/${t.id}`}
                    className={`flex items-center justify-between gap-3 px-[18px] py-3.5 ${row} ${rowHover}`}
                  >
                    <span className="text-sm font-medium">{t.title}</span>
                    <span className={`shrink-0 text-[13px] ${t.isOverdue ? 'font-semibold text-attention' : 'text-muted'}`}>
                      {t.dueAt ? fmtDateTime(t.dueAt) : 'No due date'}
                    </span>
                  </Link>
                ))}
              </ListBox>
            </section>
          ) : null}
        </div>

        <aside aria-label="At a glance" className="flex min-w-0 flex-[1_1_290px] flex-col gap-3.5">
          <WeatherAlertCard weather={d.weather} tasks={tasksById} href={`${base}/weather`} />
          <SupervisionCard supervision={d.supervision} />
          {booking ? (
            <RowCard href={`${base}/help/${booking.id}`} title="Local visit" line={`${booking.package.name} · ${fmtSlot(booking.slotStart, booking.slotEnd)}`}>
              <Badge tone={booking.status === 'pending_approval' || booking.status === 'requested' ? 'attention' : 'accent'}>{BOOKING_STATUS[booking.status]}</Badge>
            </RowCard>
          ) : null}
          {missing ? (
            <RowCard
              href={`${base}/notes`}
              title="House essentials"
              line={`${missing} ${missing === 1 ? 'item' : 'items'} missing or not confirmed`}
              warn
            />
          ) : null}
        </aside>
      </div>
      <HomeMap key={`${homeId}:${d.home.lat}:${d.home.lng}`} lat={d.home.lat} lng={d.home.lng} address={d.home.addressLine} city={d.home.city} />
    </div>
  );
}

/** A single clickable card row in the rail. */
function RowCard({ href, title, line, warn = false, children }: { href: string; title: string; line: string; warn?: boolean; children?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-5 py-[18px] hover:bg-hover">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className={`text-[13px] ${warn ? 'text-attention' : 'text-muted'}`}>{line}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {children}
        <Icon name="next" size={16} strokeWidth={2} color="var(--color-muted)" />
      </span>
    </Link>
  );
}
