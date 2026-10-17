/* eslint-disable @next/next/no-img-element -- signed URLs expire after 60 minutes (5.4) */
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { acceptTask, assignTask, cancelTask, commentOnTask, completeTask, declineTask, editTask, reopenTask } from '@/app/actions/tasks';
import { ActivityFeed } from '@/components/activity-list';
import { Dialog, DialogActions, DialogCancel } from '@/components/dialog';
import { Disclosure } from '@/components/disclosure';
import { ActionForm, AutoSubmitSelect, ConfirmSubmit, Field, FieldError, InvalidWrap, SubmitButton } from '@/components/forms';
import { PhotoPicker } from '@/components/photo-picker';
import { ChipGroup } from '@/components/radio-group';
import { button, eyebrow, h1, input, link, mainCol, railCol, textarea, twoCol } from '@/components/styles';
import { isWarn } from '@/components/task-item';
import { BackLink, ButtonLink, Card, Eyebrow, ListBox, Notice } from '@/components/ui';
import type { TaskDetail } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtOverdue, fmtSlot, toLocalInput } from '@/lib/format';
import { canHelp, getHome, getMembers, isClosed, isCoordinator, read, requireMember } from '@/lib/guards';
import { followUpOrigins, getWeather } from '@/lib/home-data';
import { BOOKING_STATUS, CATEGORY, firstName, PRIORITY, taskHeadline } from '@/lib/labels';

export const metadata: Metadata = { title: 'Task' };

export default async function TaskPage({ params, searchParams }: PageProps<'/homes/[homeId]/tasks/[taskId]'>) {
  const { homeId, taskId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const [detail, home, members] = await Promise.all([read<TaskDetail>(`/api/tasks/${taskId}`), getHome(homeId), getMembers(homeId)]);
  const { task: t, booking } = detail;
  const base = `/homes/${homeId}`;
  const here = `${base}/tasks/${t.id}`;
  const closed = isClosed(home);
  const helper = canHelp(me.member) && !closed;
  const coordinator = isCoordinator(me.member) && !closed;
  const active = t.status === 'open' || t.status === 'accepted';
  const warn = isWarn(t);
  const coordinatorName = firstName(members.find((m) => m.role === 'coordinator')?.name ?? 'the coordinator');
  const completing = helper && active && sp.done === '1';
  const editing = coordinator && detail.canEdit && active && sp.edit === '1';

  // Where it came from
  let origin: ReactNode = 'Part of the care plan';
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
  const assignable = members.filter((m) => m.role !== 'viewer');
  const dueShow =
    t.status === 'done'
      ? `Done${t.completedAt ? ` ${fmtDate(t.completedAt)}` : ''}`
      : t.dueAt
        ? `${fmtDateTime(t.dueAt)}${t.isOverdue ? ` · ${fmtOverdue(t.dueAt)}` : ''}`
        : 'No due date';

  const facts: [string, ReactNode][] = [['Where it came from', origin]];
  if (t.source) {
    facts.push([
      'Source',
      <>
        {t.source.url ? (
          <a href={t.source.url} className={link} target="_blank" rel="noreferrer">
            {t.source.label}
          </a>
        ) : (
          t.source.label
        )}
        . Check the terms version on your own policy.
      </>,
    ]);
  }
  if (booking) {
    facts.push([
      'Local visit',
      <>
        {BOOKING_STATUS[booking.status]} · {fmtSlot(booking.slotStart, booking.slotEnd)}.{' '}
        <Link href={`${base}/help/${booking.id}`} className={link}>
          See the visit
        </Link>
      </>,
    ]);
  }
  if (t.recurrenceDays) facts.push(['Repeats', `Every ${t.recurrenceDays} days. The next one is created when this is done.`]);
  if (t.declinedBy.length) facts.push(['Can’t do it', t.declinedBy.map((p) => p.name).join(', ')]);
  if (t.needsInfo && active) facts.push(['Not confirmed', t.needsInfo]);

  return (
    <div className="flex flex-col gap-[18px]">
      <BackLink href={`${base}/plan`}>Care plan</BackLink>
      <div className={`${twoCol} gap-8`}>
        <div className={`${mainCol} gap-6`}>
          <div className="flex flex-col gap-2.5">
            <h1 className={h1}>{t.title}</h1>
            <p className={`text-base ${warn ? 'font-semibold text-attention' : 'text-ink'}`}>{taskHeadline(t)}</p>
          </div>

          {completing ? (
            <section id="complete" aria-labelledby="complete-title" className="flex flex-col gap-3.5 rounded-2xl border-2 border-ink bg-card p-5">
              <h2 id="complete-title" className="text-[15px] font-semibold">
                Mark as done
              </h2>
              <ActionForm action={completeTask.bind(null, t.id)} className="flex flex-col gap-3.5">
                <label htmlFor="note" className="sr-only">
                  Note
                </label>
                <textarea id="note" name="note" className={textarea} maxLength={2000} placeholder="What did you do or see? (optional)" />
                <PhotoPicker homeId={homeId} showLabel={false} size="sm" />
                <div className="flex gap-2">
                  <SubmitButton pendingText="Saving…">Mark as done</SubmitButton>
                  <Link href={here} scroll={false} className={button('quiet', 'md', 'px-3.5')}>
                    Cancel
                  </Link>
                </div>
              </ActionForm>
            </section>
          ) : null}

          {t.status === 'done' ? (
            <section className="flex flex-col gap-2 rounded-2xl bg-ok-soft px-5 py-4 text-ok-strong">
              <p className="text-[15px] font-semibold">
                Done by {t.completedByLabel ?? 'someone'}
                {t.completedAt ? ` on ${fmtDateTime(t.completedAt)}` : ''}.
              </p>
              {t.completionNote ? <p className="text-sm leading-normal">{t.completionNote}</p> : null}
              {detail.photos.length ? (
                <ul className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]">
                  {detail.photos.map((p) => (
                    <li key={p.id}>
                      <a href={p.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-[10px]">
                        <img src={p.url} alt={p.caption ?? `Photo by ${p.uploadedByLabel}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {helper ? (
                <ActionForm action={reopenTask.bind(null, t.id)}>
                  <SubmitButton variant="secondary" size="sm" pendingText="Reopening…">
                    Reopen
                  </SubmitButton>
                </ActionForm>
              ) : null}
            </section>
          ) : null}

          {!helper && !closed ? <Notice tone="neutral">Viewers can read and comment. Ask {coordinatorName} to change your role.</Notice> : null}

          <section aria-labelledby="why" className="flex flex-col gap-2">
            <Eyebrow as="h2" id="why">
              Why it matters
            </Eyebrow>
            <p className="text-base leading-[1.6]">{t.why ?? 'No reason written down.'}</p>
            {t.needsInfo && active ? <p className="text-sm text-attention">Not confirmed: {t.needsInfo}</p> : null}
          </section>

          {t.how.length ? (
            <Disclosure label={`How to do it · ${t.how.length} ${t.how.length === 1 ? 'step' : 'steps'}`}>
              <ListBox as="ol">
                {t.how.map((step, i) => (
                  <li key={i} className="-mb-px flex items-start gap-3.5 border-b border-line-soft px-[18px] py-3.5">
                    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[15px] leading-normal">{step}</span>
                  </li>
                ))}
              </ListBox>
            </Disclosure>
          ) : null}

          <section aria-labelledby="activity" className="flex flex-col gap-3">
            <Eyebrow as="h2" id="activity">
              Activity
            </Eyebrow>
            <ActivityFeed items={activity} />
            {!closed ? (
              <ActionForm action={commentOnTask.bind(null, t.id)} resetOnSuccess className="flex flex-col gap-1.5">
                <InvalidWrap
                  name="body"
                  className="flex items-center gap-2 rounded-xl border border-line-input bg-white py-1.5 pr-1.5 pl-3.5 focus-within:border-ink focus-within:ring-3 focus-within:ring-accent-soft data-[invalid=true]:border-error-border"
                >
                  <label htmlFor="comment" className="sr-only">
                    Comment
                  </label>
                  <input
                    id="comment"
                    name="body"
                    maxLength={2000}
                    placeholder="Write a comment"
                    autoComplete="off"
                    className="h-[34px] min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink placeholder:text-faint focus:outline-none focus-visible:outline-none"
                  />
                  <SubmitButton size="sm" pendingText="Sending…">
                    Send
                  </SubmitButton>
                </InvalidWrap>
                <FieldError name="body" />
              </ActionForm>
            ) : null}
          </section>
        </div>

        <aside aria-label="Task details" className={railCol}>
          <Card className="gap-3.5">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 text-sm">
              <dt className="text-muted">Owner</dt>
              <dd>
                {coordinator && active ? (
                  <ActionForm action={assignTask.bind(null, t.id)}>
                    <label htmlFor="memberId" className="sr-only">
                      Owner
                    </label>
                    <AutoSubmitSelect
                      id="memberId"
                      name="memberId"
                      defaultValue={t.assignee?.id ?? ''}
                      className="h-9 w-full rounded-lg border border-line-input bg-white px-2 text-sm text-ink focus:border-ink focus:ring-3 focus:ring-accent-soft focus:outline-none"
                    >
                      <option value="">Nobody yet</option>
                      {assignable.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id === me.member.id ? `Me (${m.name})` : `${m.name}${m.status === 'invited' ? ' (invited)' : ''}`}
                        </option>
                      ))}
                    </AutoSubmitSelect>
                  </ActionForm>
                ) : (
                  <span className={`font-semibold ${!t.assignee && active ? 'text-attention' : ''}`}>{t.assignee ? t.assignee.name : active ? 'Nobody yet' : '—'}</span>
                )}
              </dd>
              <dt className="text-muted">Due</dt>
              <dd className={`font-semibold ${warn ? 'text-attention' : ''}`}>{dueShow}</dd>
              <dt className="text-muted">Priority</dt>
              <dd>
                {PRIORITY[t.priority]} · {CATEGORY[t.category]}
              </dd>
            </dl>

            {helper && active ? (
              <div className="flex flex-col gap-2">
                {t.status === 'open' && (!t.assignee || t.assignee.id === me.member.id) ? (
                  <ActionForm action={acceptTask.bind(null, t.id)}>
                    <SubmitButton block pendingText="Saving…">
                      I’ll do it
                    </SubmitButton>
                  </ActionForm>
                ) : null}
                <ButtonLink href={`${here}?done=1`} variant="secondary" className="w-full" scroll={false}>
                  Mark as done
                </ButtonLink>
                {!t.bookingId && (!t.assignee || t.priority === 'urgent') ? (
                  <ButtonLink href={`${base}/help?taskId=${t.id}`} variant="secondary" className="w-full">
                    Book a local visit
                  </ButtonLink>
                ) : null}
                <Dialog
                  title="I can’t do it"
                  description="The family sees your reason, and the task goes back to “Nobody yet”."
                  trigger="I can’t do it"
                  triggerVariant="quiet"
                  triggerSize="sm"
                  triggerClassName="w-full"
                  width={532}
                >
                  <ActionForm action={declineTask.bind(null, t.id)} className="flex flex-col gap-3.5">
                    <Field label={<span className="sr-only">Reason</span>} name="reason">
                      <input id="reason" name="reason" className={input} maxLength={1000} placeholder="For example: I’m abroad until November" />
                    </Field>
                    <DialogActions>
                      <DialogCancel />
                      <SubmitButton pendingText="Sending…">Send</SubmitButton>
                    </DialogActions>
                  </ActionForm>
                </Dialog>
              </div>
            ) : null}

            <dl className="flex flex-col gap-2.5 border-t border-line-soft pt-3.5">
              {facts.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 text-[13px]">
                  <dt className="text-muted">{k}</dt>
                  <dd className="leading-[1.45]">{v}</dd>
                </div>
              ))}
            </dl>

            {coordinator && detail.canEdit && active ? (
              <Link href={`${here}?edit=1`} scroll={false} className={`${eyebrow} self-start hover:text-ink`}>
                Edit the task
              </Link>
            ) : null}
          </Card>
        </aside>
      </div>

      {editing ? (
        <Dialog title="Edit the task" closeHref={here} width="lg">
          <ActionForm action={editTask.bind(null, t.id)} className="flex flex-col gap-3.5">
            <Field label="Title" name="title">
              <input id="title" name="title" className={input} defaultValue={t.title} maxLength={120} />
            </Field>
            <Field label="Why it matters" name="why" hint="Optional">
              <textarea id="why" name="why" className={textarea} defaultValue={t.why ?? ''} maxLength={2000} />
            </Field>
            <ChipGroup
              legend="Priority"
              legendSize="sm"
              name="priority"
              size="sm"
              defaultValue={t.priority}
              choices={(['normal', 'high', 'urgent'] as const).map((p) => ({ value: p, label: PRIORITY[p] }))}
            />
            <Field label="Due" name="dueAt" hint="Helsinki time. Leave empty for no due date.">
              <input id="dueAt" name="dueAt" type="datetime-local" className={input} defaultValue={t.dueAt ? toLocalInput(t.dueAt) : ''} />
            </Field>
            <DialogActions>
              <DialogCancel />
              <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
            </DialogActions>
          </ActionForm>
          <ActionForm action={cancelTask.bind(null, t.id)} className="border-t border-line-soft pt-3.5">
            <ConfirmSubmit
              label="Cancel this task"
              title="Cancel the task?"
              confirmLabel="Yes, cancel the task"
              triggerVariant="dangerQuiet"
              triggerSize="sm"
              pendingText="Cancelling…"
            >
              The task is closed without being done. It stays in the record.
            </ConfirmSubmit>
          </ActionForm>
        </Dialog>
      ) : null}
    </div>
  );
}
