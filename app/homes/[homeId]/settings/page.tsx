import type { Metadata } from 'next';
import { saveHomeSettings, transitionHome } from '@/app/actions/homes';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from '@/components/forms';
import { RadioGroup } from '@/components/radio-group';
import { checkbox, input, link, textarea } from '@/components/styles';
import { Card, Facts, Notice, PageHeader } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { getHome, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { BUILDING, HEATING, HOME_STATUS, options, WATER, YES_NO } from '@/lib/labels';

export const metadata: Metadata = { title: 'Settings' };

const choices = <T extends string>(labels: Record<T, string>) => options(labels).map(([value, label]) => ({ value, label }));

export default async function SettingsPage({ params }: PageProps<'/homes/[homeId]/settings'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  const home = await getHome(homeId);
  const closed = isClosed(home);
  const coordinator = isCoordinator(me.member) && !closed;
  const yn = (v: typeof home.heatingOn) => (v ? YES_NO[v] : null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings and what happens next" />

      <Card title="Home details">
        <Facts
          items={[
            ['Address', `${home.addressLine}, ${home.postalCode} ${home.city}`],
            ['Estate of', home.estateName],
            ['Building type', home.buildingType ? BUILDING[home.buildingType] : null],
            ['Year built', home.yearBuilt],
            ['Status', HOME_STATUS[home.status]],
          ]}
        />
      </Card>

      <Card title="Setup answers">
        {coordinator ? (
          <ActionForm action={saveHomeSettings.bind(null, homeId)} className="flex flex-col gap-5">
            <Notice>Changing these won’t change existing tasks. Add or edit tasks in the plan if needed.</Notice>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Empty since" name="vacantSince" optional>
                <input id="vacantSince" name="vacantSince" type="date" className={input} defaultValue={home.vacantSince ?? ''} />
              </Field>
              <Field label="Last visit before Home Watch" name="lastKnownVisit" optional>
                <input id="lastKnownVisit" name="lastKnownVisit" type="date" className={input} defaultValue={home.lastKnownVisit ?? ''} />
              </Field>
            </div>
            <RadioGroup legend="Building type" name="buildingType" columns defaultValue={home.buildingType} choices={choices(BUILDING)} />
            <Field label="Year built" name="yearBuilt" optional>
              <input id="yearBuilt" name="yearBuilt" inputMode="numeric" className={`${input} max-w-40`} defaultValue={home.yearBuilt ?? ''} />
            </Field>
            <Field label="Who has keys?" name="keyHolder" optional>
              <input id="keyHolder" name="keyHolder" className={input} defaultValue={home.keyHolder ?? ''} />
            </Field>
            <Field label="Access notes" name="accessNotes" optional hint="Don’t write alarm codes or key-box codes here.">
              <textarea id="accessNotes" name="accessNotes" className={textarea} defaultValue={home.accessNotes ?? ''} />
            </Field>
            <RadioGroup legend="How is the home heated?" name="heatingType" columns defaultValue={home.heatingType} choices={choices(HEATING)} />
            <RadioGroup legend="Is the heating on?" name="heatingOn" columns defaultValue={home.heatingOn} choices={choices(YES_NO)} />
            <RadioGroup legend="Where does the water come from?" name="waterSource" columns defaultValue={home.waterSource} choices={choices(WATER)} />
            <RadioGroup legend="Is the main water valve closed?" name="waterMainClosed" columns defaultValue={home.waterMainClosed} choices={choices(YES_NO)} />
            <RadioGroup legend="Is there a burglar alarm?" name="hasAlarm" columns defaultValue={home.hasAlarm} choices={choices(YES_NO)} />
            <div>
              <SubmitButton variant="secondary" pendingText="Saving…">
                Save answers
              </SubmitButton>
            </div>
          </ActionForm>
        ) : (
          <Facts
            items={[
              ['Empty since', home.vacantSince ? fmtDate(home.vacantSince, { year: true }) : null],
              ['Last visit before Home Watch', home.lastKnownVisit ? fmtDate(home.lastKnownVisit, { year: true }) : null],
              ['Who has keys', home.keyHolder],
              ['Access notes', home.accessNotes],
              ['Heating', home.heatingType ? HEATING[home.heatingType] : null],
              ['Heating on', yn(home.heatingOn)],
              ['Water', home.waterSource ? WATER[home.waterSource] : null],
              ['Main water valve closed', yn(home.waterMainClosed)],
              ['Burglar alarm', yn(home.hasAlarm)],
            ]}
          />
        )}
      </Card>

      <Card title="What happens to the home next?">
        {closed ? (
          <p>
            This plan was closed{home.closedAt ? ` on ${fmtDate(home.closedAt, { year: true })}` : ''}
            {home.closeReason ? ` (${home.closeReason})` : ''}.
            {home.newOwnerWantsCoverHelp ? ' The new owner asked for help with home insurance.' : ''}
          </p>
        ) : coordinator ? (
          <ActionForm action={transitionHome.bind(null, homeId)} className="transition-step flex flex-col gap-5">
            <RadioGroup
              legend="Choose what has happened"
              name="status"
              required
              choices={[
                { value: 'occupied', label: 'Someone lives there again', description: 'A family member or a tenant has moved in.' },
                { value: 'sold', label: 'Sold', description: 'The home has a new owner.' },
                { value: 'transferred', label: 'Passed to an heir', description: 'The estate is divided and someone in the family owns the home now.' },
                { value: 'closed', label: 'Close the plan for another reason', description: 'For example, the family arranged care some other way.' },
              ]}
            />
            <label className="flex items-start gap-3">
              <input type="checkbox" name="newOwnerWantsCoverHelp" className={checkbox} />
              <span>
                The new owner would like help arranging home insurance
                <span className="block text-sm text-muted">Optional, for sold or passed to an heir. If will only contact them if they ask.</span>
              </span>
            </label>
            <Field label="Note" name="note" optional>
              <textarea id="note" name="note" className={textarea} maxLength={2000} />
            </Field>
            <ConfirmSubmit label="Close the plan" confirmLabel="Yes, close the plan" cancelLabel="Not yet">
              <p className="font-medium">What happens:</p>
              <ul className="mt-1 list-disc pl-5">
                <li>Open tasks are cancelled</li>
                <li>Active local visits are cancelled</li>
                <li>Everything stays readable</li>
                <li>You can still download the record</li>
              </ul>
            </ConfirmSubmit>
          </ActionForm>
        ) : (
          <p className="text-muted">The coordinator can close the plan when the home is lived in again, sold or passed to an heir.</p>
        )}
      </Card>

      <Card title="Data and privacy">
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-medium">What’s stored</dt>
            <dd className="text-muted">House notes, photos, visit records, and the names and contact details of invited family.</dd>
          </div>
          <div>
            <dt className="font-medium">Who sees it</dt>
            <dd className="text-muted">
              Invited family. A visit partner sees only the address, access details, essential notes and the checklist for their visit.
            </dd>
          </div>
        </dl>
        <p className="mt-3">
          <a href={`/homes/${homeId}/record/download`} className={link} download>
            Download the record
          </a>
        </p>
        <p className="mt-2 text-sm text-muted">In a real service you could delete all data here.</p>
      </Card>
    </div>
  );
}
