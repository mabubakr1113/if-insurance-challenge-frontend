import type { Metadata } from 'next';
import { AutoRefresh } from '@/components/auto-refresh';
import { Dialog } from '@/components/dialog';
import { TaskRow } from '@/components/task-item';
import { NewTaskForm } from '@/components/task-form';
import { ButtonLink, Empty, Eyebrow, ListBox, PageHeader, Segmented } from '@/components/ui';
import type { Task, TaskFilter } from '@/lib/contract';
import { canHelp, getDashboard, getMembers, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { getPlan } from '@/lib/home-data';

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

function group(tasks: Task[], includeDone: boolean): [string, Task[]][] {
  const now = Date.now();
  const buckets: Record<string, Task[]> = { 'Needs an owner': [], Overdue: [], 'This week': [], Later: [], Done: [] };
  for (const t of tasks) {
    if (t.status === 'done') buckets.Done.push(t);
    else if (t.status === 'cancelled') continue;
    else if (t.needsOwner) buckets['Needs an owner'].push(t);
    else if (t.isOverdue) buckets.Overdue.push(t);
    else if (t.dueAt && new Date(t.dueAt).getTime() - now <= WEEK) buckets['This week'].push(t);
    else buckets.Later.push(t);
  }
  if (!includeDone) buckets.Done = [];
  return Object.entries(buckets).filter(([, list]) => list.length > 0);
}

export default async function PlanPage({ params, searchParams }: PageProps<'/homes/[homeId]/plan'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ?? 'all') as TaskFilter;
  const [plan, dashboard] = await Promise.all([getPlan(homeId, filter), getDashboard(homeId)]);
  const closed = isClosed(dashboard.home);
  const helper = canHelp(dashboard.me) && !closed;
  const base = `/homes/${homeId}`;
  const here = filter === 'all' ? `${base}/plan` : `${base}/plan?filter=${filter}`;
  const grouped = filter === 'all' || filter === 'open';
  const adding = helper && sp.new === '1';
  const owners = adding ? (isCoordinator(me.member) ? (await getMembers(homeId)).filter((m) => m.role !== 'viewer') : [me.member]) : [];

  const rows = (list: Task[]) => (
    <ListBox>
      {list.map((t) => (
        <TaskRow key={t.id} task={t} homeId={homeId} variant="plan" canAccept={helper} />
      ))}
    </ListBox>
  );

  return (
    <div className="flex flex-col gap-6">
      {!closed ? <AutoRefresh seconds={10} /> : null}
      <PageHeader
        title="Care plan"
        actions={
          helper ? (
            <ButtonLink href={`${here}${here.includes('?') ? '&' : '?'}new=1`} icon="plus" scroll={false}>
              Add a task
            </ButtonLink>
          ) : null
        }
      />

      <Segmented
        label="Filter tasks"
        items={FILTERS.map((f) => ({
          href: f.key === 'all' ? `${base}/plan` : `${base}/plan?filter=${f.key}`,
          label: f.label,
          count: plan.counts[f.count],
          active: f.key === filter,
        }))}
      />

      {plan.tasks.length === 0 ? (
        plan.counts.all === 0 ? (
          <Empty
            tall
            title="The care plan is empty"
            action={
              helper ? (
                <ButtonLink href={`${base}/plan?new=1`} icon="plus" scroll={false}>
                  Add a task
                </ButtonLink>
              ) : null
            }
          >
            Tasks from setup, the weather and visits appear here. You can also add your own.
          </Empty>
        ) : (
          <Empty tall title="Nothing here">No tasks match this filter right now.</Empty>
        )
      ) : grouped ? (
        group(plan.tasks, filter === 'all').map(([title, list]) => (
          <section key={title} aria-label={title} className="flex flex-col gap-2">
            <Eyebrow as="h2">
              {title} · {list.length}
            </Eyebrow>
            {rows(list)}
          </section>
        ))
      ) : (
        rows(plan.tasks)
      )}

      {adding ? (
        <Dialog title="Add a task" closeHref={here} width="lg">
          <NewTaskForm homeId={homeId} owners={owners} meId={me.member.id} inDialog />
        </Dialog>
      ) : null}
    </div>
  );
}
