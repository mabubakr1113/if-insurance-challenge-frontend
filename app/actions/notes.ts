'use server';

import type { ActionState } from '@/lib/action-state';
import { act, all, checked, invalid, oneOf, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { EssentialKey, Note, NoteBody, NoteCategory } from '@/lib/contract';

const CATEGORIES: NoteCategory[] = ['water', 'heating', 'electricity', 'access', 'contacts', 'appliances', 'other'];
const ESSENTIALS: EssentialKey[] = ['water_main_valve', 'water_meter', 'fuse_box', 'heating_controls', 'key_location', 'neighbour_contact', 'well_pump'];

/** Creates (noteId null) or updates a house note, then goes back to the notes with "Saved." */
export async function saveNote(homeId: string, noteId: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const category = oneOf(fd, 'category', CATEGORIES);
  const title = text(fd, 'title');
  const body = text(fd, 'body');
  const errors: Record<string, string> = {};
  if (!category) errors.category = 'Choose a category';
  if (!title) errors.title = 'Give the note a title';
  if (body.length > 2000) errors.body = 'Keep it under 2000 characters';
  if (Object.keys(errors).length) return invalid(errors);
  const payload: NoteBody = {
    category: category as NoteCategory,
    title,
    body,
    essentialKey: oneOf(fd, 'essentialKey', ESSENTIALS),
    confirmed: checked(fd, 'confirmed'),
    photoIds: all(fd, 'photoIds'),
  };
  return act(
    () => (noteId ? api<Note>(`/api/notes/${noteId}`, { method: 'PATCH', body: payload }) : api<Note>(`/api/homes/${homeId}/notes`, { body: payload })),
    { redirect: () => `/homes/${homeId}/notes?saved=1` },
  );
}

export async function deleteNote(homeId: string, noteId: string): Promise<ActionState> {
  return act(() => api<{ ok: true }>(`/api/notes/${noteId}`, { method: 'DELETE' }), { redirect: () => `/homes/${homeId}/notes?deleted=1` });
}
