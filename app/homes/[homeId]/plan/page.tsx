import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { TaskItem } from '@/components/task-item';
import { ButtonLink, Empty, PageHeader } from '@/components/ui';
import type { Task, TaskFilter } from '@/lib/contract';
import { canHelp, getDashboard, isClosed, requireMember } from '@/lib/guards';
import { followUpOrigins, getPlan } from '@/lib/home-data';

export const metadata: Metadata = { title: 'Care plan' };

const FILTERS: { key: TaskFilter; label: string; count: 'all' | 'mine' | 'open' | 'needsOwner' | 'overdue' | 'done' }[] = [
  { key: 'all', label: 'All', count: 'all' },
  { key: 'mine', label: 'Mine', count: 'mine' },
  { key: 'open', label: 'Open', count: 'open' },
  { key: 'needs_owner', label: 'Needs an owner', count: 'needsOwner' },
  { key: 'overdue', label: 'Overdue', count: 'overdue' },
  { key: 'done', label: 'Done', count: 'done' },
];

const WEEK = 7 * 24 * 60 * 60 * 1000;

function group(tasks: Task[], includeCancelled: boolean): [string, Task[]][] {
  const now = Date.now();
  const buckets: Record<string, Task[]> = { 'Needs an owner': [], Overdue: [], 'This week': [], Later: [], Done: [], Cancelled: [] };
  for (const t of tasks) {
    if (t.status === 'done') buckets.Done.push(t);
    else if (t.status === 'cancelled') buckets.Cancelled.push(t);
    else if (t.needsOwner) buckets['Needs an owner'].push(t);
    else if (t.isOverdue) buckets.Overdue.push(t);
    else if (t.dueAt && new Date(t.dueAt).getTime() - now <= WEEK) buckets['This week'].push(t);
    else buckets.Later.push(t);
  }
  if (!includeCancelled) buckets.Cancelled = [];
  return Object.entries(buckets).filter(([, list]) => list.length > 0);
}

export default async function PlanPage({ params, searchParams }: PageProps<'/homes/[homeId]/plan'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  await requireMember(homeId);
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ?? 'all') as TaskFilter;
  const [plan, dashboard, origins] = await Promise.all([getPlan(homeId, filter), getDashboard(homeId), followUpOrigins(homeId)]);
  const closed = isClosed(dashboard.home);
  const helper = canHelp(dashboard.me) && !closed;
  const base = `/homes/${homeId}`;
  const grouped = filter === 'all' || filter === 'open';

  const item = (t: Task) => (
    <TaskItem key={t.id} task={t} homeId={homeId} variant="plan" canAccept={helper} canRequestVisit={helper} origin={origins.get(t.id)} />
  );

  return (
    <div>
      {!closed ? <AutoRefresh seconds={10} /> : null}
      <PageHeader title="Care plan" intro="Every task has a reason, an owner and a due date. “Not confirmed” means something nobody has checked yet.">
        {helper ? <ButtonLink href={`${base}/tasks/new`}>Add a task</ButtonLink> : null}
      </PageHeader>

      <nav aria-label="Filter tasks" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.key === 'all' ? `${base}/plan` : `${base}/plan?filter=${f.key}`}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-accent bg-accent text-white' : 'border-line bg-card text-ink hover:bg-soft'}`}
            >
              {f.label} <span className={active ? 'text-white/80' : 'text-muted'}>{plan.counts[f.count]}</span>
            </Link>
          );
        })}
      </nav>

      {plan.tasks.length === 0 ? (
        <Empty>Nothing here.</Empty>
      ) : grouped ? (
        <div className="flex flex-col gap-8">
          {group(plan.tasks, filter === 'all').map(([title, list]) => (
            <section key={title} aria-labelledby={`group-${title}`}>
              <h2 id={`group-${title}`} className="mb-3 text-lg font-semibold">
                {title} <span className="text-base font-normal text-muted">{list.length}</span>
              </h2>
              <ul className="flex flex-col gap-3">{list.map(item)}</ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">{plan.tasks.map(item)}</ul>
      )}
    </div>
  );
}
