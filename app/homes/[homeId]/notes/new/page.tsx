import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { NoteForm } from '@/components/note-form';
import { Card, PageHeader } from '@/components/ui';
import type { NoteCategory, NotesResponse } from '@/lib/contract';
import { canHelp, getHome, isClosed, read, requireMember } from '@/lib/guards';
import { NOTE_CATEGORY } from '@/lib/labels';

export const metadata: Metadata = { title: 'Add a house note' };

export default async function NewNotePage({ params, searchParams }: PageProps<'/homes/[homeId]/notes/new'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const [home, data] = await Promise.all([getHome(homeId), read<NotesResponse>(`/api/homes/${homeId}/notes`)]);
  if (!canHelp(me.member) || isClosed(home)) redirect(`/homes/${homeId}/notes`);

  const essential = data.essentials.find((e) => e.key === sp.essential) ?? null;
  if (essential?.noteId) redirect(`/homes/${homeId}/notes/${essential.noteId}`);
  const category = typeof sp.category === 'string' && sp.category in NOTE_CATEGORY ? (sp.category as NoteCategory) : null;

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <PageHeader title={essential ? `Add: ${essential.label}` : 'Add a house note'} back={{ href: `/homes/${homeId}/notes`, label: 'House notes' }} />
      <Card size="section" className="gap-3.5">
        <NoteForm homeId={homeId} essential={essential} category={category} />
      </Card>
    </div>
  );
}
