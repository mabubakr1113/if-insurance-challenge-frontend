import type { Metadata } from 'next';
import Link from 'next/link';
import { partnerAccept, partnerComplete, partnerDecline, partnerStart } from '@/app/actions/partner';
import { AutoRefresh } from '@/components/auto-refresh';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { PhotoGrid } from '@/components/photo-grid';
import { input, link } from '@/components/styles';
import { Badge, Card, Facts, Notice, SimLabel } from '@/components/ui';
import { VisitForm } from '@/components/visit-form';
import type { BookingStatus, PartnerJobDetail, Visit } from '@/lib/contract';
import { fmtCount, fmtMoney, fmtSlot, fmtTemp } from '@/lib/format';
import { read, requirePartner } from '@/lib/guards';
import { ACCESS_METHOD, BOOKING_STATUS } from '@/lib/labels';

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {b.status === 'requested' ? <AutoRefresh seconds={10} /> : null}
      <div>
        <p className="text-sm">
          <Link href="/partner" className={link}>
            All jobs
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {home.addressLine}, {home.postalCode} {home.city}
        </h1>
        {home.estateName ? <p className="text-muted">Estate of {home.estateName}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={b.status === 'completed' ? 'ok' : b.status === 'requested' ? 'attention' : 'accent'}>{BOOKING_STATUS[b.status]}</Badge>
          {STATUS_TEXT[b.status]}
        </p>
      </div>

      <Card title="The visit">
        <Facts
          items={[
            ['Time', fmtSlot(b.slotStart, b.slotEnd)],
            ['Visit', `${b.package.name} (${b.package.durationMin} min)`],
            ['Includes', <ul key="i" className="list-disc pl-5">{b.package.includes.map((i) => <li key={i}>{i}</li>)}</ul>],
            ['Task', b.taskTitle],
            ['Notes from the family', b.notes],
          ]}
        />
        <p className="mt-3">
          You’re paid {fmtMoney(b.package.partnerPriceCents)}. If’s coordination fee is charged to the family separately. <SimLabel>Prototype price, not a quote</SimLabel>
        </p>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Access">
          <Facts
            items={[
              ['Method', ACCESS_METHOD[b.accessMethod]],
              ['Details', b.accessDetails],
              ['Key holder', job.keyHolder],
              ['Access notes', job.accessNotes],
            ]}
          />
        </Card>
        <Card title="Contact">
          {job.coordinator ? (
            <p>
              {job.coordinator.name}
              {job.coordinator.phone ? (
                <>
                  {' · '}
                  <a href={`tel:${job.coordinator.phone.replace(/\s/g, '')}`} className={link}>
                    {job.coordinator.phone}
                  </a>
                </>
              ) : null}
            </p>
          ) : (
            <p className="text-muted">No contact given.</p>
          )}
          <p className="mt-2 text-sm text-muted">The family coordinator. Fictional person.</p>
        </Card>
      </div>

      <Card title="House essentials">
        {job.essentials.length ? (
          <ul className="flex flex-col gap-4">
            {job.essentials.map((n) => (
              <li key={n.id}>
                <p className="font-medium">{n.title}</p>
                {n.body ? <p className="whitespace-pre-line text-sm">{n.body}</p> : null}
                {n.photos.length ? (
                  <div className="mt-2">
                    <PhotoGrid photos={n.photos} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">The family hasn’t added house essentials yet.</p>
        )}
      </Card>

      {b.status === 'requested' ? (
        <Card title="Respond">
          <div className="flex flex-col gap-4">
            <ActionForm action={partnerAccept.bind(null, b.id)}>
              <SubmitButton pendingText="Accepting…">Accept</SubmitButton>
            </ActionForm>
            <ActionForm action={partnerDecline.bind(null, b.id)} className="flex flex-col gap-3 border-t border-line pt-4">
              <Field label="Reason for declining" name="reason">
                <input id="reason" name="reason" className={input} required maxLength={1000} />
              </Field>
              <div>
                <SubmitButton variant="secondary" pendingText="Declining…">
                  Decline
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
        </Card>
      ) : null}

      {b.status === 'confirmed' ? (
        <ActionForm action={partnerStart.bind(null, b.id)}>
          <SubmitButton pendingText="Starting…">Start visit</SubmitButton>
        </ActionForm>
      ) : null}

      {canReport ? (
        <Card title="Visit report">
          <VisitForm action={partnerComplete.bind(null, b.id)} homeId={home.id} checklist={job.checklist} variant="partner" submitLabel="Complete visit" />
        </Card>
      ) : null}

      {visit ? (
        <Notice tone="ok" title="Report sent">
          {visit.indoorTempC !== null ? `${fmtTemp(visit.indoorTempC)} inside · ` : ''}
          {visit.okCount} OK · {fmtCount(visit.concernCount, 'concern')} · {fmtCount(visit.photos.length, 'photo')}
        </Notice>
      ) : null}

      <p className="text-sm text-muted">The partner and the family are fictional. Bookings are simulated.</p>
    </div>
  );
}
