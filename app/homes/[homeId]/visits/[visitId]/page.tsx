import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from '@/components/print-button';
import { link } from '@/components/styles';
import { ToastOnLoad } from '@/components/toaster';
import { BackLink } from '@/components/ui';
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
  const partner = visit.visitorType === 'partner';

  return (
    <div className="mx-auto flex max-w-[820px] flex-col gap-5">
      {isNew === '1' ? (
        <ToastOnLoad
          message={`Visit recorded. ${fmtCount(visit.completedTasks.length, 'task')} closed, ${fmtCount(visit.followUpTasks.length, 'follow-up')} added.`}
          removeParams={['new']}
        />
      ) : null}
      <BackLink href={`${base}/visits`}>Visits</BackLink>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">
          {partner && visit.bookingId ? (
            <Link href={`${base}/help/${visit.bookingId}`} className={link}>
              Local partner visit
            </Link>
          ) : partner ? (
            'Local partner visit'
          ) : (
            'Family visit'
          )}{' '}
          · {visit.visitorName}
        </span>
        <h1 className="font-display text-[38px] leading-[1.1] font-normal tracking-[-0.025em]">{fmtDateTime(visit.visitedAt)}</h1>
      </div>
      <VisitReport visit={visit} homeId={homeId} />
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted">This report records what the visitor saw. It isn’t an insurance decision.</p>
        <PrintButton label="Print the report" size="sm" />
      </div>
    </div>
  );
}
