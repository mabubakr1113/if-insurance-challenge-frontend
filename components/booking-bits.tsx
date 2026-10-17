import Link from 'next/link';
import type { Booking, BookingStatus } from '@/lib/contract';
import { fmtSlot } from '@/lib/format';
import { BOOKING_STATUS } from '@/lib/labels';
import { Badge, Card, type Tone } from './ui';

/** Done is green, waiting is amber, cancelled is neutral, everything in between is plum. */
export function bookingTone(status: BookingStatus): Tone {
  if (status === 'completed') return 'ok';
  if (status === 'cancelled' || status === 'declined') return 'neutral';
  if (status === 'pending_approval' || status === 'requested') return 'attention';
  return 'accent';
}

export function BookingBadge({ status, size = 'sm' }: { status: BookingStatus; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={bookingTone(status)} size={size}>
      {BOOKING_STATUS[status]}
    </Badge>
  );
}

/** Rail card on the local-visit page. */
export function PastVisitsCard({ bookings, homeId }: { bookings: Booking[]; homeId: string }) {
  if (!bookings.length) return null;
  return (
    <Card title="Past and current visits" className="gap-1">
      <ul className="mt-1.5 flex flex-col">
        {bookings.map((b) => (
          <li key={b.id}>
            <Link
              href={`/homes/${homeId}/help/${b.id}`}
              className="flex items-center justify-between gap-2.5 border-t border-line-soft py-2.5 text-ink hover:text-accent-text"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold">{b.package.name}</span>
                <span className="text-xs text-muted">{fmtSlot(b.slotStart, b.slotEnd)}</span>
              </span>
              <BookingBadge status={b.status} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
