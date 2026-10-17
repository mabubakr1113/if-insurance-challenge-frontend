import Link from 'next/link';
import type { Activity } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtRelative } from '@/lib/format';
import { firstName } from '@/lib/labels';
import { Avatar } from './ui';

/** Activity messages start with who did it ("Mikko is on …"): bold that part, as in the design. */
export function splitLead(a: Activity): { who: string; what: string } {
  for (const lead of [a.actorLabel, firstName(a.actorLabel)]) {
    if (lead && (a.message.startsWith(`${lead} `) || a.message.startsWith(`${lead}:`))) return { who: lead, what: a.message.slice(lead.length) };
  }
  return { who: '', what: a.message };
}

function Sentence({ a }: { a: Activity }) {
  const { who, what } = splitLead(a);
  return (
    <>
      {who ? <strong className="font-semibold">{who}</strong> : null}
      {what}
      {!who && a.actorLabel ? <span className="text-muted"> · {a.actorLabel}</span> : null}
    </>
  );
}

export const activityHref = (a: Activity, homeId: string) =>
  a.visitId ? `/homes/${homeId}/visits/${a.visitId}` : a.bookingId ? `/homes/${homeId}/help/${a.bookingId}` : a.taskId ? `/homes/${homeId}/tasks/${a.taskId}` : null;

/** Task page: initials, the sentence and a muted time. */
export function ActivityFeed({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="text-sm text-muted">Nothing yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((a) => (
        <li key={a.id} className="flex items-start gap-3 text-sm leading-normal">
          <Avatar name={a.actorLabel} label={a.actorLabel === 'Home Watch' ? 'HW' : undefined} size={28} />
          <span className="flex-1 pt-[3px]">
            <Sentence a={a} />{' '}
            <time dateTime={a.createdAt} title={fmtDateTime(a.createdAt)} className="text-xs text-muted">
              · {fmtRelative(a.createdAt)}
            </time>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Booking status: plum dots, the sentence and the time on the right. */
export function Timeline({ items }: { items: Activity[] }) {
  if (!items.length) return <p className="text-sm text-muted">Nothing yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((a) => (
        <li key={a.id} className="flex items-baseline gap-3 text-sm">
          <span aria-hidden="true" className="size-2 shrink-0 -translate-y-px rounded-full bg-ink" />
          <span className="flex-1">
            <Sentence a={a} />
          </span>
          <time dateTime={a.createdAt} className="shrink-0 text-xs text-muted">
            {fmtDateTime(a.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}

/** Home record: a 96px date column, then the sentence (linked when it points somewhere). */
export function RecordList({ items, homeId }: { items: Activity[]; homeId: string }) {
  if (!items.length) return <p className="text-sm text-muted">Nothing recorded yet.</p>;
  return (
    <ul className="flex flex-col">
      {items.map((a) => {
        const href = activityHref(a, homeId);
        return (
          <li key={a.id} className="flex gap-3 border-b border-skeleton-soft py-[9px] text-sm last:border-0">
            <time dateTime={a.createdAt} title={fmtDateTime(a.createdAt)} className="w-24 shrink-0 text-[13px] text-muted">
              {fmtDate(a.createdAt)}
            </time>
            <span className="min-w-0 flex-1">
              {href ? (
                <Link href={href} className="hover:text-accent-text">
                  <Sentence a={a} />
                </Link>
              ) : (
                <Sentence a={a} />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
