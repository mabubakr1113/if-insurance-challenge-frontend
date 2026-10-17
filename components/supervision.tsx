import type { Supervision } from '@/lib/contract';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { supervisionText } from '@/lib/labels';
import { link } from './styles';
import { Badge } from './ui';

const STATE: Record<Supervision['state'], { label: string; tone: 'ok' | 'attention' | 'neutral' }> = {
  no_visit_yet: { label: 'No visit yet', tone: 'attention' },
  ok: { label: 'On track', tone: 'ok' },
  due_soon: { label: 'Visit due soon', tone: 'neutral' },
  overdue: { label: 'Visit overdue', tone: 'attention' },
};

export function SupervisionSummary({ supervision: s }: { supervision: Supervision }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATE[s.state].tone}>{STATE[s.state].label}</Badge>
      </div>
      <p className="text-base">{supervisionText(s)}</p>
      <ul className="text-sm text-muted">
        {s.lastVisitAt ? (
          <li>
            Last visit: {fmtDateTime(s.lastVisitAt)}
            {s.lastVisitorName ? ` by ${s.lastVisitorName}` : ''}
          </li>
        ) : null}
        <li>Next visit due by {fmtDate(s.nextDueAt)}</li>
      </ul>
      <p className="text-sm text-muted">
        {s.ruleLabel}{' '}
        {s.source.url ? (
          <a href={s.source.url} className={link} target="_blank" rel="noreferrer">
            {s.source.label}
          </a>
        ) : (
          s.source.label
        )}
      </p>
    </div>
  );
}
