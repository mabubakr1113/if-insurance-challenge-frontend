import type { Metadata } from 'next';
import { NoteForm } from '@/components/note-form';
import { PhotoGrid } from '@/components/photo-grid';
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
  const back = { href: `/homes/${homeId}/notes`, label: 'House notes' };

  if (editable) {
    const data = note.essentialKey ? await read<NotesResponse>(`/api/homes/${homeId}/notes`) : null;
    const essential = data?.essentials.find((e) => e.key === note.essentialKey) ?? null;
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <PageHeader title="Edit note" intro={`Last updated by ${note.updatedByLabel}, ${fmtDateTime(note.updatedAt)}`} back={back} />
        <Card size="section" className="gap-3.5">
          <NoteForm homeId={homeId} note={note} essential={essential} />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <PageHeader title={note.title} intro={`${NOTE_CATEGORY[note.category]} · updated by ${note.updatedByLabel}, ${fmtDateTime(note.updatedAt)}`} back={back} />
      <Card size="section">
        <p className="text-[15px] leading-[1.6] whitespace-pre-line">{note.body || 'No details written down.'}</p>
        {!note.confirmed ? <p className="text-xs font-semibold text-attention">Not checked on site</p> : null}
        <PhotoGrid photos={note.photos} />
      </Card>
    </div>
  );
}
