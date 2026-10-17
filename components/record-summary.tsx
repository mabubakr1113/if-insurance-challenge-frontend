import type { HomeRecord } from '@/lib/contract';
import { fmtDate } from '@/lib/format';
import { Stat } from './ui';

export function recordStats(r: HomeRecord) {
  const family = r.visits.filter((v) => v.visitorType === 'family').length;
  const partner = r.visits.length - family;
  const checkedBefore = r.alerts.filter((a) => a.actionedBeforeDate).length;
  const start = r.home.activatedAt ? fmtDate(r.home.activatedAt, { year: true }) : 'not started';
  const end = r.home.closedAt ? fmtDate(r.home.closedAt, { year: true }) : 'today';
  return { family, partner, checkedBefore, period: `${start} → ${end}` };
}

export function RecordSummary({ record: r }: { record: HomeRecord }) {
  const s = recordStats(r);
  return (
    <div className="flex flex-col gap-3">
      <p>
        <span className="text-muted">Period:</span> {s.period}
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Visits" value={r.visits.length} hint={`${s.family} family · ${s.partner} partner`} />
        <Stat label="Tasks completed" value={r.completedTasks.length} />
        <Stat label="Open tasks" value={r.openTasks.length} />
        <Stat label="Weather alerts" value={r.alerts.length} hint={`${s.checkedBefore} checked before the day`} />
        <Stat label="Local visits" value={r.bookings.length} />
      </dl>
    </div>
  );
}
