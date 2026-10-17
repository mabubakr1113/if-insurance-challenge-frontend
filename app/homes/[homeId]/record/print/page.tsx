import type { Metadata } from 'next';
import { AutoPrint, PrintButton } from '@/components/print-button';
import { RecordSummary } from '@/components/record-summary';
import { VisitReport } from '@/components/visit-report';
import type { HomeRecord } from '@/lib/contract';
import { fmtDate, fmtDateTime, fmtSlot } from '@/lib/format';
import { read, requireMember } from '@/lib/guards';
import { BOOKING_STATUS, HOME_STATUS, RELATION, ROLE, WEATHER_RULE, whoseHome } from '@/lib/labels';

export const metadata: Metadata = { title: 'Home record (print)' };

/** P20 print view: one clean column, no navigation (the layouts skip their chrome on this path). */
export default async function RecordPrintPage({ params }: PageProps<'/homes/[homeId]/record/print'>) {
  const { homeId } = await params;
  await requireMember(homeId);
  const r = await read<HomeRecord>(`/api/homes/${homeId}/record`);
  const visits = [...r.visits].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-8 bg-white p-2 text-[15px] print:p-0">
      <AutoPrint />
      <header className="border-b border-line pb-4">
        <p className="text-sm text-muted">If Home Watch · Prototype · Home record</p>
        <h1 className="mt-1 text-2xl font-semibold">{whoseHome(r.home.estateName)}</h1>
        <p>
          {r.home.addressLine}, {r.home.postalCode} {r.home.city} · {HOME_STATUS[r.home.status]}
        </p>
        <p className="text-sm text-muted">Generated {fmtDateTime(r.generatedAt, { year: true })}</p>
        <div className="mt-3">
          <PrintButton label="Print" variant="primary" />
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Summary</h2>
        <RecordSummary record={r} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Visits</h2>
        {visits.length ? (
          <div className="flex flex-col gap-6">
            {visits.map((v) => (
              <div key={v.id} className="break-inside-avoid border-t border-line pt-3">
                <h3 className="mb-2 font-semibold">
                  {fmtDateTime(v.visitedAt, { year: true })} · {v.visitorName}
                  {v.visitorType === 'partner' ? ' (local partner visit)' : ''}
                </h3>
                <VisitReport visit={v} homeId={homeId} links={false} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted">No visits recorded.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Completed tasks</h2>
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
        <h2 className="mb-2 text-lg font-semibold">Open tasks</h2>
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
        <h2 className="mb-2 text-lg font-semibold">Weather alerts</h2>
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
        <h2 className="mb-2 text-lg font-semibold">Local visits</h2>
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
        <h2 className="mb-2 text-lg font-semibold">Family members</h2>
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
