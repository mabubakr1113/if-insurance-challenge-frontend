import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Card, Facts, Notice, PageHeader, Stat } from '@/components/ui';
import type { Insights } from '@/lib/contract';
import { fmtDateTime, fmtMoney, fmtRate } from '@/lib/format';
import { read, requireStaff } from '@/lib/guards';

export const metadata: Metadata = { title: 'Pilot dashboard' };

type Tile = [ReactNode, string, string?];

function StatGroup({ title, items }: { title: string; items: Tile[] }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <h2 className="text-[15px] font-semibold text-muted">{title}</h2>
      <dl className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr))]">
        {items.map(([value, label, hint]) => (
          <Stat key={label} value={value} label={label} hint={hint} />
        ))}
      </dl>
    </section>
  );
}

/** One plum bar per stage, width by count, each a step lighter; count and conversion from the previous stage. */
function Funnel({ stages }: { stages: Insights['funnel'] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <ol className="flex flex-col gap-2.5">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].count : null;
        return (
          <li key={s.stage} className="grid grid-cols-[minmax(120px,190px)_minmax(0,1fr)] items-center gap-3.5 text-sm">
            <span>{s.stage}</span>
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="h-6 min-w-0.5 rounded-md bg-ink" style={{ width: `${(s.count / max) * 100}%`, opacity: Math.max(0.2, 1 - i * 0.1) }} />
              <span className="font-semibold whitespace-nowrap">
                {s.count} {prev ? <span className="font-normal text-muted">{fmtRate(s.count / prev)}</span> : null}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default async function InsightsPage() {
  await requireStaff();
  const d = await read<Insights>('/api/insights');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pilot dashboard" intro={`Updated ${fmtDateTime(d.generatedAt)}`} />
      <Notice tone="warning" title="Demo data.">
        {d.dataNote}
      </Notice>

      <StatGroup
        title="Adoption"
        items={[
          [d.homes.invited, 'Homes invited'],
          [fmtRate(d.homes.setupCompletionRate), 'Finished setup', `${d.homes.setupStarted} started`],
          [d.homes.active, 'Active homes'],
          [d.family.avgMembersPerHome, 'Family members per home'],
          [fmtRate(d.family.joinedRate), 'Invited family who joined'],
        ]}
      />
      <StatGroup
        title="Responsibility"
        items={[
          [fmtRate(d.tasks.acceptedWithin48hRate), 'Urgent and high tasks taken within 48 h'],
          [d.tasks.avgHoursToFirstAccepted !== null ? `${d.tasks.avgHoursToFirstAccepted} h` : '–', 'To first accepted task', 'average'],
          [d.tasks.needsOwnerNow, 'Need an owner now'],
          [d.tasks.overdueNow, 'Overdue now'],
          [d.tasks.completedLast30d, 'Completed, last 30 days'],
        ]}
      />
      <StatGroup
        title="Prevention"
        items={[
          [fmtRate(d.supervision.onTimeRate), 'Supervision on time', 'active homes'],
          [d.supervision.overdueHomes, 'Homes overdue'],
          [d.weather.alertsLast30d, 'Weather alerts, 30 days'],
          [fmtRate(d.weather.actionedBeforeDateRate), 'Alerts checked before the day'],
        ]}
      />
      <StatGroup
        title="Visits and revenue"
        items={[
          [d.visits.familyLast30d, 'Family visits, 30 days'],
          [d.visits.partnerLast30d, 'Partner visits, 30 days'],
          [d.paidVisits.requested, 'Paid visits requested'],
          [d.paidVisits.completed, 'Paid visits completed'],
          [fmtRate(d.paidVisits.conversionRate), 'Homes that booked a paid visit', 'of homes set up'],
          [fmtMoney(d.paidVisits.serviceRevenueCents), 'Service revenue', 'coordination fees only'],
          [fmtMoney(d.paidVisits.avgIfFeeCents), 'Average If fee'],
        ]}
      />
      <StatGroup
        title="When the home changes hands"
        items={[
          [d.transitions.occupied, 'Lived in again'],
          [d.transitions.sold, 'Sold'],
          [d.transitions.transferred, 'Passed to an heir'],
          [d.transitions.closed, 'Closed'],
          [d.transitions.coverHelpRequested, 'New owners asking for help with cover'],
        ]}
      />

      <Card size="section" title="Funnel" className="gap-3">
        <Funnel stages={d.funnel} />
        <span className="text-xs text-muted">Grey: conversion from the previous stage.</span>
      </Card>

      {d.assumptions.length ? (
        <Card size="section" title="Assumptions" className="gap-2">
          <Facts items={d.assumptions.map((a) => [a.label, a.value])} />
        </Card>
      ) : null}

      <p className="text-[13px] text-muted">Service revenue, premiums and avoided claims are separate measures and are never added together. Avoided claims are not estimated here.</p>
    </div>
  );
}
