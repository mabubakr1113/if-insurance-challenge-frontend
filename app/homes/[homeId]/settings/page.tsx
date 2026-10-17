import type { Metadata } from 'next';
import Link from 'next/link';
import { resetDemo } from '@/app/actions/demo';
import { saveHomeSettings, transitionHome } from '@/app/actions/homes';
import { Dialog, DialogActions, DialogCancel } from '@/components/dialog';
import { ActionForm, ConfirmSubmit, Field, FieldError, SubmitButton } from '@/components/forms';
import { Checkbox, ChipGroup } from '@/components/radio-group';
import { chip, h1, input, textarea } from '@/components/styles';
import { Card, Facts } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { getHome, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { BUILDING, HEATING, options, WATER, YES_NO } from '@/lib/labels';

export const metadata: Metadata = { title: 'Settings' };

const choices = <T extends string>(labels: Record<T, string>) => options(labels).map(([value, label]) => ({ value, label }));

const STATUS_CHOICES = [
  { value: '', label: 'Still empty' },
  { value: 'occupied', label: 'Lived in again' },
  { value: 'sold', label: 'Sold' },
  { value: 'transferred', label: 'Passed to an heir' },
];

export default async function SettingsPage({ params, searchParams }: PageProps<'/homes/[homeId]/settings'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const home = await getHome(homeId);
  const closed = isClosed(home);
  const coordinator = isCoordinator(me.member) && !closed;
  const yn = (v: typeof home.heatingOn) => (v ? YES_NO[v].toLowerCase() : 'not answered');
  const settingsHref = `/homes/${homeId}/settings`;

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-5">
      <h1 className={h1}>Settings</h1>

      <Card
        size="section"
        title="The home"
        className="gap-2"
        action={
          coordinator ? (
            <Link href={`${settingsHref}?edit=1`} scroll={false} className="text-[13px] font-semibold text-muted hover:text-ink">
              Edit answers <span aria-hidden="true">→</span>
            </Link>
          ) : null
        }
      >
        <Facts
          className="mt-1"
          items={[
            ['Address', `${home.addressLine}, ${home.postalCode} ${home.city}`],
            ['Building', home.buildingType ? `${BUILDING[home.buildingType]}${home.yearBuilt ? `, built ${home.yearBuilt}` : ''}` : home.yearBuilt ? `Built ${home.yearBuilt}` : null],
            ['Empty since', home.vacantSince ? fmtDate(home.vacantSince, { year: true }) : null],
            ['Heating', home.heatingType ? `${HEATING[home.heatingType]} · on: ${yn(home.heatingOn)}` : null],
            ['Water', home.waterSource ? `${WATER[home.waterSource]} · main valve closed: ${yn(home.waterMainClosed)}` : null],
            ['Burglar alarm', home.hasAlarm ? YES_NO[home.hasAlarm] : null],
            ['Keys', home.keyHolder],
          ]}
        />
      </Card>

      <Card size="section" title="What’s happening with the home?" className="gap-3.5">
        {closed ? (
          <p className="text-sm">
            This plan was closed{home.closedAt ? ` on ${fmtDate(home.closedAt, { year: true })}` : ''}
            {home.closeReason ? ` (${home.closeReason})` : ''}.{home.newOwnerWantsCoverHelp ? ' The new owner asked for help with home insurance.' : ''}
          </p>
        ) : (
          <p className="text-sm text-muted">When the home is lived in again, sold or passed on, close the plan. The record stays available to everyone.</p>
        )}
        {coordinator ? (
          <ActionForm action={transitionHome.bind(null, homeId)} className="transition-step flex flex-col gap-3.5">
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">What has happened</legend>
              <div className="flex flex-wrap gap-2">
                {STATUS_CHOICES.map((c) => (
                  <label key={c.value} className={chip('lg')}>
                    <input type="radio" name="status" value={c.value} defaultChecked={c.value === ''} className="hw-peer" />
                    {c.label}
                  </label>
                ))}
              </div>
              <FieldError name="status" />
            </fieldset>
            <div className="if-cover">
              <Checkbox name="newOwnerWantsCoverHelp" description="If will only contact them if they ask.">
                The new owner would like help arranging home insurance
              </Checkbox>
            </div>
            <div className="if-transition">
              <ConfirmSubmit
                label="Close the plan"
                title="Close the plan?"
                confirmLabel="Yes, close the plan"
                cancelLabel="Keep it open"
                triggerVariant="danger"
                pendingText="Closing…"
              >
                <p>
                  <span className="if-status" data-status="occupied">The home is marked as lived in again. </span>
                  <span className="if-status" data-status="sold">The home is marked as sold. </span>
                  <span className="if-status" data-status="transferred">The home is marked as passed to an heir. </span>
                  Open tasks stop, nobody gets new reminders, and the record stays readable and downloadable.
                </p>
              </ConfirmSubmit>
            </div>
          </ActionForm>
        ) : !closed ? (
          <p className="text-sm text-muted">The coordinator can close the plan when the home is lived in again, sold or passed to an heir.</p>
        ) : null}
      </Card>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-[22px]">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">Demo data</h2>
          <span className="text-sm text-muted">Put every task, visit and note back to how the demo started.</span>
        </div>
        <ActionForm action={resetDemo}>
          <ConfirmSubmit
            label="Reset demo data"
            title="Reset the demo?"
            confirmLabel="Yes, reset everything"
            cancelLabel="Cancel"
            pendingText="Resetting…"
            triggerClassName="inline-flex h-10 cursor-pointer items-center rounded-[10px] border border-concern-line bg-card px-3.5 text-sm font-semibold text-concern hover:bg-concern-soft"
          >
            This deletes everything created in the demo and restores the starting point. Everyone using the demo sees the reset.
          </ConfirmSubmit>
        </ActionForm>
      </section>

      {coordinator && sp.edit === '1' ? (
        <Dialog title="The home" description="Changing these won’t change existing tasks. Add or edit tasks in the plan if needed." closeHref={settingsHref} width="lg">
          <ActionForm action={saveHomeSettings.bind(null, homeId)} className="flex flex-col gap-[18px]">
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
              <Field label="Empty since" name="vacantSince">
                <input id="vacantSince" name="vacantSince" type="date" className={input} defaultValue={home.vacantSince ?? ''} />
              </Field>
              <Field label="Last visit before" name="lastKnownVisit">
                <input id="lastKnownVisit" name="lastKnownVisit" type="date" className={input} defaultValue={home.lastKnownVisit ?? ''} />
              </Field>
              <Field label="Year built" name="yearBuilt">
                <input id="yearBuilt" name="yearBuilt" inputMode="numeric" className={input} defaultValue={home.yearBuilt ?? ''} />
              </Field>
            </div>
            <ChipGroup legend="Building type" legendSize="sm" name="buildingType" size="sm" defaultValue={home.buildingType} choices={choices(BUILDING)} />
            <Field label="Who has keys?" name="keyHolder">
              <input id="keyHolder" name="keyHolder" className={input} defaultValue={home.keyHolder ?? ''} />
            </Field>
            <Field label="Access notes" name="accessNotes" hint="Don’t write alarm codes or key-box codes here.">
              <textarea id="accessNotes" name="accessNotes" className={textarea} defaultValue={home.accessNotes ?? ''} />
            </Field>
            <ChipGroup legend="How is the home heated?" legendSize="sm" name="heatingType" size="sm" defaultValue={home.heatingType} choices={choices(HEATING)} />
            <ChipGroup legend="Is the heating on?" legendSize="sm" name="heatingOn" size="sm" defaultValue={home.heatingOn} choices={choices(YES_NO)} />
            <ChipGroup legend="Where does the water come from?" legendSize="sm" name="waterSource" size="sm" defaultValue={home.waterSource} choices={choices(WATER)} />
            <ChipGroup legend="Is the main water valve closed?" legendSize="sm" name="waterMainClosed" size="sm" defaultValue={home.waterMainClosed} choices={choices(YES_NO)} />
            <ChipGroup legend="Is there a burglar alarm?" legendSize="sm" name="hasAlarm" size="sm" defaultValue={home.hasAlarm} choices={choices(YES_NO)} />
            <DialogActions>
              <DialogCancel />
              <SubmitButton pendingText="Saving…">Save answers</SubmitButton>
            </DialogActions>
          </ActionForm>
        </Dialog>
      ) : null}
    </div>
  );
}
