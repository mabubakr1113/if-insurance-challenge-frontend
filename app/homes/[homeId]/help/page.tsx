import type { Metadata } from 'next';
import Link from 'next/link';
import { createBooking } from '@/app/actions/bookings';
import { BookingForm } from '@/components/booking-form';
import { link } from '@/components/styles';
import { attentionReason } from '@/components/task-item';
import { Card, Notice, PageHeader, SimLabel } from '@/components/ui';
import type { Booking, BookingOptions, BookingStatus, PackageKey } from '@/lib/contract';
import { fmtSlot } from '@/lib/format';
import { canHelp, getHome, getMembers, isClosed, read, requireMember } from '@/lib/guards';
import { BOOKING_STATUS, firstName } from '@/lib/labels';

export const metadata: Metadata = { title: 'Request a local visit' };

const FINISHED: BookingStatus[] = ['completed', 'cancelled', 'declined'];
const INTRO = 'A vetted local partner visits, follows the checklist and sends a report with photos.';

export default async function HelpPage({ params, searchParams }: PageProps<'/homes/[homeId]/help'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const taskId = typeof sp.taskId === 'string' && sp.taskId ? sp.taskId : null;
  const [home, members, bookings] = await Promise.all([getHome(homeId), getMembers(homeId), read<Booking[]>(`/api/homes/${homeId}/bookings`)]);
  const base = `/homes/${homeId}`;
  const active = bookings.find((b) => !FINISHED.includes(b.status));
  const coordinatorName = firstName(members.find((m) => m.role === 'coordinator')?.name ?? 'the coordinator');

  const activeNotice = active ? (
    <Notice tone="accent" role="status">
      There’s already a visit {BOOKING_STATUS[active.status].toLowerCase()} for {fmtSlot(active.slotStart, active.slotEnd)}.{' '}
      <Link href={`${base}/help/${active.id}`} className={link}>
        See the visit
      </Link>
    </Notice>
  ) : null;

  const pastList = bookings.length ? (
    <Card title="Local visits">
      <ul className="flex flex-col divide-y divide-line">
        {bookings.map((b) => (
          <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
            <Link href={`${base}/help/${b.id}`} className={link}>
              {b.package.name}, {fmtSlot(b.slotStart, b.slotEnd)}
            </Link>
            <span className="text-sm text-muted">{BOOKING_STATUS[b.status]}</span>
          </li>
        ))}
      </ul>
    </Card>
  ) : null;

  if (isClosed(home) || !canHelp(me.member)) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Local visit" intro={INTRO} />
        {isClosed(home) ? (
          <Notice>This plan is closed, so no new visits can be requested.</Notice>
        ) : (
          <Notice>Ask {coordinatorName} to request a visit. Viewers can read and comment.</Notice>
        )}
        {activeNotice}
        {pastList}
      </div>
    );
  }

  const options = await read<BookingOptions>(`/api/homes/${homeId}/booking-options${taskId ? `?taskId=${encodeURIComponent(taskId)}` : ''}`);
  const task = options.task;
  const defaultPackage: PackageKey = task?.priority === 'urgent' && options.slots.urgent.length ? 'urgent' : 'check';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Request a local visit" intro={INTRO} />
      {task ? (
        <Card>
          <p className="font-semibold">For: {task.title}</p>
          <p className="text-attention">{attentionReason(task)}</p>
        </Card>
      ) : null}
      {activeNotice}
      <p className="text-sm">
        <SimLabel>Fictional partner</SimLabel> {options.partner.name}, {options.partner.area}.
      </p>
      <BookingForm options={options} defaultPackage={defaultPackage} action={createBooking.bind(null, homeId, task?.id ?? null, options.canApprove)} />
      {pastList}
    </div>
  );
}
