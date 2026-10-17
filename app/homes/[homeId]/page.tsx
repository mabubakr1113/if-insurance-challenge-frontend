import type { Metadata } from 'next';
import Link from 'next/link';
import { ActivityList } from '@/components/activity-list';
import { AutoRefresh } from '@/components/auto-refresh';
import { link } from '@/components/styles';
import { SupervisionSummary } from '@/components/supervision';
import { TaskItem } from '@/components/task-item';
import { Badge, ButtonLink, Card, Empty, Notice } from '@/components/ui';
import { AlertList, ForecastSource, ForecastTable } from '@/components/weather';
import type { Task } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtSlot } from '@/lib/format';
import { canHelp, getDashboard, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { getPlan } from '@/lib/home-data';
import { bookingText, BOOKING_STATUS, firstName, ROLE } from '@/lib/labels';

export const metadata: Metadata = { title: 'Overview' };

export default async function OverviewPage({ params, searchParams }: PageProps<'/homes/[homeId]'>) {
  const { homeId } = await params;
  const { welcome } = await searchParams;
  await requireMember(homeId);
  const [d, plan] = await Promise.all([getDashboard(homeId), getPlan(homeId)]);
  const base = `/homes/${homeId}`;
  const closed = isClosed(d.home);
  const helper = canHelp(d.me) && !closed;
  const coordinator = isCoordinator(d.me) && !closed;
  const tasksById = new Map<string, Task>(plan.tasks.map((t) => [t.id, t]));
  const slotFor = (t: Task) =>
    d.activeBooking && t.bookingId === d.activeBooking.id ? fmtSlot(d.activeBooking.slotStart, d.activeBooking.slotEnd) : null;

  const statusParts = [
    d.counts.needsOwner ? `${d.counts.needsOwner} ${d.counts.needsOwner === 1 ? 'thing needs' : 'things need'} an owner` : null,
    d.counts.overdue ? `${d.counts.overdue} overdue` : null,
  ].filter(Boolean);
  const nextDue = fmtDate(d.supervision.nextDueAt);
  const statusLine = statusParts.length ? `${statusParts.join(' · ')} · next visit due ${nextDue}` : `Nothing urgent. Next visit due ${nextDue}.`;

  return (
    <div className="flex flex-col gap-6">
      {!closed ? <AutoRefresh seconds={10} /> : null}
      <h1 className="sr-only">Overview</h1>

      {welcome === '1' ? (
        <Notice tone="ok" role="status">
          <p className="font-medium">
            Your care plan is ready: {d.counts.open} tasks. Start with the urgent ones, and invite family to share them.
          </p>
          <p className="mt-2">
            <Link href={`${base}/family`} className={link}>
              Invite family
            </Link>
          </p>
        </Notice>
      ) : null}

      <p className={`text-lg font-medium ${statusParts.length ? 'text-attention' : ''}`}>{statusLine}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Supervision">
          <SupervisionSummary supervision={d.supervision} />
        </Card>
        <Card
          title="Weather"
          action={
            <Link href={`${base}/weather`} className={`${link} text-sm`}>
              Weather details
            </Link>
          }
        >
          <ForecastTable weather={d.weather} />
          <div className="mt-2">
            <ForecastSource weather={d.weather} />
          </div>
          {d.weather.activeAlerts.length ? (
            <div className="mt-3">
              <AlertList alerts={d.weather.activeAlerts} tasks={tasksById} homeId={homeId} />
            </div>
          ) : null}
        </Card>
      </div>

      <Card title="Needs attention">
        {d.needsAttention.length ? (
          <ul className="flex flex-col gap-3">
            {d.needsAttention.map((t) => (
              <TaskItem key={t.id} task={t} homeId={homeId} variant="attention" canAccept={helper} canRequestVisit={helper} bookingSlot={slotFor(t)} />
            ))}
          </ul>
        ) : (
          <Empty>Nothing needs attention right now.</Empty>
        )}
      </Card>

      {d.activeBooking ? (
        <Card title="Local visit in progress">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">
                {d.activeBooking.package.name} · {d.activeBooking.partner.name}
              </p>
              <p className="text-sm text-muted">{fmtSlot(d.activeBooking.slotStart, d.activeBooking.slotEnd)}</p>
              <p className="mt-1">{bookingText(d.activeBooking)}</p>
            </div>
            <span className="flex flex-col items-end gap-2">
              <Badge tone="accent">{BOOKING_STATUS[d.activeBooking.status]}</Badge>
              <Link href={`${base}/help/${d.activeBooking.id}`} className={link}>
                See the visit
              </Link>
            </span>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="My tasks">
          {d.myTasks.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {d.myTasks.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-3 py-2">
                  <Link href={`${base}/tasks/${t.id}`} className={link}>
                    {t.title}
                  </Link>
                  <span className={`shrink-0 text-sm ${t.isOverdue ? 'font-medium text-attention' : 'text-muted'}`}>
                    {t.dueAt ? fmtDateTime(t.dueAt) : 'No due date'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">You have no tasks right now.</p>
          )}
        </Card>

        <Card title="Missing house essentials">
          {d.essentialsMissing.length ? (
            <ul className="flex flex-col gap-2">
              {d.essentialsMissing.map((e) => (
                <li key={e.key} className="flex items-baseline justify-between gap-3">
                  <span>
                    {e.label} {e.noteId ? 'not confirmed yet' : 'not added yet'}
                  </span>
                  {helper ? (
                    <Link
                      href={e.noteId ? `${base}/notes/${e.noteId}` : `${base}/notes/new?essential=${e.key}&category=${e.category}`}
                      className={`${link} shrink-0 text-sm`}
                    >
                      {e.noteId ? 'Edit' : 'Add'}
                      <span className="sr-only"> {e.label}</span>
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">All the essentials are in the house notes.</p>
          )}
        </Card>
      </div>

      <Card
        title="Family"
        action={
          coordinator ? (
            <Link href={`${base}/family`} className={`${link} text-sm`}>
              Invite family
            </Link>
          ) : null
        }
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {d.members.map((m) => (
            <li key={m.id} className="rounded-lg bg-soft px-3 py-2">
              <p className="font-medium">
                {m.name} <span className="font-normal text-muted">· {ROLE[m.role]}</span>
                {m.status === 'invited' ? <span className="font-normal text-muted"> · invited</span> : null}
              </p>
              <p className="text-sm text-muted">
                {m.stats.openTasks} open {m.stats.openTasks === 1 ? 'task' : 'tasks'} ·{' '}
                {m.stats.lastVisitAt ? `last visit ${fmtDate(m.stats.lastVisitAt)}` : 'no visits yet'}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        title="Recent activity"
        action={
          <Link href={`${base}/record`} className={`${link} text-sm`}>
            See everything
          </Link>
        }
      >
        <ActivityList items={d.recentActivity} homeId={homeId} />
      </Card>

      {!closed ? (
        <Card title="Quick actions">
          <div className="flex flex-wrap gap-2">
            {helper ? <ButtonLink href={`${base}/visits/new`}>Record a visit</ButtonLink> : null}
            {helper ? (
              <ButtonLink href={`${base}/notes/new`} variant="secondary">
                Add a house note
              </ButtonLink>
            ) : null}
            {helper ? (
              <ButtonLink href={`${base}/help`} variant="secondary">
                Request a local visit
              </ButtonLink>
            ) : null}
            {helper ? (
              <ButtonLink href={`${base}/tasks/new`} variant="secondary">
                Add a task
              </ButtonLink>
            ) : null}
            {!helper ? (
              <p className="text-sm text-muted">
                Viewers can read and comment. Ask {firstName(d.members.find((m) => m.role === 'coordinator')?.name ?? 'the coordinator')} to change your
                role.
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
