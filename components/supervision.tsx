import type { Supervision } from '@/lib/contract';
import { supervisionText } from '@/lib/labels';
import { Badge, Card } from './ui';

export const SUPERVISION_STATE: Record<Supervision['state'], { label: string; tone: 'ok' | 'attention' | 'neutral' }> = {
  no_visit_yet: { label: 'No visit yet', tone: 'attention' },
  ok: { label: 'On track', tone: 'ok' },
  due_soon: { label: 'Visit due soon', tone: 'neutral' },
  overdue: { label: 'Visit overdue', tone: 'attention' },
};

/** Overview rail: badge + one sentence, no progress bar. */
export function SupervisionCard({ supervision: s }: { supervision: Supervision }) {
  const state = SUPERVISION_STATE[s.state];
  return (
    <Card title="Supervision" action={<Badge tone={state.tone}>{state.label}</Badge>}>
      <p className="text-sm leading-normal text-ink-soft">{supervisionText(s)}</p>
    </Card>
  );
}

/** Visits page: the supervision strip with the rule behind it. */
export function SupervisionStrip({ supervision: s }: { supervision: Supervision }) {
  const state = SUPERVISION_STATE[s.state];
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card px-[22px] py-5">
      <div className="flex flex-[1_1_300px] flex-col gap-1">
        <span className="text-[13px] text-muted">Supervision</span>
        <span className="text-base font-medium">{supervisionText(s)}</span>
        <span className="text-xs text-muted">
          {s.ruleLabel}{' '}
          {s.source.url ? (
            <a href={s.source.url} target="_blank" rel="noreferrer" className="underline decoration-accent underline-offset-2 hover:text-ink">
              {s.source.label}
            </a>
          ) : (
            s.source.label
          )}
        </span>
      </div>
      <Badge tone={state.tone} size="lg">
        {state.label}
      </Badge>
    </section>
  );
}
