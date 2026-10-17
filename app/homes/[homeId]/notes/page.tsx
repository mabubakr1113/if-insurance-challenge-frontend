/* eslint-disable @next/next/no-img-element -- signed URLs expire after 60 minutes (5.4) */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Dialog } from '@/components/dialog';
import { NoteForm } from '@/components/note-form';
import { button, card } from '@/components/styles';
import { ToastOnLoad } from '@/components/toaster';
import { Badge, ButtonLink, Empty, PageHeader } from '@/components/ui';
import type { EssentialStatus, NoteCategory, NotesResponse } from '@/lib/contract';
import { fmtDate } from '@/lib/format';
import { canHelp, getHome, isClosed, read, requireMember } from '@/lib/guards';
import { NOTE_CATEGORY, options } from '@/lib/labels';

export const metadata: Metadata = { title: 'House notes' };

function essentialState(e: EssentialStatus): { label: string; tone: 'attention' | 'neutral' | 'ok' } {
  if (!e.noteId) return { label: 'Missing', tone: 'attention' };
  if (!e.confirmed) return { label: 'Not checked on site', tone: 'neutral' };
  return { label: e.hasPhoto ? 'Confirmed with photo' : 'Confirmed', tone: 'ok' };
}

const TOASTS: Record<string, string> = {
  new: 'Note added to the house notes.',
  '1': 'Note saved.',
};

export default async function NotesPage({ params, searchParams }: PageProps<'/homes/[homeId]/notes'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const [data, home] = await Promise.all([read<NotesResponse>(`/api/homes/${homeId}/notes`), getHome(homeId)]);
  const helper = canHelp(me.member) && !isClosed(home);
  const base = `/homes/${homeId}`;
  const notesHref = `${base}/notes`;
  const byCategory = options(NOTE_CATEGORY)
    .map(([key, label]) => [label, data.notes.filter((n) => n.category === (key as NoteCategory))] as const)
    .filter(([, notes]) => notes.length);

  // The note modal opens from the URL: ?note=new, ?note=<id> or ?essential=<key>.
  const editNote = helper && typeof sp.note === 'string' && sp.note !== 'new' ? data.notes.find((n) => n.id === sp.note) : undefined;
  const essential = helper && typeof sp.essential === 'string' ? (data.essentials.find((e) => e.key === sp.essential) ?? null) : null;
  const essentialNote = essential?.noteId ? data.notes.find((n) => n.id === essential.noteId) : undefined;
  const modalNote = editNote ?? essentialNote;
  const modalOpen = helper && (sp.note === 'new' || !!modalNote || !!essential);
  const modalEssential = essential ?? (modalNote?.essentialKey ? (data.essentials.find((e) => e.key === modalNote.essentialKey) ?? null) : null);
  const toastMessage = typeof sp.saved === 'string' ? TOASTS[sp.saved] : sp.deleted === '1' ? 'Note deleted.' : undefined;

  return (
    <div className="flex flex-col gap-6">
      {toastMessage ? <ToastOnLoad message={toastMessage} removeParams={['saved', 'deleted']} /> : null}
      <PageHeader
        title="House notes"
        intro="Everything someone needs to look after this house, in one place. Don’t store alarm codes, key-box codes or passwords."
        actions={
          helper ? (
            <ButtonLink href={`${notesHref}?note=new`} icon="plus" scroll={false}>
              Add a note
            </ButtonLink>
          ) : null
        }
      />

      <section aria-label="Essentials" className={`${card} px-[22px] py-2`}>
          {data.essentials.map((e) => {
            const state = essentialState(e);
            const href = helper ? (e.noteId ? `${notesHref}?note=${e.noteId}` : `${notesHref}?essential=${e.key}`) : e.noteId ? `${base}/notes/${e.noteId}` : null;
            return (
              <div key={e.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-skeleton-soft py-3.5">
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[3px]">
                  <span className="text-[15px] font-semibold">{e.label}</span>
                  <span className="text-[13px] text-muted">{e.why}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Badge tone={state.tone} size="md">
                    {state.label}
                  </Badge>
                  {href ? (
                    <Link href={href} scroll={false} className={button('secondary', 'sm')}>
                      {helper ? (e.noteId ? 'Edit' : 'Add') : 'Read'}
                      <span className="sr-only"> {e.label}</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
      </section>

      {byCategory.length === 0 ? (
        <Empty
          title="No notes yet"
          action={
            helper ? (
              <ButtonLink href={`${notesHref}?essential=water_main_valve`} scroll={false}>
                Add the water main valve
              </ButtonLink>
            ) : null
          }
        >
          Start with the water main valve. It’s needed within minutes if a pipe leaks.
        </Empty>
      ) : (
        byCategory.map(([label, notes]) => (
          <section key={label} aria-label={label} className="flex flex-col gap-2.5">
            <h2 className="text-[15px] font-semibold text-muted">{label}</h2>
            <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link
                    href={helper ? `${notesHref}?note=${n.id}` : `${base}/notes/${n.id}`}
                    scroll={false}
                    className="flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-card text-ink hover:border-line-hover"
                  >
                    {n.photos[0] ? <img src={n.photos[0].url} alt="" className="h-[130px] w-full bg-line-soft object-cover" loading="lazy" /> : null}
                    <span className="flex flex-col gap-1.5 px-[18px] py-4">
                      <span className="text-[15px] font-semibold">{n.title}</span>
                      {n.body ? <span className="line-clamp-2 text-sm leading-normal text-ink-soft">{n.body}</span> : null}
                      {!n.confirmed ? <span className="text-xs font-semibold text-attention">Not checked on site</span> : null}
                      <span className="text-xs text-muted">
                        Updated by {n.updatedByLabel}, {fmtDate(n.updatedAt)}
                        {n.photos.length > 1 ? ` · ${n.photos.length} photos` : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {modalOpen ? (
        <Dialog title={modalNote ? 'Edit note' : 'Add a house note'} closeHref={notesHref} width="lg">
          <NoteForm key={modalNote?.id ?? essential?.key ?? 'new'} homeId={homeId} note={modalNote} essential={modalEssential} inDialog />
        </Dialog>
      ) : null}
    </div>
  );
}
