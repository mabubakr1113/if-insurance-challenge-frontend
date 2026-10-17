import type { Metadata } from 'next';
import { partnerAccept, partnerComplete, partnerDecline, partnerStart } from '@/app/actions/partner';
import { AutoRefresh } from '@/components/auto-refresh';
import { BookingBadge } from '@/components/booking-bits';
import { Dialog, DialogActions, DialogCancel } from '@/components/dialog';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { PhotoGrid } from '@/components/photo-grid';
import { input, link } from '@/components/styles';
import { Card, Facts, Notice, PageHeader, SimLabel } from '@/components/ui';
import { VisitForm } from '@/components/visit-form';
import type { BookingStatus, PartnerJobDetail, Visit } from '@/lib/contract';
import { fmtCount, fmtMoney, fmtSlot, fmtTemp } from '@/lib/format';
import { read, requirePartner } from '@/lib/guards';
import { ACCESS_METHOD } from '@/lib/labels';

export const metadata: Metadata = { title: 'Visit job' };

const STATUS_TEXT: Record<BookingStatus, string> = {
  pending_approval: 'Waiting for the family to approve.',
  requested: 'New request: accept or decline.',
  confirmed: 'Confirmed. Start the visit when you arrive.',
  in_progress: 'Visit in progress. Fill in the report as you go.',
  completed: 'Done. The report was sent to the family.',
  cancelled: 'Cancelled by the family.',
  declined: 'You declined this visit.',
};

export default async function PartnerJobPage({ params }: PageProps<'/partner/jobs/[bookingId]'>) {
  const { bookingId } = await params;
  await requirePartner();
  const job = await read<PartnerJobDetail>(`/api/partner/jobs/${bookingId}`);
  const { booking: b, home } = job;
  const visit = b.status === 'completed' && b.visitId ? await read<Visit>(`/api/visits/${b.visitId}`) : null;
  const canReport = b.status === 'in_progress' || b.status === 'confirmed';

  return (
    <div className="flex flex-col gap-6">
      {b.status === 'requested' ? <AutoRefresh seconds={10} /> : null}
      <PageHeader
        back={{ href: '/partner', label: 'Visit requests' }}
        eyebrow={home.estateName ? `Estate of ${home.estateName}` : undefined}
        title={`${home.addressLine}, ${home.postalCode} ${home.city}`}
        intro={
          <span className="flex flex-wrap items-center gap-2">
            <BookingBadge status={b.status} />
            {STATUS_TEXT[b.status]}
          </span>
        }
        actions={
          b.status === 'requested' ? (
            <>
              <Dialog title="Decline the visit?" description="The family is told straight away and can book another time." trigger="Decline" triggerVariant="quiet" role="alertdialog" width="sm">
                <ActionForm action={partnerDecline.bind(null, b.id)} className="flex flex-col gap-3.5">
                  <Field label="Reason for the family" name="reason">
                    <input id="reason" name="reason" className={input} maxLength={1000} placeholder="e.g. No free time on that day" />
                  </Field>
                  <DialogActions>
                    <DialogCancel>Keep it</DialogCancel>
                    <SubmitButton variant="danger" pendingText="Declining…">
                      Decline
                    </SubmitButton>
                  </DialogActions>
                </ActionForm>
              </Dialog>
              <ActionForm action={partnerAccept.bind(null, b.id)}>
                <SubmitButton pendingText="Accepting…">Accept</SubmitButton>
              </ActionForm>
            </>
          ) : b.status === 'confirmed' ? (
            <ActionForm action={partnerStart.bind(null, b.id)}>
              <SubmitButton pendingText="Starting…">Start the visit</SubmitButton>
            </ActionForm>
          ) : null
        }
      />

      {visit ? (
        <Notice tone="success" title="Report sent.">
          {visit.indoorTempC !== null ? `${fmtTemp(visit.indoorTempC)} inside · ` : ''}
          {visit.okCount} OK · {fmtCount(visit.concernCount, 'concern')} · {fmtCount(visit.photos.length, 'photo')}
        </Notice>
      ) : null}

      <div className="grid items-start gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        <Card size="section" title="The visit" className="gap-2">
          <Facts
            items={[
              ['Time', fmtSlot(b.slotStart, b.slotEnd)],
              ['Visit', `${b.package.name} (${b.package.durationMin} min)`],
              ['Includes', b.package.includes.join(', ')],
              ['Task', b.taskTitle],
              ['Notes', b.notes],
            ]}
          />
          <p className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-3 text-sm">
            You’re paid <span className="font-display text-xl">{fmtMoney(b.package.partnerPriceCents)}</span>
            <SimLabel>Prototype price, not a quote</SimLabel>
          </p>
        </Card>
        <Card size="section" title="Access and contact" className="gap-2">
          <Facts
            items={[
              ['Method', ACCESS_METHOD[b.accessMethod]],
              ['Details', b.accessDetails],
              ['Key holder', job.keyHolder],
              ['Access notes', job.accessNotes],
              [
                'Family contact',
                job.coordinator ? (
                  <span key="c">
                    {job.coordinator.name}
                    {job.coordinator.phone ? (
                      <>
                        {' · '}
                        <a href={`tel:${job.coordinator.phone.replace(/\s/g, '')}`} className={link}>
                          {job.coordinator.phone}
                        </a>
                      </>
                    ) : null}
                  </span>
                ) : null,
              ],
            ]}
          />
        </Card>
      </div>

      <Card size="section" title="House essentials" className="gap-3.5">
        {job.essentials.length ? (
          <ul className="flex flex-col gap-4">
            {job.essentials.map((n) => (
              <li key={n.id} className="flex flex-col gap-1.5">
                <p className="text-[15px] font-semibold">{n.title}</p>
                {n.body ? <p className="text-sm leading-normal whitespace-pre-line text-ink-soft">{n.body}</p> : null}
                <PhotoGrid photos={n.photos} captions={false} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">The family hasn’t added house essentials yet.</p>
        )}
      </Card>

      {canReport ? (
        <section id="report" aria-labelledby="report-title" className="flex scroll-mt-6 flex-col gap-4">
          <h2 id="report-title" className="font-display text-[28px] leading-tight font-normal tracking-[-0.02em]">
            Visit report
          </h2>
          <VisitForm action={partnerComplete.bind(null, b.id)} homeId={home.id} checklist={job.checklist} variant="partner" submitLabel="Send the report" />
        </section>
      ) : null}

      <p className="text-[13px] text-muted">The partner and the family are fictional. Bookings are simulated.</p>
    </div>
  );
}
