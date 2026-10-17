import Link from 'next/link';
import { acceptTask } from '@/app/actions/tasks';
import type { Task } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtOverdue } from '@/lib/format';
import { firstName } from '@/lib/labels';
import { ActionForm, SubmitButton } from './forms';
import { Icon } from './icons';
import { row, rowHover } from './styles';
import { Badge, StatusDot, type DotTone } from './ui';

const isActive = (t: Task) => t.status === 'open' || t.status === 'accepted';

/** Unowned (and not covered by a booked visit) or overdue: the meta line turns amber. */
export const isWarn = (t: Task) => isActive(t) && ((!t.assignee && !t.bookingId) || t.isOverdue);

/** Why a task is listed under "Needs attention". */
export function attentionReason(t: Task): string {
  const overdue = t.isOverdue && t.dueAt ? fmtOverdue(t.dueAt) : null;
  if (!t.assignee && t.bookingId) return 'A local visit is booked';
  if (!t.assignee) return overdue ? `Nobody has taken this yet · ${overdue}` : 'Nobody has taken this yet';
  if (overdue) return `${firstName(t.assignee.name)} · ${overdue}`;
  return t.dueAt ? `${firstName(t.assignee.name)} · due ${fmtDateTime(t.dueAt)}` : `${firstName(t.assignee.name)} is on it`;
}

/** The one meta line in the care plan: "Nobody yet · due Mon 20 Oct, 18:00" · "Mikko · due Sun 19 Oct, 18:00" · "Done Mon 13 Oct by Mikko" */
export function planMeta(t: Task): string {
  if (t.status === 'done') return `Done${t.completedAt ? ` ${fmtDate(t.completedAt)}` : ''}${t.completedByLabel ? ` by ${firstName(t.completedByLabel)}` : ''}`;
  if (t.status === 'cancelled') return 'Cancelled';
  const when = t.isOverdue && t.dueAt ? fmtOverdue(t.dueAt) : t.dueAt ? `due ${fmtDateTime(t.dueAt)}` : null;
  const who = t.assignee ? firstName(t.assignee.name) : t.bookingId ? 'Local visit booked' : 'Nobody yet';
  return when ? `${who} · ${when}` : who;
}

const WEATHER_ORIGIN: Record<string, string> = {
  heating_check: 'From the cold-night forecast',
  storm_check: 'From the storm forecast',
  roof_snow_check: 'From the heavy-snow forecast',
};

export function originHint(t: Task): string | null {
  if (t.origin === 'weather') return (t.templateKey && WEATHER_ORIGIN[t.templateKey]) || 'From the forecast';
  if (t.origin === 'visit_concern') return 'From a visit';
  return null;
}

export function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  if (priority === 'urgent') return <Badge tone="attention">Urgent</Badge>;
  if (priority === 'high') return <Badge tone="high">High</Badge>;
  return null;
}

export function dotTone(t: Task): DotTone {
  if (t.status === 'done') return 'done';
  if (t.isOverdue) return 'overdue';
  if (t.priority === 'urgent' || (!t.assignee && !t.bookingId)) return 'urgent';
  if (t.priority === 'high') return 'high';
  return 'normal';
}

function CheckCircle({ t }: { t: Task }) {
  const done = t.status === 'done';
  const border = done ? 'border-ok bg-ok' : isWarn(t) ? 'border-sim-line' : 'border-dot-normal';
  return (
    <span aria-hidden="true" className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${border}`}>
      {done ? <Icon name="check" size={11} strokeWidth={3.5} color="#ffffff" /> : null}
    </span>
  );
}

/**
 * One task row inside a list container. The whole row opens the task (a stretched link); "I'll do it" sits
 * above it. `attention` (overview) leads with a status dot and why it's listed; `plan` with a round check.
 */
export function TaskRow({ task: t, homeId, variant, canAccept }: { task: Task; homeId: string; variant: 'attention' | 'plan'; canAccept: boolean }) {
  const done = t.status === 'done' || t.status === 'cancelled';
  const warn = isWarn(t);
  const line = variant === 'attention' ? attentionReason(t) : planMeta(t);
  return (
    <div className={`relative flex flex-wrap items-center gap-x-3.5 gap-y-2.5 px-[18px] ${variant === 'attention' ? 'py-4' : 'py-[15px]'} ${row} ${rowHover}`}>
      {variant === 'attention' ? <StatusDot tone={dotTone(t)} /> : <CheckCircle t={t} />}
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-[3px]">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/homes/${homeId}/tasks/${t.id}`}
            className={`text-[15px] font-semibold after:absolute after:inset-0 after:content-[''] ${done ? 'text-muted line-through' : 'text-ink'}`}
          >
            {t.title}
          </Link>
          <PriorityBadge priority={t.priority} />
        </div>
        <span className={`text-[13px] ${warn ? 'font-semibold text-attention' : 'text-muted'}`}>{line}</span>
      </div>
      {canAccept && t.status === 'open' && !t.assignee ? (
        <div className="relative z-10">
          <ActionForm action={acceptTask.bind(null, t.id)}>
            <SubmitButton size="sm">I’ll do it</SubmitButton>
          </ActionForm>
        </div>
      ) : null}
    </div>
  );
}
