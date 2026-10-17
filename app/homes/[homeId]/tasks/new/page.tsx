import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createTask } from '@/app/actions/tasks';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { RadioGroup } from '@/components/radio-group';
import { input, select, textarea } from '@/components/styles';
import { Card, PageHeader } from '@/components/ui';
import { localInputInDays } from '@/lib/format';
import { canHelp, getHome, getMembers, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { CATEGORY, options, PRIORITY } from '@/lib/labels';

export const metadata: Metadata = { title: 'New task' };

export default async function NewTaskPage({ params }: PageProps<'/homes/[homeId]/tasks/new'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  const [home, members] = await Promise.all([getHome(homeId), getMembers(homeId)]);
  if (!canHelp(me.member) || isClosed(home)) redirect(`/homes/${homeId}/plan`);
  const coordinator = isCoordinator(me.member);
  const owners = coordinator ? members.filter((m) => m.role !== 'viewer') : members.filter((m) => m.id === me.member.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add a task" />
      <Card>
        <ActionForm action={createTask.bind(null, homeId)} className="flex flex-col gap-5">
          <Field label="Title" name="title">
            <input id="title" name="title" className={input} required maxLength={120} />
          </Field>
          <Field label="Why it matters" name="why" optional>
            <textarea id="why" name="why" className={textarea} maxLength={2000} />
          </Field>
          <Field label="Category" name="category">
            <select id="category" name="category" className={select} required defaultValue="other">
              {options(CATEGORY).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <RadioGroup
            legend="Priority"
            name="priority"
            defaultValue="normal"
            columns
            choices={(['normal', 'high', 'urgent'] as const).map((p) => ({ value: p, label: PRIORITY[p] }))}
          />
          <Field label="Due" name="dueAt" hint="Helsinki time.">
            <input id="dueAt" name="dueAt" type="datetime-local" className={input} defaultValue={localInputInDays(7, '18:00')} />
          </Field>
          <Field label="Owner" name="assigneeId">
            <select id="assigneeId" name="assigneeId" className={select} defaultValue="">
              <option value="">Nobody yet</option>
              {owners.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id === me.member.id ? `Me (${m.name})` : `${m.name}${m.status === 'invited' ? ' (invited)' : ''}`}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <SubmitButton pendingText="Adding…">Add task</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
