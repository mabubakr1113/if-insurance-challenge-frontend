import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { completePartnerVisit, resetDemo, simulateWeather, stopViewing, viewAs } from '@/app/actions/demo';
import { ActionForm, ConfirmSubmit, SubmitButton } from '@/components/forms';
import { StartDemoLink } from '@/components/start-demo-link';
import { button, link, row } from '@/components/styles';
import { Badge, Card, Eyebrow, initials, ListBox, Notice, PageHeader, SimLabel } from '@/components/ui';
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
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          <PageHeader title="Demo" />
          <Notice tone="warning" title="The Home Watch service isn’t responding." role="alert">
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
  const currentActor = me ? (me.kind === 'member' ? `member:${me.member.id}` : me.kind === 'partner' ? `partner:${me.partner.id}` : 'staff') : null;
  const mainActive = state.mainHomeStatus === 'active';
  const latest = state.latestBooking;
  const canComplete = !!latest && COMPLETABLE.includes(latest.status);
  const firstPersona = (title: string, match: (label: string) => boolean) =>
    personas.groups.find((g) => g.title.startsWith(title))?.personas.find((p) => match(p.label));
  const aino = firstPersona('Demo story', (l) => l.startsWith('Aino'));
  const mikko = firstPersona('Demo story', (l) => l.startsWith('Mikko'));
  const storyStatus = STORY_STATUS[state.mainHomeStatus] ?? 'Plan closed';

  const script: { text: string; href?: string }[] = [
    { text: 'Open the invitation as Aino and accept', href: personas.inviteUrl },
    { text: 'Answer the 5 setup questions → create the care plan', href: aino ? aino.landing : undefined },
    { text: 'Family page: invite Mikko (helper) → Care plan: assign him “First visit”', href: `/homes/${state.mainHomeId}/family` },
    { text: 'View as Mikko → House notes: add the water main valve with a photo → record a visit', href: mikko ? `#persona-${mikko.actor}` : undefined },
    { text: 'Presenter: cold night', href: '#simulated-events' },
    { text: 'View as Aino → Overview → book a local visit for the heating check → approve and book', href: aino ? `#persona-${aino.actor}` : undefined },
    { text: 'Presenter: complete the partner visit', href: '#simulated-events' },
    { text: 'As Aino: Overview, then Record → download or print', href: `/homes/${state.mainHomeId}/record` },
    { text: 'View as If pilot team → Pilot dashboard', href: '#persona-staff' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Demo" intro="Explore without an account. Everyone sees the same shared demo data." actions={<StartDemoLink />} />

      {start === 'unavailable' ? (
        <Notice tone="warning" role="alert">
          We couldn’t open the example home. Try again or choose a demo person below.
        </Notice>
      ) : null}

      {next ? (
        <Notice tone="info" role="status">
          Choose a person to continue to <code className="font-mono text-[13px]">{next}</code>.
        </Notice>
      ) : null}

      {me && who ? (
        <Card size="section" title="Currently viewing as" className="gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px]">
              <span className="font-semibold">{who.name}</span> · {who.role}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={who.home} className={button('primary', 'sm')}>
                Open
              </Link>
              <ActionForm action={stopViewing}>
                <SubmitButton variant="secondary" size="sm">
                  Stop viewing
                </SubmitButton>
              </ActionForm>
            </div>
          </div>
        </Card>
      ) : null}

      <Card size="section" title="Start the story" action={<Badge tone={mainActive ? 'ok' : 'neutral'}>{storyStatus}</Badge>} className="gap-1.5">
        <p className="text-[15px]">
          <Link href={personas.inviteUrl} className={link}>
            Open Aino’s invitation from If
          </Link>
        </p>
        <p className="text-[13px] text-muted">The Virtanen home, Kaarina: {storyStatus.toLowerCase()}.</p>
      </Card>

      <section aria-labelledby="personas" className="flex flex-col gap-4">
        <h2 id="personas" className="font-display text-[26px] font-normal">
          People
        </h2>
        {personas.groups.map((group) => (
          <section key={group.title} aria-label={group.title} className="flex flex-col gap-2">
            <Eyebrow as="h3">{group.title}</Eyebrow>
            <p className="-mt-1 text-[13px] text-muted">{group.description}</p>
            {group.personas.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-line-input p-[18px] text-sm text-muted">Nobody here yet. Accept the invitation first.</p>
            ) : (
              <ListBox>
                {group.personas.map((p) => {
                  const current = p.actor === currentActor;
                  return (
                    <div key={p.actor} id={`persona-${p.actor}`} className={`flex flex-wrap items-center justify-between gap-3 px-[18px] py-3 ${row}`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span aria-hidden="true" className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-bold">
                          {initials(p.label)}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-semibold">{p.label}</span>
                          <span className="text-xs text-muted">{p.subtitle}</span>
                        </span>
                      </div>
                      <ActionForm action={viewAs.bind(null, p.actor, p.landing, next)}>
                        <SubmitButton variant={current ? 'secondary' : 'primary'} size="sm" pendingText="Switching…">
                          {current ? 'Viewing now' : 'View as'}
                        </SubmitButton>
                      </ActionForm>
                    </div>
                  );
                })}
              </ListBox>
            )}
          </section>
        ))}
      </section>

      <Card id="simulated-events" size="section" title="Simulated events" action={<SimLabel>Presenter controls</SimLabel>} className="scroll-mt-6 gap-1">
        <p className="mb-2 text-[13px] text-muted">
          These stand in for the real world during the demo. Forecast in use: {state.forecastSource === 'simulated' ? 'Simulated forecast (demo)' : 'Open-Meteo (real)'}.
        </p>
        <ul className="flex flex-col">
          <Control
            title="Cold night (−18 °C) at the Virtanen home"
            explain="Sets tomorrow’s forecast to a hard frost. The heating check becomes urgent and the family is told."
            disabledNote={mainActive ? undefined : 'Available once the Virtanen care plan is active.'}
          >
            <ActionForm action={simulateWeather.bind(null, state.mainHomeId, 'cold-night')}>
              <SubmitButton disabled={!mainActive} variant="sim" size="sm" pendingText="Sending…">
                Simulate: cold night
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control
            title="Storm at the Virtanen home"
            explain="Sets tomorrow’s forecast to strong gusts. A check after the storm is added."
            disabledNote={mainActive ? undefined : 'Available once the Virtanen care plan is active.'}
          >
            <ActionForm action={simulateWeather.bind(null, state.mainHomeId, 'storm')}>
              <SubmitButton disabled={!mainActive} variant="sim" size="sm" pendingText="Sending…">
                Simulate: storm
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control
            title="Back to the real forecast"
            explain={`Fetches the real Open-Meteo forecast again. Now using: ${state.forecastSource === 'simulated' ? 'simulated forecast' : 'real forecast'}.`}
            disabledNote={mainActive ? undefined : 'Available once the Virtanen care plan is active.'}
          >
            <ActionForm action={simulateWeather.bind(null, state.mainHomeId, 'clear-weather')}>
              <SubmitButton disabled={!mainActive} variant="secondary" size="sm" pendingText="Fetching…">
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
              <SubmitButton disabled={!canComplete} variant="sim" size="sm" pendingText="Completing…">
                Simulate: partner visit done
              </SubmitButton>
            </ActionForm>
          </Control>
          <Control title="Reset all demo data" explain="Deletes everything created in the demo and restores the starting point.">
            <ActionForm action={resetDemo}>
              <ConfirmSubmit
                label="Reset demo data"
                title="Reset the demo?"
                confirmLabel="Yes, reset everything"
                cancelLabel="Cancel"
                pendingText="Resetting…"
                triggerClassName="inline-flex h-8 cursor-pointer items-center rounded-lg border border-concern-line bg-card px-3 text-[13px] font-semibold text-concern hover:bg-concern-soft"
              >
                This deletes everything created in the demo. Everyone using the demo sees the reset.
              </ConfirmSubmit>
            </ActionForm>
          </Control>
        </ul>
      </Card>

      <Card size="section" title="Demo script" className="gap-1">
        <ol className="flex flex-col">
          {script.map((step, i) => (
            <li key={i} className="flex items-start justify-between gap-3 border-b border-line-soft py-2.5 last:border-0">
              <span className="flex gap-3">
                <span aria-hidden="true" className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-normal">{step.text}</span>
              </span>
              {step.href ? (
                <Link href={step.href} className={button('secondary', 'xs')}>
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

function Control({ title, explain, disabledNote, children }: { title: string; explain: string; disabledNote?: string; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-2 border-b border-line-soft py-3.5 last:border-0 wide:flex-row wide:items-start wide:justify-between">
      <div className="flex max-w-xl flex-col gap-0.5">
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="text-[13px] text-muted">{explain}</p>
        {disabledNote ? <p className="text-[13px] text-attention">{disabledNote}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}
