import { inviteMember } from '@/app/actions/members';
import { options, RELATION, ROLE, ROLE_MEANING } from '@/lib/labels';
import { ActionForm, Field, SubmitButton } from './forms';
import { RadioGroup } from './radio-group';
import { checkbox, input, select } from './styles';

export function InviteMemberForm({ homeId, estateName }: { homeId: string; estateName: string | null }) {
  return (
    <ActionForm action={inviteMember.bind(null, homeId)} resetOnSuccess className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name">
          <input id="name" name="name" className={input} required autoComplete="off" />
        </Field>
        <Field label={`Relation to ${estateName ?? 'the person who died'}`} name="relation">
          <select id="relation" name="relation" className={select} required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {options(RELATION).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <RadioGroup
        legend="Role"
        name="role"
        defaultValue="helper"
        choices={(['helper', 'viewer', 'coordinator'] as const).map((r) => ({ value: r, label: ROLE[r], description: ROLE_MEANING[r].charAt(0).toUpperCase() + ROLE_MEANING[r].slice(1) }))}
      />
      <label className="flex items-start gap-3">
        <input type="checkbox" name="canAuthorise" className={checkbox} />
        <span>
          Can approve local visits
          <span className="block text-sm text-muted">May authorise a partner’s access to the home. Not available for viewers.</span>
        </span>
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Phone" name="phone" optional>
          <input id="phone" name="phone" type="tel" className={input} autoComplete="off" />
        </Field>
        <Field label="Email" name="email" optional>
          <input id="email" name="email" type="email" className={input} autoComplete="off" />
        </Field>
        <Field label="City" name="city" optional>
          <input id="city" name="city" className={input} autoComplete="off" />
        </Field>
      </div>
      <div>
        <SubmitButton pendingText="Inviting…">Send invitation</SubmitButton>
      </div>
    </ActionForm>
  );
}
