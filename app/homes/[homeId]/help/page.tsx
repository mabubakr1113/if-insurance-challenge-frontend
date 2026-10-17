import type { Metadata } from 'next';
import Link from 'next/link';
import { createBooking } from '@/app/actions/bookings';
import { PastVisitsCard } from '@/components/booking-bits';
import { BookingForm } from '@/components/booking-form';
import { Icon } from '@/components/icons';
import { link } from '@/components/styles';
import { Notice, PageHeader } from '@/components/ui';
import type { Booking, BookingOptions, BookingStatus, PackageKey } from '@/lib/contract';
import { fmtSlot } from '@/lib/format';
import { canHelp, getHome, getMembers, isClosed, read, requireMember } from '@/lib/guards';
import { BOOKING_STATUS, firstName } from '@/lib/labels';

export const metadata: Metadata = { title: 'Book a local visit' };

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
    <Notice
      tone="info"
      role="status"
      action={
        <Link href={`${base}/help/${active.id}`} className={link}>
          See the visit
        </Link>
      }
    >
      There’s already a visit {BOOKING_STATUS[active.status].toLowerCase()} for {fmtSlot(active.slotStart, active.slotEnd)}.
    </Notice>
  ) : null;

  if (isClosed(home) || !canHelp(me.member)) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Book a local visit" intro={INTRO} />
        <Notice tone="neutral">
          {isClosed(home) ? 'This plan is closed, so no new visits can be booked.' : `Viewers can read and comment. Ask ${coordinatorName} to book a visit.`}
        </Notice>
        {activeNotice}
        <div className="max-w-[420px]">
          <PastVisitsCard bookings={bookings} homeId={homeId} />
        </div>
      </div>
    );
  }

  const options = await read<BookingOptions>(`/api/homes/${homeId}/booking-options${taskId ? `?taskId=${encodeURIComponent(taskId)}` : ''}`);
  const task = options.task;
  const defaultPackage: PackageKey = task?.priority === 'urgent' && options.slots.urgent.length ? 'urgent' : 'check';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Book a local visit" intro={INTRO} />
      {activeNotice}
      <BookingForm
        options={options}
        defaultPackage={defaultPackage}
        action={createBooking.bind(null, homeId, task?.id ?? null, options.canApprove)}
        taskChip={
          task ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted">For the task</span>
                <span className="text-[15px] font-semibold">{task.title}</span>
              </span>
              <Link
                href={`${base}/help`}
                aria-label="Book without linking this task"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-hover-btn hover:text-ink"
              >
                <Icon name="close" size={16} strokeWidth={2} />
              </Link>
            </div>
          ) : null
        }
        railExtra={<PastVisitsCard bookings={bookings} homeId={homeId} />}
      />
    </div>
  );
}
