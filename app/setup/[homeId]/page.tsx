import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { activateHome, closeInvitation, saveSetupStep } from '@/app/actions/setup';
import { Dialog } from '@/components/dialog';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { InviteMemberForm } from '@/components/invite-member-form';
import { ChipGroup } from '@/components/radio-group';
import { button, input, textarea } from '@/components/styles';
import { Notice } from '@/components/ui';
import type { FormAction } from '@/lib/action-state';
import { api } from '@/lib/api';
import { rememberedInvite } from '@/lib/actor';
import type { DemoState, Home, Member, PersonasResponse } from '@/lib/contract';
import { fmtDate } from '@/lib/format';
import { getHome, getMembers, isClosed, requireMember } from '@/lib/guards';
import { BUILDING, HEATING, HOME_STATUS, options, RELATION, ROLE, WATER, whoseHome, YES_NO } from '@/lib/labels';

export const metadata: Metadata = { title: 'Set up the home' };

const STEPS = ['The home', 'Access', 'Heating and water', 'Family', 'Review'];

const chipsOf = <T extends string>(labels: Record<T, string>) => options(labels).map(([value, label]) => ({ value, label }));

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

/** One card per step: 26px padding, 18px corners, 22px between questions. */
function StepCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`flex flex-col gap-[22px] rounded-[18px] border border-line bg-card p-[26px] ${className}`}>{children}</section>;
}

export default async function SetupPage({ params, searchParams }: PageProps<'/setup/[homeId]'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId, { allowSetup: true });
  const home = await getHome(homeId);

  if (home.status === 'active') redirect(`/homes/${homeId}`);
  const whose = whoseHome(home.estateName).replace(/^The/, 'the');

  if (isClosed(home) || me.member.role !== 'coordinator') {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-muted">
            {home.addressLine}, {home.city}
          </span>
          <h1 className="font-display text-[38px] leading-[1.1] font-normal tracking-[-0.025em]">
            {isClosed(home) ? 'This invitation is closed' : 'The home is being set up'}
          </h1>
        </div>
        <StepCard>
          <p className="text-[15px] leading-[1.55]">
            {isClosed(home)
              ? home.status === 'declined'
                ? 'Home Watch is for homes nobody lives in. If someone still lives there, they can keep using their own home insurance as usual.'
                : `This plan was closed (${HOME_STATUS[home.status]}).`
              : 'The coordinator is answering a few questions about the home. You’ll see the care plan here once it’s ready.'}
          </p>
        </StepCard>
      </div>
    );
  }

  const rawStep = Number(typeof sp.step === 'string' ? sp.step : 1);
  const step = Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 5 ? rawStep : 1;
  const save = saveSetupStep.bind(null, homeId, step, me.member.id);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">
          {home.addressLine}, {home.city}
        </span>
        <h1 className="font-display text-[38px] leading-[1.1] font-normal tracking-[-0.025em]">Setting up {whose}</h1>
      </div>

      <nav aria-label="Setup steps" className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold">
          Step {step} of 5 · {STEPS[step - 1]}
        </span>
        <ol className="grid grid-cols-5 gap-1.5">
          {STEPS.map((name, i) => (
            <li key={name}>
              <Link href={`/setup/${homeId}?step=${i + 1}`} aria-current={i + 1 === step ? 'step' : undefined} className="flex flex-col gap-1.5 text-left">
                <span aria-hidden="true" className={`h-1 w-full rounded-full ${i < step ? 'bg-ink' : 'bg-[#e8dad1]'}`} />
                <span className={`text-xs ${i + 1 === step ? 'font-bold text-ink' : 'font-medium text-step-text'}`}>
                  <span className="hidden min-[520px]:inline">{name}</span>
                  <span className="min-[520px]:hidden">{i + 1}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {step === 1 ? <StepHome home={home} save={save} token={await inviteTokenFor(homeId)} occupancyError={sp.error === 'occupancy'} /> : null}
      {step === 2 ? <StepAccess home={home} me={me.member} save={save} /> : null}
      {step === 3 ? <StepHeating home={home} save={save} /> : null}
      {step === 4 ? <StepFamily home={home} members={await getMembers(homeId)} /> : null}
      {step === 5 ? <StepReview home={home} me={me.member} members={await getMembers(homeId)} /> : null}
    </div>
  );
}

function Buttons({ step, homeId, children }: { step: number; homeId: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 pt-1.5">
      {step > 1 ? (
        <Link href={`/setup/${homeId}?step=${step - 1}`} className={button('secondary', 'xl')}>
          Back
        </Link>
      ) : null}
      <span className="flex-1" />
      {children ?? (
        <SubmitButton size="xl" pendingText="Saving…">
          Continue
        </SubmitButton>
      )}
    </div>
  );
}

function StepHome({ home, save, token, occupancyError }: { home: Home; save: FormAction; token: string | null; occupancyError: boolean }) {
  return (
    <StepCard className="occupancy-step">
      {occupancyError ? (
        <Notice tone="warning" role="alert">
          Please confirm that nobody lives in the home before creating the care plan.
        </Notice>
      ) : null}
      <ActionForm action={save} className="flex flex-col gap-[22px]">
        <ChipGroup
          legend="Is anyone living in the home now?"
          name="occupancy"
          size="xl"
          defaultValue={home.occupancyConfirmed ? 'empty' : null}
          choices={[
            { value: 'empty', label: 'No, it’s empty' },
            { value: 'occupied', label: 'Yes, someone lives there' },
          ]}
        />
        <div className="if-empty flex flex-col gap-[22px]">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))]">
            <Field label="Empty since" name="vacantSince">
              <input id="vacantSince" name="vacantSince" type="date" className={input} defaultValue={home.vacantSince ?? ''} />
            </Field>
            <Field label="Last visit" name="lastKnownVisit">
              <input id="lastKnownVisit" name="lastKnownVisit" type="date" className={input} defaultValue={home.lastKnownVisit ?? ''} />
            </Field>
            <Field label="Year built" name="yearBuilt">
              <input id="yearBuilt" name="yearBuilt" inputMode="numeric" className={input} defaultValue={home.yearBuilt ?? ''} />
            </Field>
          </div>
          <ChipGroup legend="Building type" name="buildingType" size="lg" defaultValue={home.buildingType} choices={chipsOf(BUILDING)} />
          <Buttons step={1} homeId={home.id} />
        </div>
      </ActionForm>
      <div className="if-occupied flex-col gap-3 rounded-xl bg-accent-soft p-4">
        <span className="text-sm leading-[1.55]">
          Home Watch is for homes nobody lives in. If someone still lives there, they can keep using their own home insurance as usual.
        </span>
        {token ? (
          <ActionForm action={closeInvitation.bind(null, home.id, token)}>
            <SubmitButton variant="outline" pendingText="Closing…">
              Close this invitation
            </SubmitButton>
          </ActionForm>
        ) : (
          <span className="text-[13px] text-muted">To close the invitation, use the link in the message from If.</span>
        )}
      </div>
    </StepCard>
  );
}

function StepAccess({ home, me, save }: { home: Home; me: Member; save: FormAction }) {
  const current = home.authorityConfirmed ? (me.canAuthorise ? 'yes' : 'other') : null;
  return (
    <StepCard>
      <ActionForm action={save} className="flex flex-col gap-[22px]">
        <ChipGroup
          legend="Can you authorise access to the home, for example for a local visit?"
          name="authority"
          defaultValue={current}
          size="lg"
          hint="If someone else can, invite them in step 4 and let them approve visits. Not sure is fine: you can still share tasks."
          choices={[
            { value: 'yes', label: 'Yes' },
            { value: 'other', label: 'No, someone else can' },
            { value: 'unsure', label: 'Not sure yet' },
          ]}
        />
        <Field label="Who has keys?" name="keyHolder">
          <input id="keyHolder" name="keyHolder" className={input} defaultValue={home.keyHolder ?? ''} />
        </Field>
        <Field label="Anything a visitor should know about access?" name="accessNotes" hint="Don’t write alarm codes or key-box codes here.">
          <textarea id="accessNotes" name="accessNotes" className={textarea} defaultValue={home.accessNotes ?? ''} />
        </Field>
        <Buttons step={2} homeId={home.id} />
      </ActionForm>
    </StepCard>
  );
}

function StepHeating({ home, save }: { home: Home; save: FormAction }) {
  return (
    <StepCard>
      <ActionForm action={save} className="flex flex-col gap-[22px]">
        <p className="text-sm text-muted">“Not sure” is fine. It becomes a “not confirmed” item to check on the first visit.</p>
        <ChipGroup legend="How is the home heated?" name="heatingType" defaultValue={home.heatingType} choices={chipsOf(HEATING)} />
        <ChipGroup legend="Is the heating on?" name="heatingOn" defaultValue={home.heatingOn} choices={chipsOf(YES_NO)} />
        <ChipGroup legend="Where does the water come from?" name="waterSource" defaultValue={home.waterSource} choices={chipsOf(WATER)} />
        <ChipGroup
          legend="Is the main water valve closed?"
          name="waterMainClosed"
          defaultValue={home.waterMainClosed}
          choices={chipsOf(YES_NO)}
          hint="If’s home terms say it should be closed when the home is empty for more than a week."
        />
        <ChipGroup legend="Is there a burglar alarm?" name="hasAlarm" defaultValue={home.hasAlarm} choices={chipsOf(YES_NO)} />
        <Buttons step={3} homeId={home.id} />
      </ActionForm>
    </StepCard>
  );
}

function StepFamily({ home, members }: { home: Home; members: Member[] }) {
  return (
    <StepCard>
      <h2 className="text-[15px] font-semibold">Who’s helping?</h2>
      <ul className="-mt-2.5 flex flex-col">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap justify-between gap-2.5 border-b border-skeleton-soft py-2.5 text-sm">
            <span className="font-semibold">{m.name}</span>
            <span className="text-muted">
              {ROLE[m.role]} · {RELATION[m.relation]}
              {m.canAuthorise ? ' · can approve visits' : ''}
              {m.status === 'invited' ? ' · invited' : ''}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <span className="self-start">
          <Dialog title="Invite someone" trigger="Invite someone" triggerVariant="secondary">
            <InviteMemberForm homeId={home.id} estateName={home.estateName} />
          </Dialog>
        </span>
        <span className="text-[13px] text-muted">Invitations are simulated: they appear in the person’s Messages. You can also skip this and invite people later.</span>
      </div>
      <Buttons step={4} homeId={home.id}>
        <Link href={`/setup/${home.id}?step=5`} className={button('primary', 'xl')}>
          Continue
        </Link>
      </Buttons>
    </StepCard>
  );
}

function StepReview({ home, me, members }: { home: Home; me: Member; members: Member[] }) {
  const unsure: string[] = [];
  if (!home.heatingType || home.heatingType === 'unknown') unsure.push('How the home is heated');
  if (!home.heatingOn || home.heatingOn === 'unknown') unsure.push('Whether the heating is on');
  if (!home.waterSource || home.waterSource === 'unknown') unsure.push('Where the water comes from');
  if (!home.waterMainClosed || home.waterMainClosed === 'unknown') unsure.push('Whether the main water valve is closed');
  if (!home.hasAlarm || home.hasAlarm === 'unknown') unsure.push('Whether there is a burglar alarm');
  const yn = (v: Home['heatingOn']) => (v ? YES_NO[v] : null);

  const blocks: { title: string; step: number; rows: [string, ReactNode][] }[] = [
    {
      title: 'The home',
      step: 1,
      rows: [
        ['Anyone living there', home.occupancyConfirmed ? 'No, it’s empty' : null],
        ['Empty since', home.vacantSince ? fmtDate(home.vacantSince, { year: true }) : null],
        ['Last visit', home.lastKnownVisit ? fmtDate(home.lastKnownVisit, { year: true }) : null],
        ['Building', home.buildingType ? `${BUILDING[home.buildingType]}${home.yearBuilt ? `, built ${home.yearBuilt}` : ''}` : home.yearBuilt],
      ],
    },
    {
      title: 'Access',
      step: 2,
      rows: [
        ['Can authorise access', home.authorityConfirmed ? (me.canAuthorise ? 'Yes, you can' : 'Someone else in the family can') : 'Not sure yet'],
        ['Who has keys', home.keyHolder],
        ['Access notes', home.accessNotes],
      ],
    },
    {
      title: 'Heating and water',
      step: 3,
      rows: [
        ['Heating', home.heatingType ? HEATING[home.heatingType] : null],
        ['Heating on', yn(home.heatingOn)],
        ['Water', home.waterSource ? WATER[home.waterSource] : null],
        ['Main valve closed', yn(home.waterMainClosed)],
        ['Burglar alarm', yn(home.hasAlarm)],
      ],
    },
    {
      title: 'Family',
      step: 4,
      rows: members.map((m) => [m.name, `${ROLE[m.role]}${m.canAuthorise ? ' · can approve visits' : ''}${m.status === 'invited' ? ' · invited' : ''}`]),
    },
  ];

  return (
    <StepCard>
      {blocks.map((b) => (
        <div key={b.title} className="flex flex-col gap-1.5 border-b border-skeleton-soft pb-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">{b.title}</h2>
            <Link href={`/setup/${home.id}?step=${b.step}`} className="text-[13px] font-semibold text-muted underline underline-offset-[3px] hover:text-ink">
              Edit<span className="sr-only"> {b.title}</span>
            </Link>
          </div>
          <dl className="flex flex-col gap-1">
            {b.rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(120px,170px)_minmax(0,1fr)] gap-2.5 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd>{v === null || v === undefined || v === '' ? <span className="text-muted">Not answered</span> : v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      {unsure.length ? (
        <div className="flex flex-col gap-1 rounded-xl bg-attention-soft px-4 py-3.5 text-sm text-attention-ink">
          <strong>Will be checked on the first visit:</strong>
          <ul>
            {unsure.map((u) => (
              <li key={u}>· {u}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <span className="text-[13px] text-muted">The plan is based on If’s published home terms and practical advice. Check the terms version on your own policy.</span>
      <ActionForm action={activateHome.bind(null, home.id)}>
        <Buttons step={5} homeId={home.id}>
          <SubmitButton size="xl" pendingText="Creating the plan…">
            Create the care plan
          </SubmitButton>
        </Buttons>
      </ActionForm>
    </StepCard>
  );
}
