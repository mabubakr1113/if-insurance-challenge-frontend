import Link from 'next/link';
import type { CheckResult, Visit } from '@/lib/contract';
import { fmtTemp } from '@/lib/format';
import { CHECK_RESULT } from '@/lib/labels';
import { PhotoGrid } from './photo-grid';
import { link } from './styles';
import { Badge } from './ui';

const ORDER: Record<CheckResult, number> = { concern: 0, ok: 1, not_checked: 2 };
const TONE = { ok: 'ok', concern: 'concern', not_checked: 'neutral' } as const;

/** The body of a visit report: temperature, checks (concerns first), photos, notes, tasks. */
export function VisitReport({ visit, homeId, links = true }: { visit: Visit; homeId: string; links?: boolean }) {
  const checks = [...visit.checks].sort((a, b) => ORDER[a.result] - ORDER[b.result]);
  const taskLink = (id: string, title: string) =>
    links ? (
      <Link href={`/homes/${homeId}/tasks/${id}`} className={link}>
        {title}
      </Link>
    ) : (
      title
    );

  return (
    <div className="flex flex-col gap-5">
      <p>
        <span className="text-muted">Indoor temperature:</span> {visit.indoorTempC !== null ? fmtTemp(visit.indoorTempC) : 'Not measured'}
      </p>

      <section aria-label="Checks">
        <h3 className="mb-2 font-semibold">
          Checks <span className="font-normal text-muted">· {visit.okCount} OK · {visit.concernCount} {visit.concernCount === 1 ? 'concern' : 'concerns'}</span>
        </h3>
        <ul className="flex flex-col divide-y divide-line">
          {checks.map((c) => (
            <li key={c.key} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p className={c.result === 'concern' ? 'font-medium' : ''}>{c.label}</p>
                {c.note ? <p className="text-sm text-muted">{c.note}</p> : null}
              </div>
              <Badge tone={TONE[c.result]}>{CHECK_RESULT[c.result]}</Badge>
            </li>
          ))}
        </ul>
      </section>

      {visit.photos.length ? (
        <section aria-label="Photos">
          <h3 className="mb-2 font-semibold">Photos</h3>
          <PhotoGrid photos={visit.photos} />
        </section>
      ) : null}

      {visit.notes ? (
        <section aria-label="Notes">
          <h3 className="mb-1 font-semibold">General notes</h3>
          <p className="whitespace-pre-line">{visit.notes}</p>
        </section>
      ) : null}

      {visit.completedTasks.length ? (
        <section aria-label="Completed by this visit">
          <h3 className="mb-1 font-semibold">Completed by this visit</h3>
          <ul className="list-disc pl-5">
            {visit.completedTasks.map((t) => (
              <li key={t.id}>{taskLink(t.id, t.name)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {visit.followUpTasks.length ? (
        <section aria-label="Follow-ups created">
          <h3 className="mb-1 font-semibold">Follow-ups created</h3>
          <ul className="list-disc pl-5">
            {visit.followUpTasks.map((t) => (
              <li key={t.id}>
                {taskLink(t.id, t.title)} <span className="text-muted">· {t.assignee?.name ?? 'Nobody yet'}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
