import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { recordVisit } from '@/app/actions/visits';
import { Card, PageHeader } from '@/components/ui';
import { VisitForm } from '@/components/visit-form';
import type { CheckItem } from '@/lib/contract';
import { toLocalInput } from '@/lib/format';
import { canHelp, getHome, isClosed, read, requireMember } from '@/lib/guards';
import { getPlan } from '@/lib/home-data';

export const metadata: Metadata = { title: 'Record a visit' };

export default async function NewVisitPage({ params }: PageProps<'/homes/[homeId]/visits/new'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  const [home, checklist, plan] = await Promise.all([
    getHome(homeId),
    read<CheckItem[]>(`/api/homes/${homeId}/visit-checklist`),
    getPlan(homeId, 'open'),
  ]);
  if (!canHelp(me.member) || isClosed(home)) redirect(`/homes/${homeId}/visits`);
  const now = new Date();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Record a visit" intro="Go through the checklist as you walk around the house. It takes about 15 minutes." />
      <Card>
        <VisitForm
          action={recordVisit.bind(null, homeId)}
          homeId={homeId}
          checklist={checklist}
          openTasks={plan.tasks.filter((t) => t.status === 'open' || t.status === 'accepted').map((t) => ({ id: t.id, title: t.title, templateKey: t.templateKey }))}
          defaultVisitedAt={toLocalInput(now)}
          maxVisitedAt={toLocalInput(new Date(now.getTime() + 60 * 60 * 1000))}
          variant="family"
          submitLabel="Save visit"
        />
      </Card>
    </div>
  );
}
