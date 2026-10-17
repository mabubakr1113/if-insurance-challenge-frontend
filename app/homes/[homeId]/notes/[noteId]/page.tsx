import type { Metadata } from 'next';
import Link from 'next/link';
import { NoteForm } from '@/components/note-form';
import { PhotoGrid } from '@/components/photo-grid';
import { link } from '@/components/styles';
import { Card, PageHeader } from '@/components/ui';
import type { Note, NotesResponse } from '@/lib/contract';
import { fmtDateTime } from '@/lib/format';
import { canHelp, getHome, isClosed, read, requireMember } from '@/lib/guards';
import { NOTE_CATEGORY } from '@/lib/labels';

export const metadata: Metadata = { title: 'House note' };

export default async function NotePage({ params }: PageProps<'/homes/[homeId]/notes/[noteId]'>) {
  const { homeId, noteId } = await params;
  const me = await requireMember(homeId);
  const [note, home] = await Promise.all([read<Note>(`/api/notes/${noteId}`), getHome(homeId)]);
  const editable = canHelp(me.member) && !isClosed(home);
  const base = `/homes/${homeId}`;

  if (editable) {
    const data = note.essentialKey ? await read<NotesResponse>(`/api/homes/${homeId}/notes`) : null;
    const essential = data?.essentials.find((e) => e.key === note.essentialKey) ?? null;
    return (
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-sm">
          <Link href={`${base}/notes`} className={link}>
            House notes
          </Link>
        </p>
        <PageHeader title={`Edit: ${note.title}`} intro={`Last updated by ${note.updatedByLabel}, ${fmtDateTime(note.updatedAt)}`} />
        <NoteForm homeId={homeId} note={note} essential={essential} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-2 text-sm">
        <Link href={`${base}/notes`} className={link}>
          House notes
        </Link>
      </p>
      <PageHeader title={note.title} intro={`${NOTE_CATEGORY[note.category]} · updated by ${note.updatedByLabel}, ${fmtDateTime(note.updatedAt)}`} />
      <Card>
        <p className="whitespace-pre-line">{note.body || 'No text.'}</p>
        {!note.confirmed ? <p className="mt-3 text-sm text-attention">Not checked on site</p> : null}
        {note.photos.length ? (
          <div className="mt-4">
            <PhotoGrid photos={note.photos} />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
