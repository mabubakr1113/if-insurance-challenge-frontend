import type { Metadata } from 'next';
import Link from 'next/link';
import { partnerAccept, partnerStart } from '@/app/actions/partner';
import { AutoRefresh } from '@/components/auto-refresh';
import { BookingBadge } from '@/components/booking-bits';
import { ActionForm, SubmitButton } from '@/components/forms';
import { button } from '@/components/styles';
import { PageHeader, SimLabel } from '@/components/ui';
import type { PartnerJob } from '@/lib/contract';
import { fmtDate, fmtMoney, fmtSlot } from '@/lib/format';
import { read, requirePartner } from '@/lib/guards';

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
        title="Visit requests"
        intro={
          <span className="flex flex-wrap items-center gap-2">
            {me.partner.name} · {me.partner.area} <SimLabel>Fictional partner</SimLabel>
          </span>
        }
      />
      <JobGroup title="New requests" jobs={open} empty="No new requests right now." />
      <JobGroup title="Scheduled" jobs={scheduled} empty="Nothing scheduled." />
      <JobGroup title="Done" jobs={done} empty="No finished visits yet." />
    </div>
  );
}

function JobGroup({ title, jobs, empty }: { title: string; jobs: PartnerJob[]; empty: string }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <h2 className="text-[15px] font-semibold text-muted">
        {title} <span className="font-medium">{jobs.length}</span>
      </h2>
      {jobs.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line-input p-[22px] text-sm text-muted">{empty}</div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {jobs.map(({ booking: b, home }) => {
            const finishedAt = b.completedAt ?? b.cancelledAt;
            const who = `${b.requestedBy ? `Requested by ${b.requestedBy.name}` : 'Requested'}${b.approvedBy && b.approvedBy.id !== b.requestedBy?.id ? ` · approved by ${b.approvedBy.name}` : ''}`;
            return (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-line bg-card px-5 py-[18px]">
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                  <Link href={`/partner/jobs/${b.id}`} className="text-base font-semibold hover:text-accent-text">
                    {home.addressLine}, {home.city}
                  </Link>
                  <span className="text-sm">
                    {b.package.name} · {fmtSlot(b.slotStart, b.slotEnd)}
                  </span>
                  <span className="text-[13px] text-muted">
                    {who}
                    {finishedAt ? ` · ${fmtDate(finishedAt)}` : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="flex items-center gap-2.5">
                    <span className="font-display text-2xl">{fmtMoney(b.package.partnerPriceCents)}</span>
                    <BookingBadge status={b.status} size="md" />
                  </span>
                  {b.status === 'requested' ? (
                    <ActionForm action={partnerAccept.bind(null, b.id)}>
                      <SubmitButton size="sm" pendingText="Accepting…">
                        Accept
                      </SubmitButton>
                    </ActionForm>
                  ) : b.status === 'confirmed' ? (
                    <ActionForm action={partnerStart.bind(null, b.id)}>
                      <SubmitButton size="sm" pendingText="Starting…">
                        Start the visit
                      </SubmitButton>
                    </ActionForm>
                  ) : b.status === 'in_progress' ? (
                    <Link href={`/partner/jobs/${b.id}#report`} className={button('primary', 'sm')}>
                      Send the report
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
