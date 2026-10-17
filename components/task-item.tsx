import Link from 'next/link';
import { acceptTask } from '@/app/actions/tasks';
import type { Task } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtOverdue } from '@/lib/format';
import type { FollowUpOrigin } from '@/lib/home-data';
import { CATEGORY, firstName } from '@/lib/labels';
import { ActionForm, SubmitButton } from './forms';
import { btnSecondary, btnSmall, link } from './styles';
import { Badge } from './ui';

/** Why a task is listed under "Needs attention". */
export function attentionReason(t: Task): string {
  if (t.needsOwner) return 'Nobody has taken this yet';
  if (t.isOverdue && t.dueAt) return fmtOverdue(t.dueAt);
  if (t.priority === 'urgent') return t.dueAt ? `Urgent, due ${fmtDateTime(t.dueAt)}` : 'Urgent';
  return t.dueAt ? `Due ${fmtDateTime(t.dueAt)}` : 'Open';
}

/** "Due Tue 21 Oct, 18:00" · "3 days overdue" · "Done Mon 20 Oct by Mikko" · "Cancelled" */
export function dueText(t: Task): string | null {
  if (t.status === 'done') return `Done${t.completedAt ? ` ${fmtDate(t.completedAt)}` : ''}${t.completedByLabel ? ` by ${firstName(t.completedByLabel)}` : ''}`;
  if (t.status === 'cancelled') return 'Cancelled';
  if (t.isOverdue && t.dueAt) return fmtOverdue(t.dueAt);
  return t.dueAt ? `Due ${fmtDateTime(t.dueAt)}` : null;
}

const WEATHER_ORIGIN: Record<string, string> = {
  heating_check: 'From the cold-night forecast',
  storm_check: 'From the storm forecast',
  roof_snow_check: 'From the heavy-snow forecast',
};

export function originHint(t: Task, origin?: FollowUpOrigin): string | null {
  if (t.origin === 'weather') return (t.templateKey && WEATHER_ORIGIN[t.templateKey]) || 'From the forecast';
  if (t.origin === 'visit_concern') return origin ? `From ${firstName(origin.visitorName)}’s visit` : 'From a visit';
  return null;
}

/** Short source, e.g. "If terms §5.5". */
export const shortSource = (t: Task) => t.source?.label ?? null;

export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  if (priority === 'urgent') return <Badge tone="attention">Urgent</Badge>;
  if (priority === 'high') return <Badge tone="accent">High</Badge>;
  return null;
}

/**
 * One task in a list. `variant="attention"` (overview) leads with why it's listed;
 * `variant="plan"` shows every detail of 8.P8.
 */
export function TaskItem({
  task: t,
  homeId,
  variant,
  canAccept,
  canRequestVisit,
  bookingSlot,
  origin,
}: {
  task: Task;
  homeId: string;
  variant: 'attention' | 'plan';
  canAccept: boolean;
  canRequestVisit: boolean;
  bookingSlot?: string | null;
  origin?: FollowUpOrigin;
}) {
  const href = `/homes/${homeId}/tasks/${t.id}`;
  const active = t.status === 'open' || t.status === 'accepted';
  const owner = t.assignee ? t.assignee.name : active ? 'Nobody yet' : null;
  const lines: (string | null)[] =
    variant === 'plan'
      ? [
          shortSource(t),
          t.recurrenceDays ? `Repeats every ${t.recurrenceDays} days` : null,
          t.declinedBy.length ? `Can’t do it: ${t.declinedBy.map((p) => firstName(p.name)).join(', ')}` : null,
          originHint(t, origin),
        ]
      : [];
  const urgentLine = variant === 'attention' ? attentionReason(t) : dueText(t);
  const urgentTone = t.needsOwner || t.isOverdue;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link href={href} className={`${link} text-base font-semibold`}>
          {t.title}
        </Link>
        <span className="flex flex-wrap gap-1.5">
          <PriorityBadge priority={t.priority} />
          {variant === 'plan' ? <Badge>{CATEGORY[t.category]}</Badge> : null}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 text-sm">
        {urgentLine ? <p className={urgentTone ? 'font-medium text-attention' : 'text-muted'}>{urgentLine}</p> : null}
        {owner ? (
          <p>
            <span className="text-muted">Owner:</span> {owner}
          </p>
        ) : null}
        {t.needsInfo ? <p className="text-attention">Not confirmed: {t.needsInfo}</p> : null}
        {t.bookingId ? <p className="text-accent">{bookingSlot ? `Local visit booked for ${bookingSlot}` : 'Local visit booked'}</p> : null}
        {lines.filter(Boolean).map((l) => (
          <p key={l} className="text-muted">
            {l}
          </p>
        ))}
      </div>
      {active && (canAccept || canRequestVisit) ? (
        <div className="flex flex-wrap items-start gap-2 pt-1">
          {canAccept && t.status === 'open' ? (
            <ActionForm action={acceptTask.bind(null, t.id)} showMessage>
              <SubmitButton className={btnSmall} pendingText="Saving…">
                I’ll do it
              </SubmitButton>
            </ActionForm>
          ) : null}
          {canRequestVisit && t.needsOwner && !t.bookingId ? (
            <Link href={`/homes/${homeId}/help?taskId=${t.id}`} className={`${btnSecondary} ${btnSmall}`}>
              Request a local visit
            </Link>
          ) : null}
          <Link href={href} className={`${btnSecondary} ${btnSmall}`}>
            Open
          </Link>
        </div>
      ) : null}
    </li>
  );
}
