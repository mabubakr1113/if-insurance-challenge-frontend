import type { Metadata } from 'next';
import { Card, Notice, PageHeader, Stat } from '@/components/ui';
import type { Insights, SupervisionState } from '@/lib/contract';
import { fmtDateTime, fmtMoney, fmtRate } from '@/lib/format';
import { read, requireStaff } from '@/lib/guards';
import { HOME_STATUS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Pilot dashboard' };

const SUPERVISION: Record<SupervisionState, string> = {
  no_visit_yet: 'No visit yet',
  ok: 'On track',
  due_soon: 'Due soon',
  overdue: 'Overdue',
};

/** Hand-rolled SVG funnel: one bar per stage, labelled with counts and step-to-step conversion. */
function Funnel({ stages }: { stages: Insights['funnel'] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  const row = 44;
  const labelWidth = 170;
  const width = 640;
  const barMax = width - labelWidth - 110;
  return (
    <svg viewBox={`0 0 ${width} ${stages.length * row}`} className="w-full" role="img" aria-labelledby="funnel-title funnel-desc">
      <title id="funnel-title">Pilot funnel</title>
      <desc id="funnel-desc">{stages.map((s) => `${s.stage}: ${s.count}`).join('; ')}</desc>
      {stages.map((s, i) => {
        const w = Math.max(2, (s.count / max) * barMax);
        const prev = i > 0 ? stages[i - 1].count : null;
        const conversion = prev ? fmtRate(s.count / prev) : null;
        const y = i * row;
        return (
          <g key={s.stage}>
            <text x={0} y={y + 26} className="fill-[var(--color-ink)] text-[14px]">
              {s.stage}
            </text>
            <rect x={labelWidth} y={y + 8} width={w} height={26} rx={6} className="fill-[var(--color-accent)]" opacity={1 - i * 0.12} />
            <text x={labelWidth + w + 8} y={y + 26} className="fill-[var(--color-ink)] text-[14px] font-semibold">
              {s.count}
              {conversion ? <tspan className="fill-[var(--color-muted)] font-normal"> ({conversion})</tspan> : null}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function InsightsPage() {
  await requireStaff();
  const d = await read<Insights>('/api/insights');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pilot dashboard" intro={`Updated ${fmtDateTime(d.generatedAt)}`} />
      <Notice tone="attention" title="Demo data">
        {d.dataNote}
      </Notice>

      <Card title="Adoption">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Invited" value={d.homes.invited} />
          <Stat label="Setup completion" value={fmtRate(d.homes.setupCompletionRate)} hint={`${d.homes.setupStarted} started setup`} />
          <Stat label="Active" value={d.homes.active} />
          <Stat label="Family members per home" value={d.family.avgMembersPerHome} />
          <Stat label="Invited family who joined" value={fmtRate(d.family.joinedRate)} />
        </dl>
      </Card>

      <Card title="Responsibility">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Urgent and high tasks accepted within 48 h" value={fmtRate(d.tasks.acceptedWithin48hRate)} />
          <Stat label="Hours to first accepted task" value={d.tasks.avgHoursToFirstAccepted ?? '–'} hint="average" />
          <Stat label="Need an owner now" value={d.tasks.needsOwnerNow} />
          <Stat label="Overdue now" value={d.tasks.overdueNow} />
          <Stat label="Completed, last 30 days" value={d.tasks.completedLast30d} />
        </dl>
      </Card>

      <Card title="Prevention">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Supervision on time" value={fmtRate(d.supervision.onTimeRate)} hint="active homes" />
          <Stat label="Homes overdue" value={d.supervision.overdueHomes} />
          <Stat label="Weather alerts, 30 days" value={d.weather.alertsLast30d} />
          <Stat label="Alerts checked before the day" value={fmtRate(d.weather.actionedBeforeDateRate)} />
        </dl>
      </Card>

      <Card title="Visits and revenue">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Family visits, 30 days" value={d.visits.familyLast30d} />
          <Stat label="Partner visits, 30 days" value={d.visits.partnerLast30d} />
          <Stat label="Paid visits requested" value={d.paidVisits.requested} />
          <Stat label="Paid visits completed" value={d.paidVisits.completed} />
          <Stat label="Homes that booked a paid visit" value={fmtRate(d.paidVisits.conversionRate)} hint="of homes set up" />
          <Stat label="Service revenue" value={fmtMoney(d.paidVisits.serviceRevenueCents)} hint="If’s fee only" />
          <Stat label="Average If fee" value={fmtMoney(d.paidVisits.avgIfFeeCents)} />
        </dl>
      </Card>

      <Card title="Transitions">
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Lived in again" value={d.transitions.occupied} />
          <Stat label="Sold" value={d.transitions.sold} />
          <Stat label="Passed to an heir" value={d.transitions.transferred} />
          <Stat label="Closed" value={d.transitions.closed} />
          <Stat label="New owners asking for help with cover" value={d.transitions.coverHelpRequested} />
        </dl>
      </Card>

      <Card title="Funnel">
        <Funnel stages={d.funnel} />
        <p className="mt-2 text-sm text-muted">In brackets: conversion from the previous stage.</p>
      </Card>

      <Card title="Homes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-muted">
              <tr>
                {['City', 'Status', 'Days active', 'Supervision', 'Open tasks', 'Paid visits'].map((h) => (
                  <th key={h} scope="col" className="py-1.5 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.homesTable.map((h) => (
                <tr key={h.id}>
                  <td className="py-2 pr-3">{h.city}</td>
                  <td className="py-2 pr-3">{HOME_STATUS[h.status]}</td>
                  <td className="py-2 pr-3 tabular-nums">{h.daysActive ?? '–'}</td>
                  <td className="py-2 pr-3">{h.supervision ? SUPERVISION[h.supervision] : '–'}</td>
                  <td className="py-2 pr-3 tabular-nums">{h.openTasks}</td>
                  <td className="py-2 tabular-nums">{h.paidVisits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Assumptions">
        <dl className="divide-y divide-line">
          {d.assumptions.map((a) => (
            <div key={a.label} className="grid gap-1 py-2 sm:grid-cols-[14rem_1fr]">
              <dt className="text-muted">{a.label}</dt>
              <dd>{a.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <p className="text-sm text-muted">
        Service revenue, premiums and avoided claims are separate measures and are never added together. Avoided claims are not estimated here.
      </p>
    </div>
  );
}
