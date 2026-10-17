import type { Metadata } from 'next';
import Link from 'next/link';
import { approveBooking, cancelBooking } from '@/app/actions/bookings';
import { ActivityList } from '@/components/activity-list';
import { AutoRefresh } from '@/components/auto-refresh';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from '@/components/forms';
import { input, link } from '@/components/styles';
import { Badge, Card, Facts, SimLabel } from '@/components/ui';
import type { BookingDetail, BookingStatus } from '@/lib/contract';
import { fmtCount, fmtDateTime, fmtMoney, fmtSlot, fmtTemp } from '@/lib/format';
import { getMembers, read, requireMember } from '@/lib/guards';
import { ACCESS_METHOD, BOOKING_STATUS, bookingText } from '@/lib/labels';

export const metadata: Metadata = { title: 'Local visit' };

const LIVE: BookingStatus[] = ['pending_approval', 'requested', 'confirmed', 'in_progress'];

export default async function BookingPage({ params }: PageProps<'/homes/[homeId]/help/[bookingId]'>) {
  const { homeId, bookingId } = await params;
  await requireMember(homeId);
  const [detail, members] = await Promise.all([read<BookingDetail>(`/api/bookings/${bookingId}`), getMembers(homeId)]);
  const { booking: b, visit } = detail;
  const base = `/homes/${homeId}`;
  const approvers = members.filter((m) => m.canAuthorise && m.role !== 'viewer' && m.status === 'joined').map((m) => ({ id: m.id, name: m.name }));
  const timeline = [...detail.timeline].sort((x, y) => x.createdAt.localeCompare(y.createdAt));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {LIVE.includes(b.status) ? <AutoRefresh seconds={10} /> : null}
      <div>
        <p className="text-sm">
          <Link href={`${base}/help`} className={link}>
            Local visits
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{b.package.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-lg">
          <Badge tone={b.status === 'completed' ? 'ok' : b.status === 'cancelled' || b.status === 'declined' ? 'neutral' : 'accent'}>{BOOKING_STATUS[b.status]}</Badge>
          {bookingText(b, approvers)}
        </p>
      </div>

      {detail.canApprove || detail.canCancel ? (
        <div className="flex flex-col gap-3">
          {detail.canApprove ? (
            <ActionForm action={approveBooking.bind(null, b.id)}>
              <SubmitButton pendingText="Approving…">Approve</SubmitButton>
              <p className="mt-1 text-sm text-muted">By approving you confirm you can authorise access to the home for this visit.</p>
            </ActionForm>
          ) : null}
          {detail.canCancel ? (
            <ActionForm action={cancelBooking.bind(null, b.id)}>
              <ConfirmSubmit label="Cancel visit" confirmLabel="Yes, cancel the visit">
                <Field label="Reason" name="reason">
                  <input id="reason" name="reason" className={input} required maxLength={1000} />
                </Field>
              </ConfirmSubmit>
            </ActionForm>
          ) : null}
        </div>
      ) : null}

      {b.status === 'completed' && visit ? (
        <Card title="Report">
          <p>
            {visit.indoorTempC !== null ? `${fmtTemp(visit.indoorTempC)} inside · ` : ''}
            {visit.okCount} OK · {fmtCount(visit.concernCount, 'concern')}
            {visit.followUpTasks.length ? ` · ${fmtCount(visit.followUpTasks.length, 'follow-up')} added to the plan` : ''}
          </p>
          <p className="mt-2">
            <Link href={`${base}/visits/${visit.id}`} className={link}>
              Read the full report
            </Link>
          </p>
        </Card>
      ) : null}

      <Card title="Details">
        <Facts
          items={[
            ['Visit', `${b.package.name} (${b.package.durationMin} min)`],
            ['Includes', <ul key="i" className="list-disc pl-5">{b.package.includes.map((i) => <li key={i}>{i}</li>)}</ul>],
            ['Time', fmtSlot(b.slotStart, b.slotEnd)],
            [
              'Partner',
              <span key="p">
                {b.partner.name}, {b.partner.area}
                {b.partner.phone ? ` · ${b.partner.phone}` : ''} <SimLabel>Fictional partner</SimLabel>
              </span>,
            ],
            ['Access', `${ACCESS_METHOD[b.accessMethod]}${b.accessDetails ? `. ${b.accessDetails}` : ''}`],
            ['Notes', b.notes],
            [
              'Task',
              b.taskId ? (
                <Link key="t" href={`${base}/tasks/${b.taskId}`} className={link}>
                  {b.taskTitle ?? 'The linked task'}
                </Link>
              ) : null,
            ],
            [
              'Total',
              `${fmtMoney(b.package.totalCents)} (${fmtMoney(b.package.partnerPriceCents)} to the partner + ${fmtMoney(b.package.ifFeeCents)} If coordination fee)`,
            ],
            ['Requested', b.requestedBy ? `by ${b.requestedBy.name} on ${fmtDateTime(b.createdAt)}` : fmtDateTime(b.createdAt)],
            ['Approved', b.approvedBy && b.approvedAt ? `by ${b.approvedBy.name} on ${fmtDateTime(b.approvedAt)}` : null],
          ]}
        />
        <p className="mt-3 text-sm text-muted">Prototype price, not a quote. Booking is simulated. No payment is taken.</p>
      </Card>

      <Card title="Timeline">
        <ActivityList items={timeline} homeId={homeId} absolute />
      </Card>

      <p className="text-sm text-muted">Partner responses are simulated in this demo.</p>
    </div>
  );
}
