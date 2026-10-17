import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from '@/components/print-button';
import { btnSecondary, link } from '@/components/styles';
import { Card, Notice } from '@/components/ui';
import { VisitReport } from '@/components/visit-report';
import type { Visit } from '@/lib/contract';
import { fmtCount, fmtDateTime } from '@/lib/format';
import { read, requireMember } from '@/lib/guards';

export const metadata: Metadata = { title: 'Visit report' };

export default async function VisitPage({ params, searchParams }: PageProps<'/homes/[homeId]/visits/[visitId]'>) {
  const { homeId, visitId } = await params;
  const { new: isNew } = await searchParams;
  await requireMember(homeId);
  const visit = await read<Visit>(`/api/visits/${visitId}`);
  const base = `/homes/${homeId}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {isNew === '1' ? (
        <Notice tone="ok" role="status">
          Visit saved. {fmtCount(visit.completedTasks.length, 'task')} completed, {fmtCount(visit.followUpTasks.length, 'follow-up')} created.
        </Notice>
      ) : null}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Visit on {fmtDateTime(visit.visitedAt, { year: true })} by {visit.visitorName}
        </h1>
        {visit.bookingId ? (
          <p className="mt-1">
            <Link href={`${base}/help/${visit.bookingId}`} className={link}>
              Local partner visit
            </Link>
          </p>
        ) : null}
      </div>
      <Card>
        <VisitReport visit={visit} homeId={homeId} />
      </Card>
      <p className="text-sm text-muted">This report records what the visitor saw. It isn’t an insurance decision.</p>
      <div className="no-print flex flex-wrap gap-2">
        <PrintButton />
        <Link href={`${base}/visits`} className={btnSecondary}>
          Back to visits
        </Link>
      </div>
    </div>
  );
}
