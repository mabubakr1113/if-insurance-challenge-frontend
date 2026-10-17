import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { approveBooking, cancelBooking } from '@/app/actions/bookings';
import { completePartnerVisit, simulatePartnerStep } from '@/app/actions/demo';
import { Timeline } from '@/components/activity-list';
import { AutoRefresh } from '@/components/auto-refresh';
import { BookingBadge } from '@/components/booking-bits';
import { Dialog, DialogActions, DialogCancel } from '@/components/dialog';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { h1, input, link, mainCol, railCol, twoCol } from '@/components/styles';
import { ToastOnLoad } from '@/components/toaster';
import { BackLink, ButtonLink, Card, Eyebrow } from '@/components/ui';
import type { BookingDetail, BookingStatus } from '@/lib/contract';
import { fmtCount, fmtDateTime, fmtMoney, fmtSlot, fmtTemp } from '@/lib/format';
import { canHelp, getMembers, read, requireMember } from '@/lib/guards';
import { ACCESS_METHOD, bookingText, firstName, joinNames } from '@/lib/labels';

export const metadata: Metadata = { title: 'Local visit' };

const LIVE: BookingStatus[] = ['pending_approval', 'requested', 'confirmed', 'in_progress'];
const STEPS = ['Requested', 'Sent to partner', 'Confirmed', 'At the house', 'Report ready'];
const STEP_INDEX: Partial<Record<BookingStatus, number>> = { pending_approval: 0, requested: 1, confirmed: 2, in_progress: 3, completed: 4 };

export default async function BookingPage({ params, searchParams }: PageProps<'/homes/[homeId]/help/[bookingId]'>) {
  const { homeId, bookingId } = await params;
  const { new: isNew } = await searchParams;
  const me = await requireMember(homeId);
  const [detail, members] = await Promise.all([read<BookingDetail>(`/api/bookings/${bookingId}`), getMembers(homeId)]);
  const { booking: b, visit } = detail;
  const base = `/homes/${homeId}`;
  const approvers = members.filter((m) => m.canAuthorise && m.role !== 'viewer' && m.status === 'joined').map((m) => ({ id: m.id, name: m.name }));
  const timeline = [...detail.timeline].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  const step = STEP_INDEX[b.status] ?? -1;
  const live = LIVE.includes(b.status);

  const created =
    b.status === 'pending_approval'
      ? `Sent to ${joinNames(approvers.map((a) => firstName(a.name))) || 'the family'} for approval.`
      : `Booked. ${b.partner.name} will confirm shortly.`;

  const facts: [string, ReactNode][] = [
    ['Visit', `${b.package.name} (${b.package.durationMin} min)`],
    ['Time', fmtSlot(b.slotStart, b.slotEnd)],
    ['Partner', `${b.partner.name}, ${b.partner.area}${b.partner.phone ? ` · ${b.partner.phone}` : ''} · fictional partner`],
    ['Access', `${ACCESS_METHOD[b.accessMethod]}${b.accessDetails ? `. ${b.accessDetails}` : ''}`],
  ];
  if (b.notes) facts.push(['Notes', b.notes]);
  if (b.taskId) {
    facts.push([
      'Task',
      <Link key="t" href={`${base}/tasks/${b.taskId}`} className={link}>
        {b.taskTitle ?? 'The linked task'}
      </Link>,
    ]);
  }
  facts.push([
    'Total',
    `${fmtMoney(b.package.totalCents)} (${fmtMoney(b.package.partnerPriceCents)} to the partner + ${fmtMoney(b.package.ifFeeCents)} If coordination fee)`,
  ]);
  facts.push(['Requested', b.requestedBy ? `by ${b.requestedBy.name}, ${fmtDateTime(b.createdAt)}` : fmtDateTime(b.createdAt)]);
  if (b.approvedBy && b.approvedAt) facts.push(['Approved', `by ${b.approvedBy.name}, ${fmtDateTime(b.approvedAt)}`]);
  if (visit) {
    facts.push([
      'Report',
      `${visit.indoorTempC !== null ? `${fmtTemp(visit.indoorTempC)} inside · ` : ''}${visit.okCount} OK · ${fmtCount(visit.concernCount, 'concern')}${
        visit.followUpTasks.length ? ` · ${fmtCount(visit.followUpTasks.length, 'follow-up')}` : ''
      }`,
    ]);
  }

  // Demo only: the partner's next step, clearly marked as simulated.
  const sim = !canHelp(me.member)
    ? null
    : b.status === 'requested'
      ? { label: 'Partner confirms', action: simulatePartnerStep.bind(null, b.id, b.partner.id, 'confirm') }
      : b.status === 'confirmed'
        ? { label: 'Partner arrives', action: simulatePartnerStep.bind(null, b.id, b.partner.id, 'arrive') }
        : b.status === 'in_progress'
          ? { label: 'Partner sends the report', action: completePartnerVisit.bind(null, b.id) }
          : null;

  return (
    <div className="flex flex-col gap-[18px]">
      {live ? <AutoRefresh seconds={10} /> : null}
      {isNew === '1' ? <ToastOnLoad message={created} removeParams={['new']} /> : null}
      <BackLink href={`${base}/help`}>Local visits</BackLink>
      <div className={`${twoCol} gap-7`}>
        <div className={`${mainCol} gap-5`}>
          <div className="flex flex-col gap-2.5">
            <span className="self-start">
              <BookingBadge status={b.status} />
            </span>
            <h1 className={h1}>{b.package.name}</h1>
            <p className="text-base">{bookingText(b, approvers)}</p>
          </div>

          <ol aria-label="Progress" className="grid grid-cols-5 gap-1.5">
            {STEPS.map((label, i) => {
              const done = step >= i;
              return (
                <li key={label} className="flex flex-col gap-1.5" aria-current={step === i ? 'step' : undefined}>
                  <span aria-hidden="true" className={`h-1 rounded-full ${done ? 'bg-ink' : 'bg-step'}`} />
                  <span className={`text-xs font-semibold ${done ? 'text-ink' : 'text-step-text'}`}>{label}</span>
                </li>
              );
            })}
          </ol>

          <section aria-labelledby="timeline" className="flex flex-col gap-3">
            <Eyebrow as="h2" id="timeline">
              Timeline
            </Eyebrow>
            <Timeline items={timeline} />
          </section>
          <p className="text-[13px] text-muted">Partner responses are simulated in this demo. Booking is simulated. No payment is taken.</p>
        </div>

        <aside aria-label="Visit details" className={railCol}>
          <Card className="gap-2">
            {detail.canApprove ? (
              <ActionForm action={approveBooking.bind(null, b.id)} className="flex flex-col gap-1.5">
                <SubmitButton block pendingText="Approving…">
                  Approve
                </SubmitButton>
                <span className="text-xs text-muted">By approving you confirm you can authorise access to the home for this visit.</span>
              </ActionForm>
            ) : null}
            {b.status === 'completed' && visit ? (
              <ButtonLink href={`${base}/visits/${visit.id}`} className="w-full">
                Read the report
              </ButtonLink>
            ) : null}
            {sim ? (
              <ActionForm action={sim.action}>
                <SubmitButton block variant="sim" pendingText="Simulating…">
                  Simulate: {sim.label}
                </SubmitButton>
              </ActionForm>
            ) : null}
            {detail.canCancel ? (
              <Dialog
                title="Cancel the visit?"
                description="The partner is told straight away. There’s no charge in this prototype."
                trigger="Cancel visit"
                triggerVariant="dangerQuiet"
                triggerSize="sm"
                triggerClassName="w-full"
                role="alertdialog"
                width="sm"
              >
                <ActionForm action={cancelBooking.bind(null, b.id)} className="flex flex-col gap-3.5">
                  <Field label="Reason" name="reason">
                    <input id="reason" name="reason" className={input} maxLength={1000} placeholder="Reason, e.g. Mikko can go on Saturday" />
                  </Field>
                  <DialogActions>
                    <DialogCancel>Keep the visit</DialogCancel>
                    <SubmitButton variant="danger" pendingText="Cancelling…">
                      Cancel the visit
                    </SubmitButton>
                  </DialogActions>
                </ActionForm>
              </Dialog>
            ) : null}
            <dl className="flex flex-col gap-2.5 pt-1.5">
              {facts.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 text-[13px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="leading-[1.45]">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
