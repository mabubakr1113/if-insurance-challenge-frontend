import { createTask } from '@/app/actions/tasks';
import type { Member } from '@/lib/contract';
import { localInputInDays } from '@/lib/format';
import { CATEGORY, options, PRIORITY } from '@/lib/labels';
import { DialogActions, DialogCancel } from './dialog';
import { ActionForm, Field, SubmitButton } from './forms';
import { ChipGroup } from './radio-group';
import { input, select, textareaBase } from './styles';

/** "Add a task": title, why, priority and category chips, due date and owner. Used in the modal and on /tasks/new. */
export function NewTaskForm({ homeId, owners, meId, inDialog = false }: { homeId: string; owners: Member[]; meId: string; inDialog?: boolean }) {
  return (
    <ActionForm action={createTask.bind(null, homeId)} className="flex flex-col gap-3.5">
      <Field label="Title" name="title">
        <input id="title" name="title" className={input} maxLength={120} placeholder="e.g. Move the car into the garage" />
      </Field>
      <Field label="Why it matters" name="why" hint="Optional">
        <textarea id="why" name="why" className={`${textareaBase} min-h-[76px]`} maxLength={2000} />
      </Field>
      <ChipGroup
        legend="Priority"
        legendSize="sm"
        name="priority"
        size="sm"
        defaultValue="normal"
        choices={(['normal', 'high', 'urgent'] as const).map((p) => ({ value: p, label: PRIORITY[p] }))}
      />
      <ChipGroup legend="Category" legendSize="sm" name="category" size="sm" defaultValue="other" choices={options(CATEGORY).map(([value, label]) => ({ value, label }))} />
      <Field label="Due" name="dueAt" hint="Helsinki time. Leave empty for no due date.">
        <input id="dueAt" name="dueAt" type="datetime-local" className={input} defaultValue={localInputInDays(7, '18:00')} />
      </Field>
      <Field label="Owner" name="assigneeId">
        <select id="assigneeId" name="assigneeId" className={select} defaultValue="">
          <option value="">Nobody yet</option>
          {owners.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id === meId ? `Me (${m.name})` : `${m.name}${m.status === 'invited' ? ' (invited)' : ''}`}
            </option>
          ))}
        </select>
      </Field>
      {inDialog ? (
        <DialogActions>
          <DialogCancel />
          <SubmitButton pendingText="Adding…">Add task</SubmitButton>
        </DialogActions>
      ) : (
        <div>
          <SubmitButton pendingText="Adding…">Add task</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
