import type { Metadata } from 'next';
import Link from 'next/link';
import { acceptTask, assignTask, cancelTask, commentOnTask, completeTask, declineTask, editTask, reopenTask } from '@/app/actions/tasks';
import { ActivityList } from '@/components/activity-list';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from '@/components/forms';
import { PhotoGrid } from '@/components/photo-grid';
import { PhotoPicker } from '@/components/photo-picker';
import { RadioGroup } from '@/components/radio-group';
import { btnSecondary, input, link, select, textarea } from '@/components/styles';
import { PriorityBadge } from '@/components/task-item';
import { Badge, Card, Notice } from '@/components/ui';
import type { TaskDetail } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtOverdue, fmtSlot, toLocalInput } from '@/lib/format';
import { canHelp, getHome, getMembers, isClosed, isCoordinator, read, requireMember } from '@/lib/guards';
import { followUpOrigins, getWeather } from '@/lib/home-data';
import { BOOKING_STATUS, bookingText, CATEGORY, firstName, PRIORITY, taskHeadline } from '@/lib/labels';

export const metadata: Metadata = { title: 'Task' };

export default async function TaskPage({ params }: PageProps<'/homes/[homeId]/tasks/[taskId]'>) {
  const { homeId, taskId } = await params;
  const me = await requireMember(homeId);
  const [detail, home, members] = await Promise.all([read<TaskDetail>(`/api/tasks/${taskId}`), getHome(homeId), getMembers(homeId)]);
  const { task: t, booking } = detail;
  const base = `/homes/${homeId}`;
  const closed = isClosed(home);
  const helper = canHelp(me.member) && !closed;
  const coordinator = isCoordinator(me.member) && !closed;
  const active = t.status === 'open' || t.status === 'accepted';
  const mine = t.assignee?.id === me.member.id;
  const coordinatorName = firstName(members.find((m) => m.role === 'coordinator')?.name ?? 'the coordinator');

  // Where it came from
  let origin: React.ReactNode = 'Part of the care plan';
  if (t.origin === 'weather') {
    const weather = await getWeather(homeId);
    const alert = [...weather.activeAlerts, ...weather.recentAlerts].find((a) => a.taskId === t.id);
    origin = `Added because of the forecast for ${fmtDate(alert?.forDate ?? t.createdAt)}`;
  } else if (t.origin === 'visit_concern') {
    const from = (await followUpOrigins(homeId)).get(t.id);
    origin = from ? (
      <>
        Follow-up from{' '}
        <Link href={`${base}/visits/${from.visitId}`} className={link}>
          {firstName(from.visitorName)}’s visit on {fmtDate(from.visitedAt)}
        </Link>
      </>
    ) : (
      'Follow-up from a visit'
    );
  } else if (t.origin === 'manual') {
    const created = detail.activity.find((a) => a.type === 'task_created');
    origin = `Added by ${created?.actorLabel ?? 'a family member'}`;
  }

  const activity = [...detail.activity].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Invited members can be given tasks before they join (the demo assigns Mikko right after inviting him).
  const assignable = isCoordinator(me.member) ? members.filter((m) => m.role !== 'viewer') : [me.member];

  const taskActions = (
    <div className="flex flex-wrap items-start gap-2">
      {t.status === 'open' ? (
        <ActionForm action={acceptTask.bind(null, t.id)}>
          <SubmitButton pendingText="Saving…">I’ll do it</SubmitButton>
        </ActionForm>
      ) : null}
      <a href="#complete" className={btnSecondary}>
        Mark as done
      </a>
      {!t.bookingId && t.status === 'open' ? (
        <Link href={`${base}/help?taskId=${t.id}`} className={btnSecondary}>
          Request a local visit
        </Link>
      ) : null}
      {mine ? <span className="self-center text-sm text-muted">You’re on it.</span> : null}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="text-sm">
          <Link href={`${base}/plan`} className={link}>
            Care plan
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
        <p className={`mt-2 text-lg ${t.needsOwner || t.isOverdue ? 'font-medium text-attention' : ''}`}>{taskHeadline(t)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <PriorityBadge priority={t.priority} />
          {t.priority === 'normal' ? <Badge>{PRIORITY.normal} priority</Badge> : null}
          <Badge>{CATEGORY[t.category]}</Badge>
          {t.isOverdue && t.dueAt ? <Badge tone="attention">{fmtOverdue(t.dueAt)}</Badge> : null}
        </div>
      </div>

      {active && helper ? taskActions : null}

      <Card title="Why it matters">
        <p>{t.why ?? 'No reason written down.'}</p>
        {t.needsInfo ? <p className="mt-3 text-attention">Not confirmed: {t.needsInfo}</p> : null}
      </Card>

      {t.how.length ? (
        <Card title="How to do it">
          <ol className="flex list-decimal flex-col gap-1.5 pl-5">
            {t.how.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card title="Details">
        <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
          {t.source ? (
            <>
              <dt className="text-muted">Source</dt>
              <dd>
                {t.source.url ? (
                  <a href={t.source.url} className={link} target="_blank" rel="noreferrer">
                    {t.source.label}
                  </a>
                ) : (
                  t.source.label
                )}
                <span className="block text-muted">Check the terms version on your own policy.</span>
              </dd>
            </>
          ) : null}
          <dt className="text-muted">Where it came from</dt>
          <dd>{origin}</dd>
          {t.recurrenceDays ? (
            <>
              <dt className="text-muted">Repeats</dt>
              <dd>Repeats every {t.recurrenceDays} days; the next one is created when this is done.</dd>
            </>
          ) : null}
          {t.declinedBy.length ? (
            <>
              <dt className="text-muted">Can’t do it</dt>
              <dd>{t.declinedBy.map((p) => p.name).join(', ')}</dd>
            </>
          ) : null}
        </dl>
      </Card>

      {booking ? (
        <Card title="Local visit">
          <p className="font-medium">
            {booking.package.name} · {fmtSlot(booking.slotStart, booking.slotEnd)}
          </p>
          <p className="mt-1">
            <Badge tone="accent">{BOOKING_STATUS[booking.status]}</Badge> {bookingText(booking)}
          </p>
          <p className="mt-2">
            <Link href={`${base}/help/${booking.id}`} className={link}>
              See the visit
            </Link>
          </p>
        </Card>
      ) : null}

      {t.status === 'done' ? (
        <Card title="Completed">
          <p>
            Done by {t.completedByLabel ?? 'someone'}
            {t.completedAt ? ` on ${fmtDateTime(t.completedAt)}` : ''}.
          </p>
          {t.completionNote ? <p className="mt-2">{t.completionNote}</p> : null}
          {detail.photos.length ? (
            <div className="mt-3">
              <PhotoGrid photos={detail.photos} />
            </div>
          ) : null}
          {helper ? (
            <ActionForm action={reopenTask.bind(null, t.id)} className="mt-4">
              <SubmitButton variant="secondary" pendingText="Reopening…">
                Reopen
              </SubmitButton>
            </ActionForm>
          ) : null}
        </Card>
      ) : null}

      {active && helper ? (
        <>
          <Card title="Mark as done" id="complete">
            <ActionForm action={completeTask.bind(null, t.id)} className="flex flex-col gap-4">
              <Field label="Note" name="note" optional>
                <textarea id="note" name="note" className={textarea} maxLength={2000} placeholder="What did you do or see?" />
              </Field>
              <PhotoPicker homeId={homeId} />
              <div>
                <SubmitButton pendingText="Saving…">Mark as done</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card title="Assign to…">
              <ActionForm action={assignTask.bind(null, t.id)} className="flex flex-col gap-3">
                <Field label="Owner" name="memberId">
                  <select id="memberId" name="memberId" className={select} defaultValue={t.assignee?.id ?? ''}>
                    <option value="">Nobody</option>
                    {assignable.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id === me.member.id ? `Me (${m.name})` : `${m.name}${m.status === 'invited' ? ' (invited)' : ''}`}
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <SubmitButton variant="secondary" pendingText="Saving…">
                    Save owner
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>

            <Card title="I can’t do it">
              <ActionForm action={declineTask.bind(null, t.id)} className="flex flex-col gap-3">
                <Field label="Reason" name="reason" hint="For example: I’m abroad until November.">
                  <input id="reason" name="reason" className={input} required maxLength={1000} />
                </Field>
                <div>
                  <SubmitButton variant="secondary" pendingText="Sending…">
                    I can’t do it
                  </SubmitButton>
                </div>
              </ActionForm>
            </Card>
          </div>
        </>
      ) : null}

      {!helper && !closed ? (
        <Notice>Viewers can read and comment. Ask {coordinatorName} to change your role.</Notice>
      ) : null}

      {coordinator && detail.canEdit && active ? (
        <Card title="Edit">
          <ActionForm action={editTask.bind(null, t.id)} className="flex flex-col gap-4">
            <Field label="Title" name="title">
              <input id="title" name="title" className={input} defaultValue={t.title} required maxLength={120} />
            </Field>
            <Field label="Why it matters" name="why" optional>
              <textarea id="why" name="why" className={textarea} defaultValue={t.why ?? ''} maxLength={2000} />
            </Field>
            <RadioGroup
              legend="Priority"
              name="priority"
              columns
              defaultValue={t.priority}
              choices={(['normal', 'high', 'urgent'] as const).map((p) => ({ value: p, label: PRIORITY[p] }))}
            />
            <Field label="Due" name="dueAt" hint="Helsinki time. Leave empty for no due date.">
              <input id="dueAt" name="dueAt" type="datetime-local" className={input} defaultValue={t.dueAt ? toLocalInput(t.dueAt) : ''} />
            </Field>
            <div>
              <SubmitButton variant="secondary" pendingText="Saving…">
                Save changes
              </SubmitButton>
            </div>
          </ActionForm>
          <ActionForm action={cancelTask.bind(null, t.id)} className="mt-6 border-t border-line pt-4">
            <ConfirmSubmit label="Cancel task" confirmLabel="Yes, cancel the task">
              The task is closed without being done. It stays in the record.
            </ConfirmSubmit>
          </ActionForm>
        </Card>
      ) : null}

      <Card title="Activity">
        <ActivityList items={activity} homeId={homeId} absolute />
        <ActionForm action={commentOnTask.bind(null, t.id)} resetOnSuccess className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <Field label="Comment" name="body">
            <textarea id="body" name="body" className={textarea} required maxLength={2000} />
          </Field>
          <div>
            <SubmitButton variant="secondary" pendingText="Sending…">
              Comment
            </SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
