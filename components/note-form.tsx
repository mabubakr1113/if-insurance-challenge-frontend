import { deleteNote, saveNote } from '@/app/actions/notes';
import type { EssentialKey, EssentialStatus, Note, NoteCategory } from '@/lib/contract';
import { NOTE_CATEGORY, options } from '@/lib/labels';
import { DialogActions, DialogCancel } from './dialog';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from './forms';
import { PhotoPicker } from './photo-picker';
import { Checkbox, ChipGroup } from './radio-group';
import { input, textareaBase } from './styles';

const HINTS: Partial<Record<EssentialKey, string>> = {
  water_main_valve: 'Say where it is and whether it’s open or closed now.',
  key_location: 'Say who has keys and where a spare is. Never write codes.',
  neighbour_contact: 'Name and phone of someone nearby who agreed to help.',
};

/** P15: create or edit a house note, in the note modal or on its own page. */
export function NoteForm({
  homeId,
  note,
  essential,
  category,
  inDialog = false,
}: {
  homeId: string;
  note?: Note;
  essential?: EssentialStatus | null;
  category?: NoteCategory | null;
  inDialog?: boolean;
}) {
  const essentialKey = note?.essentialKey ?? essential?.key ?? null;
  const hint = essentialKey ? HINTS[essentialKey] : undefined;

  return (
    <>
      <ActionForm action={saveNote.bind(null, homeId, note?.id ?? null)} className="flex flex-col gap-3.5">
        {essentialKey ? (
          <p className="rounded-xl bg-accent-soft px-3.5 py-2.5 text-sm">
            House essential: <span className="font-semibold">{essential?.label ?? essentialKey.replaceAll('_', ' ')}</span>
            {essential?.why ? <span className="text-muted"> · {essential.why}</span> : null}
            <input type="hidden" name="essentialKey" value={essentialKey} />
          </p>
        ) : null}
        <ChipGroup
          legend="Category"
          legendSize="hidden"
          name="category"
          size="sm"
          defaultValue={note?.category ?? essential?.category ?? category ?? 'water'}
          choices={options(NOTE_CATEGORY).map(([value, label]) => ({ value, label }))}
        />
        <Field label="Title" name="title">
          <input id="title" name="title" className={input} maxLength={120} defaultValue={note?.title ?? essential?.label ?? ''} placeholder="e.g. Water main valve in the basement" />
        </Field>
        <Field label="Details" name="body" hint={hint}>
          <textarea id="body" name="body" className={`${textareaBase} min-h-[100px]`} maxLength={2000} defaultValue={note?.body ?? ''} placeholder="Where it is, how it works, who to call" />
        </Field>
        <PhotoPicker homeId={homeId} initial={note?.photos ?? []} showLabel={false} size="sm" />
        <Checkbox name="confirmed" defaultChecked={note?.confirmed ?? false}>
          I’ve checked this on site
        </Checkbox>
        <p className="text-xs text-attention">Don’t store alarm codes, key-box codes or passwords.</p>
        {inDialog ? (
          <DialogActions>
            <DialogCancel />
            <SubmitButton pendingText="Saving…">Save note</SubmitButton>
          </DialogActions>
        ) : (
          <div>
            <SubmitButton pendingText="Saving…">Save note</SubmitButton>
          </div>
        )}
      </ActionForm>
      {note ? (
        <ActionForm action={deleteNote.bind(null, homeId, note.id)} className="border-t border-line-soft pt-3.5">
          <ConfirmSubmit label="Delete this note" title="Delete the note?" confirmLabel="Yes, delete it" triggerVariant="dangerQuiet" triggerSize="sm" pendingText="Deleting…">
            The note and its photos are removed from the house notes.
          </ConfirmSubmit>
        </ActionForm>
      ) : null}
    </>
  );
}
