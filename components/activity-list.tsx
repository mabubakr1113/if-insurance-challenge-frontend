import Link from 'next/link';
import type { Activity } from '@/lib/contract';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { link } from './styles';

/** Activity lines: who, what, when; links to the visit, task or booking when there is one. */
export function ActivityList({ items, homeId, absolute = false }: { items: Activity[]; homeId: string; absolute?: boolean }) {
  if (!items.length) return <p className="text-sm text-muted">Nothing yet.</p>;
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map((a) => {
        const href = a.visitId
          ? `/homes/${homeId}/visits/${a.visitId}`
          : a.bookingId
            ? `/homes/${homeId}/help/${a.bookingId}`
            : a.taskId
              ? `/homes/${homeId}/tasks/${a.taskId}`
              : null;
        return (
          <li key={a.id} className="flex flex-col gap-0.5 py-2 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <p>
              {href ? (
                <Link href={href} className={link}>
                  {a.message}
                </Link>
              ) : (
                a.message
              )}
              <span className="text-muted"> · {a.actorLabel}</span>
            </p>
            <time dateTime={a.createdAt} className="shrink-0 text-muted" title={fmtDateTime(a.createdAt)}>
              {absolute ? fmtDateTime(a.createdAt) : fmtRelative(a.createdAt)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
