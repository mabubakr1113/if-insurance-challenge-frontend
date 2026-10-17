import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NewTaskForm } from '@/components/task-form';
import { Card, PageHeader } from '@/components/ui';
import { canHelp, getHome, getMembers, isClosed, isCoordinator, requireMember } from '@/lib/guards';

export const metadata: Metadata = { title: 'New task' };

export default async function NewTaskPage({ params }: PageProps<'/homes/[homeId]/tasks/new'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  const [home, members] = await Promise.all([getHome(homeId), getMembers(homeId)]);
  if (!canHelp(me.member) || isClosed(home)) redirect(`/homes/${homeId}/plan`);
  const owners = isCoordinator(me.member) ? members.filter((m) => m.role !== 'viewer') : members.filter((m) => m.id === me.member.id);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <PageHeader title="Add a task" back={{ href: `/homes/${homeId}/plan`, label: 'Care plan' }} />
      <Card size="section">
        <NewTaskForm homeId={homeId} owners={owners} meId={me.member.id} />
      </Card>
    </div>
  );
}
