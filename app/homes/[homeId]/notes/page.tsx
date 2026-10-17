import type { Metadata } from 'next';
import Link from 'next/link';
import { PhotoGrid } from '@/components/photo-grid';
import { btnSecondary, btnSmall, link } from '@/components/styles';
import { Badge, ButtonLink, Card, Empty, Notice, PageHeader } from '@/components/ui';
import type { EssentialStatus, NoteCategory, NotesResponse } from '@/lib/contract';
import { fmtDate } from '@/lib/format';
import { canHelp, getHome, isClosed, read, requireMember } from '@/lib/guards';
import { NOTE_CATEGORY, options } from '@/lib/labels';

export const metadata: Metadata = { title: 'House notes' };

function essentialState(e: EssentialStatus): { label: string; tone: 'attention' | 'neutral' | 'ok' } {
  if (!e.noteId) return { label: 'Missing', tone: 'attention' };
  if (!e.confirmed) return { label: 'Added, not checked on site', tone: 'neutral' };
  return { label: e.hasPhoto ? 'Confirmed with photo' : 'Confirmed', tone: 'ok' };
}

export default async function NotesPage({ params, searchParams }: PageProps<'/homes/[homeId]/notes'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const [data, home] = await Promise.all([read<NotesResponse>(`/api/homes/${homeId}/notes`), getHome(homeId)]);
  const helper = canHelp(me.member) && !isClosed(home);
  const base = `/homes/${homeId}`;
  const byCategory = options(NOTE_CATEGORY)
    .map(([key, label]) => [label, data.notes.filter((n) => n.category === (key as NoteCategory))] as const)
    .filter(([, notes]) => notes.length);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="House notes"
        intro="Everything someone needs to look after this house, in one place. Don’t store alarm codes, key-box codes or passwords."
      >
        {helper ? <ButtonLink href={`${base}/notes/new`}>Add a note</ButtonLink> : null}
      </PageHeader>

      {sp.saved === '1' ? (
        <Notice tone="ok" role="status">
          Saved.
        </Notice>
      ) : null}
      {sp.deleted === '1' ? (
        <Notice tone="ok" role="status">
          The note was deleted.
        </Notice>
      ) : null}

      <Card title="Essentials">
        <ul className="flex flex-col divide-y divide-line">
          {data.essentials.map((e) => {
            const state = essentialState(e);
            return (
              <li key={e.key} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{e.label}</p>
                  <p className="text-sm text-muted">{e.why}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={state.tone}>{state.label}</Badge>
                  {helper ? (
                    <Link
                      href={e.noteId ? `${base}/notes/${e.noteId}` : `${base}/notes/new?essential=${e.key}&category=${e.category}`}
                      className={`${btnSecondary} ${btnSmall}`}
                    >
                      {e.noteId ? 'Edit' : 'Add'}
                      <span className="sr-only"> {e.label}</span>
                    </Link>
                  ) : e.noteId ? (
                    <Link href={`${base}/notes/${e.noteId}`} className={link}>
                      Read<span className="sr-only"> {e.label}</span>
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {byCategory.length === 0 ? (
        <Empty>No notes yet. Start with the water main valve: it’s needed within minutes if a pipe leaks.</Empty>
      ) : (
        byCategory.map(([label, notes]) => (
          <section key={label} aria-labelledby={`cat-${label}`}>
            <h2 id={`cat-${label}`} className="mb-3 text-lg font-semibold">
              {label}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <Card as="article" className="h-full">
                    <Link href={`${base}/notes/${n.id}`} className={`${link} font-semibold`}>
                      {n.title}
                    </Link>
                    {n.body ? <p className="mt-1 line-clamp-2 text-sm">{n.body}</p> : null}
                    {n.photos.length ? (
                      <div className="mt-2">
                        <PhotoGrid photos={n.photos} size="sm" />
                      </div>
                    ) : null}
                    {!n.confirmed ? <p className="mt-2 text-sm text-attention">Not checked on site</p> : null}
                    <p className="mt-2 text-xs text-muted">
                      Updated by {n.updatedByLabel}, {fmtDate(n.updatedAt)}
                    </p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
