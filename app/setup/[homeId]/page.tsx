import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { activateHome, closeInvitation, saveSetupStep } from '@/app/actions/setup';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import type { FormAction } from '@/lib/action-state';
import { InviteMemberForm } from '@/components/invite-member-form';
import { RadioGroup } from '@/components/radio-group';
import { btnSecondary, input, link, textarea } from '@/components/styles';
import { Badge, ButtonLink, Card, Facts, Notice } from '@/components/ui';
import { api } from '@/lib/api';
import { rememberedInvite } from '@/lib/actor';
import type { DemoState, Home, Member, PersonasResponse } from '@/lib/contract';
import { fmtDate } from '@/lib/format';
import { getHome, getMembers, isClosed, requireMember } from '@/lib/guards';
import { BUILDING, HEATING, HOME_STATUS, options, RELATION, ROLE, WATER, YES_NO, whoseHome } from '@/lib/labels';

export const metadata: Metadata = { title: 'Set up the home' };

const STEPS = ['The home', 'Access', 'Heating and water', 'Family', 'Review'];

const notSure = <T extends string>(labels: Record<T, string>) => options(labels).map(([value, label]) => ({ value, label }));

/** Setup step 1 needs the invitation token to close an invitation; the demo home's comes from the demo API. */
async function inviteTokenFor(homeId: string): Promise<string | null> {
  const remembered = await rememberedInvite(homeId);
  if (remembered) return remembered;
  try {
    const [state, personas] = await Promise.all([
      api<DemoState>('/api/demo/state', { actor: null }),
      api<PersonasResponse>('/api/demo/personas', { actor: null }),
    ]);
    return state.mainHomeId === homeId ? (personas.inviteUrl.split('/').pop() ?? null) : null;
  } catch {
    return null;
  }
}

export default async function SetupPage({ params, searchParams }: PageProps<'/setup/[homeId]'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId, { allowSetup: true });
  const home = await getHome(homeId);

  if (home.status === 'active') redirect(`/homes/${homeId}`);
  const heading = (
    <div className="mb-6">
      <p className="text-sm text-muted">
        Setting up {whoseHome(home.estateName).replace(/^The/, 'the')} · {home.addressLine}, {home.city}
      </p>
    </div>
  );

  if (isClosed(home)) {
    return (
      <div className="mx-auto max-w-2xl">
        {heading}
        <Card title="This invitation is closed">
          <p>
            {home.status === 'declined'
              ? 'Home Watch is for homes nobody lives in. If someone still lives there, they can keep using their own home insurance as usual.'
              : `This plan was closed (${HOME_STATUS[home.status]}).`}
          </p>
        </Card>
      </div>
    );
  }

  if (me.member.role !== 'coordinator') {
    return (
      <div className="mx-auto max-w-2xl">
        {heading}
        <Card title="The home is being set up">
          <p>The coordinator is answering a few questions about the home. You’ll see the care plan here once it’s ready.</p>
        </Card>
      </div>
    );
  }

  const rawStep = Number(typeof sp.step === 'string' ? sp.step : 1);
  const step = Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 5 ? rawStep : 1;
  const save = saveSetupStep.bind(null, homeId, step, me.member.id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Setting up {whoseHome(home.estateName).replace(/^The/, 'the')}</h1>
      <p className="mt-1 text-muted">
        {home.addressLine}, {home.city}
      </p>

      <nav aria-label="Setup steps" className="mt-6">
        <p className="text-sm font-medium">
          Step {step} of 5: {STEPS[step - 1]}
        </p>
        <ol className="mt-2 grid grid-cols-5 gap-1.5">
          {STEPS.map((name, i) => (
            <li key={name}>
              <Link
                href={`/setup/${homeId}?step=${i + 1}`}
                aria-current={i + 1 === step ? 'step' : undefined}
                className={`block rounded-md border-t-4 pt-1.5 text-xs ${i + 1 === step ? 'border-accent font-semibold text-ink' : i + 1 < step ? 'border-accent/40 text-muted' : 'border-line text-muted'}`}
              >
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{i + 1}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-6">
        {step === 1 ? <StepHome home={home} save={save} token={await inviteTokenFor(homeId)} occupancyError={sp.error === 'occupancy'} /> : null}
        {step === 2 ? <StepAccess home={home} me={me.member} save={save} /> : null}
        {step === 3 ? <StepHeating home={home} save={save} /> : null}
        {step === 4 ? <StepFamily home={home} members={await getMembers(homeId)} /> : null}
        {step === 5 ? <StepReview home={home} me={me.member} members={await getMembers(homeId)} /> : null}
      </div>
    </div>
  );
}

type Save = FormAction;

function Buttons({ step, homeId }: { step: number; homeId: string }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {step > 1 ? (
        <Link href={`/setup/${homeId}?step=${step - 1}`} className={btnSecondary}>
          Back
        </Link>
      ) : null}
      <SubmitButton pendingText="Saving…">Continue</SubmitButton>
    </div>
  );
}

function StepHome({ home, save, token, occupancyError }: { home: Home; save: Save; token: string | null; occupancyError: boolean }) {
  return (
    <Card title="The home" className="occupancy-step">
      {occupancyError ? (
        <div className="mb-4">
          <Notice tone="attention" role="alert">
            Please confirm that nobody lives in the home before creating the care plan.
          </Notice>
        </div>
      ) : null}
      <ActionForm action={save} className="flex flex-col gap-5">
        <RadioGroup
          legend="Is anyone living in the home now?"
          name="occupancy"
          required
          defaultValue={home.occupancyConfirmed ? 'empty' : null}
          choices={[
            { value: 'empty', label: 'No, it’s empty' },
            { value: 'occupied', label: 'Yes, someone lives there' },
          ]}
        />
        <div className="if-empty flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Since when has it been empty?" name="vacantSince" optional>
              <input id="vacantSince" name="vacantSince" type="date" className={input} defaultValue={home.vacantSince ?? ''} />
            </Field>
            <Field label="When did someone last visit?" name="lastKnownVisit" optional>
              <input id="lastKnownVisit" name="lastKnownVisit" type="date" className={input} defaultValue={home.lastKnownVisit ?? ''} />
            </Field>
          </div>
          <RadioGroup legend="Building type" name="buildingType" columns defaultValue={home.buildingType} choices={notSure(BUILDING)} />
          <Field label="Year built" name="yearBuilt" optional>
            <input id="yearBuilt" name="yearBuilt" inputMode="numeric" className={`${input} max-w-40`} defaultValue={home.yearBuilt ?? ''} />
          </Field>
          <Buttons step={1} homeId={home.id} />
        </div>
      </ActionForm>
      <div className="if-occupied mt-4">
        <Notice tone="accent">
          Home Watch is for homes nobody lives in. If someone still lives there, they can keep using their own home insurance as usual.
        </Notice>
        {token ? (
          <ActionForm action={closeInvitation.bind(null, home.id, token)} className="mt-3">
            <SubmitButton variant="secondary" pendingText="Closing…">
              Close this invitation
            </SubmitButton>
          </ActionForm>
        ) : (
          <p className="mt-3 text-sm text-muted">To close the invitation, use the link in the message from If.</p>
        )}
      </div>
    </Card>
  );
}

function StepAccess({ home, me, save }: { home: Home; me: Member; save: Save }) {
  const current = home.authorityConfirmed ? (me.canAuthorise ? 'yes' : 'other') : null;
  return (
    <Card title="Access and authority">
      <ActionForm action={save} className="flex flex-col gap-5">
        <RadioGroup
          legend="Can you authorise access to the home, for example for a local visit?"
          name="authority"
          defaultValue={current}
          choices={[
            { value: 'yes', label: 'Yes' },
            { value: 'other', label: 'No, someone else can', description: 'Invite them in step 4 and let them approve visits.' },
            {
              value: 'unsure',
              label: 'Not sure yet',
              description: 'You can still share tasks. Booking a local visit needs someone who can authorise access.',
            },
          ]}
        />
        <Field label="Who has keys?" name="keyHolder" optional>
          <input id="keyHolder" name="keyHolder" className={input} defaultValue={home.keyHolder ?? ''} />
        </Field>
        <Field label="Anything a visitor should know about access?" name="accessNotes" optional hint="Don’t write alarm codes or key-box codes here.">
          <textarea id="accessNotes" name="accessNotes" className={textarea} defaultValue={home.accessNotes ?? ''} />
        </Field>
        <Buttons step={2} homeId={home.id} />
      </ActionForm>
    </Card>
  );
}

function StepHeating({ home, save }: { home: Home; save: Save }) {
  return (
    <Card title="Heating and water">
      <p className="-mt-1 mb-4 text-sm text-muted">Not sure is fine. It becomes a “not confirmed” item to check on the first visit.</p>
      <ActionForm action={save} className="flex flex-col gap-5">
        <RadioGroup legend="How is the home heated?" name="heatingType" columns defaultValue={home.heatingType} choices={notSure(HEATING)} />
        <RadioGroup legend="Is the heating on?" name="heatingOn" columns defaultValue={home.heatingOn} choices={notSure(YES_NO)} />
        <RadioGroup legend="Where does the water come from?" name="waterSource" columns defaultValue={home.waterSource} choices={notSure(WATER)} />
        <RadioGroup
          legend="Is the main water valve closed?"
          name="waterMainClosed"
          columns
          defaultValue={home.waterMainClosed}
          choices={notSure(YES_NO)}
          hint="If’s home terms say it should be closed when the home is unoccupied for more than a week."
        />
        <RadioGroup legend="Is there a burglar alarm?" name="hasAlarm" columns defaultValue={home.hasAlarm} choices={notSure(YES_NO)} />
        <Buttons step={3} homeId={home.id} />
      </ActionForm>
    </Card>
  );
}

function StepFamily({ home, members }: { home: Home; members: Member[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Card title="Family">
        <ul className="divide-y divide-line">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium">{m.name}</span> <span className="text-sm text-muted">· {RELATION[m.relation]}</span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                <Badge>{ROLE[m.role]}</Badge>
                {m.canAuthorise ? <Badge tone="accent">Can approve visits</Badge> : null}
                {m.status === 'invited' ? <Badge tone="attention">Invited</Badge> : null}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Invite someone">
        <p className="-mt-1 mb-4 text-sm text-muted">
          Invitations are simulated: in this demo they appear in the person’s Messages, and you can switch to them from the Demo page.
        </p>
        <InviteMemberForm homeId={home.id} estateName={home.estateName} />
      </Card>
      <div className="flex flex-wrap gap-2">
        <Link href={`/setup/${home.id}?step=3`} className={btnSecondary}>
          Back
        </Link>
        <ButtonLink href={`/setup/${home.id}?step=5`}>Continue</ButtonLink>
        <ButtonLink href={`/setup/${home.id}?step=5`} variant="secondary">
          Skip for now
        </ButtonLink>
      </div>
    </div>
  );
}

function StepReview({ home, me, members }: { home: Home; me: Member; members: Member[] }) {
  const unsure: string[] = [];
  if (!home.heatingType || home.heatingType === 'unknown') unsure.push('how the home is heated');
  if (!home.heatingOn || home.heatingOn === 'unknown') unsure.push('whether the heating is on');
  if (!home.waterSource || home.waterSource === 'unknown') unsure.push('where the water comes from');
  if (!home.waterMainClosed || home.waterMainClosed === 'unknown') unsure.push('whether the main water valve is closed');
  if (!home.hasAlarm || home.hasAlarm === 'unknown') unsure.push('whether there is a burglar alarm');
  const edit = (step: number) => (
    <Link href={`/setup/${home.id}?step=${step}`} className={link}>
      Edit<span className="sr-only"> {STEPS[step - 1]}</span>
    </Link>
  );
  const yn = (v: Home['heatingOn']) => (v ? YES_NO[v] : null);

  return (
    <div className="flex flex-col gap-4">
      <Card title="The home" action={edit(1)}>
        <Facts
          items={[
            ['Anyone living there', home.occupancyConfirmed ? 'No, it’s empty' : null],
            ['Empty since', home.vacantSince ? fmtDate(home.vacantSince, { year: true }) : null],
            ['Last visit', home.lastKnownVisit ? fmtDate(home.lastKnownVisit, { year: true }) : null],
            ['Building type', home.buildingType ? BUILDING[home.buildingType] : null],
            ['Year built', home.yearBuilt],
          ]}
        />
      </Card>
      <Card title="Access" action={edit(2)}>
        <Facts
          items={[
            ['Can authorise access', home.authorityConfirmed ? (me.canAuthorise ? 'Yes, you can' : 'Someone else in the family can') : 'Not sure yet'],
            ['Who has keys', home.keyHolder],
            ['Access notes', home.accessNotes],
          ]}
        />
      </Card>
      <Card title="Heating and water" action={edit(3)}>
        <Facts
          items={[
            ['Heating', home.heatingType ? HEATING[home.heatingType] : null],
            ['Heating on', yn(home.heatingOn)],
            ['Water', home.waterSource ? WATER[home.waterSource] : null],
            ['Main water valve closed', yn(home.waterMainClosed)],
            ['Burglar alarm', yn(home.hasAlarm)],
          ]}
        />
      </Card>
      <Card title="Family" action={edit(4)}>
        <ul className="flex flex-col gap-1">
          {members.map((m) => (
            <li key={m.id}>
              {m.name} · {ROLE[m.role]}
              {m.canAuthorise ? ' · can approve visits' : ''}
              {m.status === 'invited' ? ' · invited' : ''}
            </li>
          ))}
        </ul>
      </Card>
      {unsure.length ? (
        <Notice tone="attention" title="Will be checked on the first visit:">
          <ul className="list-disc pl-5">
            {unsure.map((u) => (
              <li key={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      <p className="text-sm text-muted">The plan is based on If’s published home terms and practical advice. Check the terms version on your own policy.</p>
      <ActionForm action={activateHome.bind(null, home.id)} className="flex flex-wrap gap-2">
        <Link href={`/setup/${home.id}?step=4`} className={btnSecondary}>
          Back
        </Link>
        <SubmitButton pendingText="Creating the plan…">Create the care plan</SubmitButton>
      </ActionForm>
    </div>
  );
}
