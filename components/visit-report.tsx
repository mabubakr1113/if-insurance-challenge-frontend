import Link from 'next/link';
import type { CheckResult, Visit } from '@/lib/contract';
import { fmtTemp } from '@/lib/format';
import { CHECK_RESULT } from '@/lib/labels';
import { PhotoGrid } from './photo-grid';
import { Badge, Card } from './ui';

const ORDER: Record<CheckResult, number> = { concern: 0, ok: 1, not_checked: 2 };
const TONE = { ok: 'ok', concern: 'concern', not_checked: 'neutral' } as const;

/** The body of a visit report: three stat tiles, the checklist (concerns first), photos, notes, tasks closed and added. */
export function VisitReport({ visit, homeId }: { visit: Visit; homeId: string }) {
  const checks = [...visit.checks].sort((a, b) => ORDER[a.result] - ORDER[b.result]);
  const taskHref = (id: string) => `/homes/${homeId}/tasks/${id}`;

  return (
    <>
      <dl className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-card px-[18px] py-4">
          <dt className="text-xs text-muted">Inside</dt>
          <dd className="font-display text-[30px]">{visit.indoorTempC !== null ? fmtTemp(visit.indoorTempC) : '–'}</dd>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-ok-soft px-[18px] py-4">
          <dt className="text-xs text-ok">OK</dt>
          <dd className="font-display text-[30px] text-ok-strong">{visit.okCount}</dd>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-concern-soft px-[18px] py-4">
          <dt className="text-xs text-concern">Concerns</dt>
          <dd className="font-display text-[30px] text-concern-strong">{visit.concernCount}</dd>
        </div>
      </dl>

      <Card size="section" title="Checklist" className="gap-1">
        <ul className="mt-2 flex flex-col">
          {checks.map((c) => (
            <li key={c.key} className="flex flex-col gap-1 border-b border-skeleton-soft py-2.5 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{c.label}</span>
                <Badge tone={TONE[c.result]} size="row">
                  {CHECK_RESULT[c.result]}
                </Badge>
              </div>
              {c.note ? <span className={`text-[13px] ${c.result === 'concern' ? 'text-concern' : 'text-muted'}`}>{c.note}</span> : null}
            </li>
          ))}
        </ul>
      </Card>

      {visit.photos.length ? (
        <Card size="section" title="Photos">
          <PhotoGrid photos={visit.photos} captions={false} />
        </Card>
      ) : null}

      {visit.notes ? (
        <Card size="section" title="Notes" className="gap-2">
          <p className="text-[15px] leading-[1.6] whitespace-pre-line">{visit.notes}</p>
        </Card>
      ) : null}

      {visit.completedTasks.length || visit.followUpTasks.length ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {visit.completedTasks.length ? (
            <Card size="section" title="Closed by this visit" className="gap-2">
              <ul className="flex flex-col gap-1.5">
                {visit.completedTasks.map((t) => (
                  <li key={t.id} className="flex gap-2 text-sm">
                    <span aria-hidden="true" className="text-ok">
                      ✓
                    </span>
                    <Link href={taskHref(t.id)} className="hover:text-accent-text">
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {visit.followUpTasks.length ? (
            <Card size="section" title="Follow-ups added to the plan" className="gap-2">
              <ul className="flex flex-col gap-1.5">
                {visit.followUpTasks.map((t) => (
                  <li key={t.id} className="flex gap-2 text-sm">
                    <span aria-hidden="true" className="text-accent-text">
                      →
                    </span>
                    <span>
                      <Link href={taskHref(t.id)} className="hover:text-accent-text">
                        {t.title}
                      </Link>
                      <span className="text-muted"> · {t.assignee?.name ?? 'Nobody yet'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
