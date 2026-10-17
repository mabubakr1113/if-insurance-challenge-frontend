import type { Metadata } from 'next';
import Link from 'next/link';
import { completePartnerVisit, resetDemo, simulateWeather, stopViewing, viewAs } from '@/app/actions/demo';
import { ActionForm, ConfirmSubmit, SubmitButton } from '@/components/forms';
import { StartDemoLink } from '@/components/start-demo-link';
import { btnSecondary, btnSmall, link } from '@/components/styles';
import { Badge, Card, Notice, PageHeader, SimLabel } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { BookingStatus, DemoState, HomeStatus, PersonasResponse } from '@/lib/contract';
import { UNREACHABLE_MESSAGE } from '@/lib/errors';
import { actorLabel, getMe, safeNext } from '@/lib/guards';
import { BOOKING_STATUS } from '@/lib/labels';

export const metadata: Metadata = { title: 'Demo' };

const STORY_STATUS: Partial<Record<HomeStatus, string>> = {
  invited: 'Not started yet',
  setup: 'Setup in progress',
  active: 'Care plan active',
};

const COMPLETABLE: BookingStatus[] = ['pending_approval', 'requested', 'confirmed', 'in_progress'];

export default async function DemoPage({ searchParams }: PageProps<'/demo'>) {
  const { next: rawNext, start } = await searchParams;
  const next = safeNext(typeof rawNext === 'string' ? rawNext : null);

  let personas: PersonasResponse;
  let state: DemoState;
  try {
    [personas, state] = await Promise.all([
      api<PersonasResponse>('/api/demo/personas', { actor: null }),
      api<DemoState>('/api/demo/state', { actor: null }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.code === 'backend_unreachable') {
      return (
        <div className="mx-auto max-w-xl py-12">
          <PageHeader title="Demo" />
          <Notice tone="attention" title="The Home Watch service isn’t responding." role="alert">
            Start the backend (port 3001) and reload.
          </Notice>
          <p className="sr-only">{UNREACHABLE_MESSAGE}</p>
        </div>
      );
    }
    throw err;
  }
  const me = await getMe();
  const who = me ? actorLabel(me) : null;
  const mainActive = state.mainHomeStatus === 'active';
  const latest = state.latestBooking;
  const canComplete = !!latest && COMPLETABLE.includes(latest.status);
  const firstPersona = (title: string, match: (label: string) => boolean) =>
    personas.groups.find((g) => g.title.startsWith(title))?.personas.find((p) => match(p.label));
  const aino = firstPersona('Demo story', (l) => l.startsWith('Aino'));
  const mikko = firstPersona('Demo story', (l) => l.startsWith('Mikko'));

  const script: { text: string; href?: string; go?: string }[] = [
    { text: 'Open the invitation as Aino and accept', href: personas.inviteUrl },
    { text: 'Answer the 5 setup questions → create the care plan', href: aino ? aino.landing : undefined },
    { text: 'Family page: invite Mikko (helper) → Plan: assign him “First visit”', href: `/homes/${state.mainHomeId}/family` },
    { text: 'View as Mikko → House notes: add the water main valve with a photo → record a visit', href: mikko ? `#persona-${mikko.actor}` : undefined },
    { text: 'Presenter: cold night', href: '#simulated-events' },
    { text: 'View as Aino → Overview → “Request a local visit” for the heating check → approve and book', href: aino ? `#persona-${aino.actor}` : undefined },
    { text: 'Presenter: complete the partner visit', href: '#simulated-events' },
    { text: 'As Aino: Overview, then Record → download or print', href: `/homes/${state.mainHomeId}/record` },
    { text: 'View as If pilot team → Insights', href: '#persona-staff' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Demo" intro="Explore without an account. Everyone sees the same shared demo data." />

      {start === 'unavailable' ? (
        <Notice tone="attention" role="alert">
          We couldn’t open the example home. Try again or choose a demo person below.
        </Notice>
      ) : null}

      <Card title="Explore the example home">
        <p className="mb-4 text-muted">Open a home with a care plan, visits and photos already in place. No signup, login or personal details needed.</p>
        <StartDemoLink />
      </Card>

      {next ? (
        <Notice tone="accent" role="status">
          Choose a person to continue to <code className="font-mono text-sm">{next}</code>.
        </Notice>
      ) : null}

      {me && who ? (
        <Card title="Currently viewing as">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              <span className="font-medium">{who.name}</span> · {who.role}
            </p>
            <ActionForm action={stopViewing} className="flex flex-col items-end">
              <SubmitButton variant="secondary">Stop viewing</SubmitButton>
            </ActionForm>
          </div>
        </Card>
      ) : null}

      <Card title="Start the story">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={personas.inviteUrl} className={link}>
              Open Aino’s invitation from If
            </Link>
            <p className="mt-1 text-sm text-muted">The Virtanen home, Kaarina: {STORY_STATUS[state.mainHomeStatus] ?? 'Plan closed'}</p>
          </div>
          <Badge tone={mainActive ? 'ok' : 'neutral'}>{STORY_STATUS[state.mainHomeStatus] ?? 'Plan closed'}</Badge>
        </div>
      </Card>

      <section aria-labelledby="personas" className="flex flex-col gap-4">
        <h2 id="personas" className="text-xl font-semibold">
          People
        </h2>
        {personas.groups.map((group) => (
          <Card key={group.title} title={group.title}>
            <p className="-mt-1 mb-3 text-sm text-muted">{group.description}</p>
            {group.personas.length === 0 ? (
              <p className="text-sm text-muted">Nobody here yet. Accept the invitation first.</p>
            ) : (
              <ul className="divide-y divide-line">
                {group.personas.map((p) => (
                  <li key={p.actor} id={`persona-${p.actor}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">{p.label}</p>
                      <p className="text-sm text-muted">{p.subtitle}</p>
                    </div>
                    <ActionForm action={viewAs.bind(null, p.actor, p.landing, next)} className="flex flex-col items-end">
                      <SubmitButton variant={me?.kind === 'member' && `member:${me.member.id}` === p.actor ? 'secondary' : 'primary'} pendingText="Switching…">
                        View as
                      </SubmitButton>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </section>

      <Card id="simulated-events" title="Simulated events" action={<SimLabel>Presenter controls</SimLabel>}>
        <p className="-mt-1 mb-4 text-sm text-muted">
          These stand in for the real world during the demo. Forecast in use: {state.forecastSource === 'simulated' ? 'Simulated forecast (demo)' : 'Open-Meteo (real)'}.
        </p>
        <ul className="flex flex-col gap-4">
          <Control
            title="Cold night (−18 °C) at the Virtanen home"
            explain="Sets tomorrow’s forecast to a hard frost. The heating check becomes urgent and the family is told."
            disabledNote={mainActive ? undefined : 'Available once the Virtanen care plan is active.'}
          >
            <ActionForm action={simulateWeather.bind(null, state.mainHomeId, 'cold-night')}>
              <SubmitButton disabled={!mainActive} pendingText="Sending…">
                Cold night
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control
            title="Storm at the Virtanen home"
            explain="Sets tomorrow’s forecast to strong gusts. A check after the storm is added."
            disabledNote={mainActive ? undefined : 'Available once the Virtanen care plan is active.'}
          >
            <ActionForm action={simulateWeather.bind(null, state.mainHomeId, 'storm')}>
              <SubmitButton disabled={!mainActive} variant="secondary" pendingText="Sending…">
                Storm
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control
            title="Back to the real forecast"
            explain={`Fetches the real Open-Meteo forecast again. Now using: ${state.forecastSource === 'simulated' ? 'simulated forecast' : 'real forecast'}.`}
            disabledNote={mainActive ? undefined : 'Available once the Virtanen care plan is active.'}
          >
            <ActionForm action={simulateWeather.bind(null, state.mainHomeId, 'clear-weather')}>
              <SubmitButton disabled={!mainActive} variant="secondary" pendingText="Fetching…">
                Real forecast
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control
            title="Complete the latest partner visit"
            explain={
              latest
                ? `Latest local visit at the Virtanen home: ${BOOKING_STATUS[latest.status]}. Completing it delivers a report with photos and one concern.`
                : 'No local visit has been requested at the Virtanen home yet.'
            }
            disabledNote={canComplete || !latest ? undefined : 'The latest visit is already finished.'}
          >
            <ActionForm action={completePartnerVisit.bind(null, latest?.id ?? '')}>
              <SubmitButton disabled={!canComplete} variant="secondary" pendingText="Completing…">
                Complete visit
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control title="Reset all demo data" explain="Deletes everything created in the demo and restores the starting point.">
            <ActionForm action={resetDemo}>
              <ConfirmSubmit label="Reset demo" confirmLabel="Yes, reset everything" cancelLabel="Cancel">
                This deletes everything created in the demo. Continue?
              </ConfirmSubmit>
            </ActionForm>
          </Control>
        </ul>
      </Card>

      <Card title="Demo script">
        <ol className="flex flex-col gap-3">
          {script.map((step, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <span className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">{i + 1}</span>
                <span>{step.text}</span>
              </span>
              {step.href ? (
                <Link href={step.href} className={`${btnSecondary} ${btnSmall} shrink-0`}>
                  Go<span className="sr-only"> to step {i + 1}</span>
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Control({ title, explain, disabledNote, children }: { title: string; explain: string; disabledNote?: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-2 border-b border-line pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-xl">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted">{explain}</p>
        {disabledNote ? <p className="mt-1 text-sm text-attention">{disabledNote}</p> : null}
      </div>
      <div className="sm:min-w-56 sm:text-right">{children}</div>
    </li>
  );
}
