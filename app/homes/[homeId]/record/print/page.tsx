import type { Metadata } from 'next';
import { AutoPrint, PrintButton } from '@/components/print-button';
import { RecordSummary } from '@/components/record-summary';
import { Wordmark } from '@/components/ui';
import type { CheckResult, HomeRecord, Visit } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtSlot, fmtTemp } from '@/lib/format';
import { read, requireMember } from '@/lib/guards';
import { BOOKING_STATUS, CHECK_RESULT, HOME_STATUS, RELATION, ROLE, WEATHER_RULE, whoseHome } from '@/lib/labels';

export const metadata: Metadata = { title: 'Home record (print)' };

/** P20 print view: one clean column, no navigation (the layouts skip their chrome on this path). */
export default async function RecordPrintPage({ params }: PageProps<'/homes/[homeId]/record/print'>) {
  const { homeId } = await params;
  await requireMember(homeId);
  const r = await read<HomeRecord>(`/api/homes/${homeId}/record`);
  const visits = [...r.visits].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 bg-white px-6 py-10 text-[15px] text-ink print:p-0">
      <AutoPrint />
      <header className="flex flex-col gap-1 border-b border-line pb-5">
        <Wordmark href={null} />
        <p className="mt-3 text-xs font-bold tracking-[0.07em] text-faint uppercase">Home record</p>
        <h1 className="font-display text-[36px] leading-[1.08] font-normal tracking-[-0.025em]">{whoseHome(r.home.estateName)}</h1>
        <p>
          {r.home.addressLine}, {r.home.postalCode} {r.home.city} · {HOME_STATUS[r.home.status]}
        </p>
        <p className="text-sm text-muted">Generated {fmtDateTime(r.generatedAt, { year: true })}</p>
        <div className="mt-3">
          <PrintButton label="Print" variant="primary" />
        </div>
      </header>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Summary</h2>
        <RecordSummary record={r} />
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Visits</h2>
        {visits.length ? (
          <div className="flex flex-col gap-6">
            {visits.map((v) => (
              <div key={v.id} className="break-inside-avoid border-t border-line pt-3">
                <h3 className="mb-2 font-semibold">
                  {fmtDateTime(v.visitedAt, { year: true })} · {v.visitorName}
                  {v.visitorType === 'partner' ? ' (local partner visit)' : ''}
                </h3>
                <PrintVisit visit={v} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No visits recorded.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Completed tasks</h2>
        {r.completedTasks.length ? (
          <ul className="flex flex-col gap-1">
            {r.completedTasks.map((t) => (
              <li key={t.id}>
                {t.title} · {t.completedByLabel ?? 'someone'}
                {t.completedAt ? `, ${fmtDateTime(t.completedAt, { year: true })}` : ''}
                {t.completionNote ? <span className="text-muted"> · {t.completionNote}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">None yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Open tasks</h2>
        {r.openTasks.length ? (
          <ul className="flex flex-col gap-1">
            {r.openTasks.map((t) => (
              <li key={t.id}>
                {t.title} · {t.assignee?.name ?? 'Nobody yet'}
                {t.dueAt ? `, due ${fmtDate(t.dueAt, { year: true })}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">None.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Weather alerts</h2>
        {r.alerts.length ? (
          <ul className="flex flex-col gap-1">
            {r.alerts.map((a) => (
              <li key={a.id}>
                {fmtDate(a.forDate, { year: true })} · {WEATHER_RULE[a.rule]}: {a.message} · checked before the day: {a.actionedBeforeDate ? 'yes' : 'no'}
                {a.source === 'simulated' ? ' (simulated forecast)' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">None.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Local visits</h2>
        {r.bookings.length ? (
          <ul className="flex flex-col gap-1">
            {r.bookings.map((b) => (
              <li key={b.id}>
                {b.package.name}, {fmtSlot(b.slotStart, b.slotEnd)} · {b.partner.name} (fictional) · {BOOKING_STATUS[b.status]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">None.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-display text-2xl font-normal">Family members</h2>
        <ul className="flex flex-col gap-1">
          {r.members.map((m) => (
            <li key={m.id}>
              {m.name} · {ROLE[m.role]} · {RELATION[m.relation]}
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line pt-4">
        <p className="font-medium">{r.disclaimer}</p>
        <p className="mt-2 text-sm text-muted">Hackathon prototype. Fictional people, homes and partner. Not an If service.</p>
      </footer>
    </article>
  );
}

const ORDER: Record<CheckResult, number> = { concern: 0, ok: 1, not_checked: 2 };

/** A visit as plain lines for printing: temperature, checks (concerns first), notes and tasks. */
function PrintVisit({ visit }: { visit: Visit }) {
  const checks = [...visit.checks].sort((a, b) => ORDER[a.result] - ORDER[b.result]);
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>
        <span className="text-muted">Inside:</span> {visit.indoorTempC !== null ? fmtTemp(visit.indoorTempC) : 'not measured'} · {visit.okCount} OK ·{' '}
        {visit.concernCount} {visit.concernCount === 1 ? 'concern' : 'concerns'} · {visit.photos.length} {visit.photos.length === 1 ? 'photo' : 'photos'}
      </p>
      <ul className="flex flex-col">
        {checks.map((c) => (
          <li key={c.key} className="flex justify-between gap-4 border-b border-line-soft py-1 last:border-0">
            <span>
              {c.label}
              {c.note ? <span className={c.result === 'concern' ? 'text-concern' : 'text-muted'}> · {c.note}</span> : null}
            </span>
            <span className={`shrink-0 font-semibold ${c.result === 'concern' ? 'text-concern' : c.result === 'ok' ? 'text-ok' : 'text-muted'}`}>{CHECK_RESULT[c.result]}</span>
          </li>
        ))}
      </ul>
      {visit.notes ? <p className="whitespace-pre-line">{visit.notes}</p> : null}
      {visit.completedTasks.length ? <p>Closed: {visit.completedTasks.map((t) => t.name).join(', ')}</p> : null}
      {visit.followUpTasks.length ? <p>Follow-ups: {visit.followUpTasks.map((t) => t.title).join(', ')}</p> : null}
    </div>
  );
}
