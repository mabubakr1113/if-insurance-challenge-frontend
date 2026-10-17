import type { Metadata } from 'next';
import Link from 'next/link';
import { AutoRefresh } from '@/components/auto-refresh';
import { link } from '@/components/styles';
import { Badge, Card, Empty, PageHeader, SimLabel } from '@/components/ui';
import type { PartnerJob } from '@/lib/contract';
import { fmtDate, fmtMoney, fmtSlot } from '@/lib/format';
import { read, requirePartner } from '@/lib/guards';
import { BOOKING_STATUS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Visit requests' };

export default async function PartnerPage() {
  const me = await requirePartner();
  const [open, scheduled, done] = await Promise.all([
    read<PartnerJob[]>('/api/partner/jobs?status=open'),
    read<PartnerJob[]>('/api/partner/jobs?status=scheduled'),
    read<PartnerJob[]>('/api/partner/jobs?status=done'),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh seconds={10} />
      <PageHeader
        title={me.partner.name}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            {me.partner.area} <SimLabel>Fictional partner</SimLabel>
          </span>
        }
      />
      <JobGroup title="New requests" jobs={open} />
      <JobGroup title="Scheduled" jobs={scheduled} />
      <JobGroup title="Done" jobs={done} finished />
    </div>
  );
}

function JobGroup({ title, jobs, finished = false }: { title: string; jobs: PartnerJob[]; finished?: boolean }) {
  return (
    <Card title={title}>
      {jobs.length === 0 ? (
        <Empty>Nothing here right now.</Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {jobs.map(({ booking: b, home }) => {
            const finishedAt = b.completedAt ?? b.cancelledAt;
            return (
              <li key={b.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <Link href={`/partner/jobs/${b.id}`} className={`${link} font-semibold`}>
                    {home.addressLine}, {home.city}
                  </Link>
                  <p className="text-sm">
                    {b.package.name} · {fmtSlot(b.slotStart, b.slotEnd)}
                  </p>
                  <p className="text-sm text-muted">
                    {b.requestedBy ? `Requested by ${b.requestedBy.name}` : 'Requested'}
                    {b.approvedBy ? ` · approved by ${b.approvedBy.name}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                  <span className="font-semibold">{fmtMoney(b.package.partnerPriceCents)}</span>
                  <Badge tone={b.status === 'completed' ? 'ok' : b.status === 'requested' ? 'attention' : 'accent'}>{BOOKING_STATUS[b.status]}</Badge>
                  {finished && finishedAt ? <span className="text-xs text-muted">{fmtDate(finishedAt)}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
