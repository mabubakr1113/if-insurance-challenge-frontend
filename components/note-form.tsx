import { deleteNote, saveNote } from '@/app/actions/notes';
import type { EssentialKey, EssentialStatus, Note, NoteCategory } from '@/lib/contract';
import { NOTE_CATEGORY, options } from '@/lib/labels';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from './forms';
import { PhotoPicker } from './photo-picker';
import { checkbox, input, select, textarea } from './styles';
import { Card } from './ui';

const HINTS: Partial<Record<EssentialKey, string>> = {
  water_main_valve: 'Say where it is and whether it’s open or closed now.',
  key_location: 'Say who has keys and where a spare is. Never write codes.',
  neighbour_contact: 'Name and phone of someone nearby who agreed to help.',
};

/** P15: create or edit a house note. */
export function NoteForm({
  homeId,
  note,
  essential,
  category,
}: {
  homeId: string;
  note?: Note;
  essential?: EssentialStatus | null;
  category?: NoteCategory | null;
}) {
  const essentialKey = note?.essentialKey ?? essential?.key ?? null;
  const hint = essentialKey ? HINTS[essentialKey] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <ActionForm action={saveNote.bind(null, homeId, note?.id ?? null)} className="flex flex-col gap-5">
          {essentialKey ? (
            <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong">
              House essential: <span className="font-semibold">{essential?.label ?? essentialKey.replaceAll('_', ' ')}</span>
              {essential?.why ? ` · ${essential.why}` : ''}
              <input type="hidden" name="essentialKey" value={essentialKey} />
            </p>
          ) : null}
          <Field label="Category" name="category">
            <select id="category" name="category" className={select} required defaultValue={note?.category ?? essential?.category ?? category ?? 'other'}>
              {options(NOTE_CATEGORY).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title" name="title">
            <input id="title" name="title" className={input} required maxLength={120} defaultValue={note?.title ?? essential?.label ?? ''} />
          </Field>
          <Field label="Text" name="body" hint={hint ?? 'Don’t write alarm codes, key-box codes or passwords.'}>
            <textarea id="body" name="body" className={`${textarea} min-h-32`} maxLength={2000} defaultValue={note?.body ?? ''} />
          </Field>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="confirmed" className={checkbox} defaultChecked={note?.confirmed ?? false} />
            <span>
              I’ve checked this on site
              <span className="block text-sm text-muted">Leave it unticked if you’re writing from memory.</span>
            </span>
          </label>
          <PhotoPicker homeId={homeId} initial={note?.photos ?? []} />
          <div>
            <SubmitButton pendingText="Saving…">Save</SubmitButton>
          </div>
        </ActionForm>
      </Card>
      {note ? (
        <ActionForm action={deleteNote.bind(null, homeId, note.id)}>
          <ConfirmSubmit label="Delete note" confirmLabel="Yes, delete it">
            The note and its photos are removed from the house notes.
          </ConfirmSubmit>
        </ActionForm>
      ) : null}
    </div>
  );
}
