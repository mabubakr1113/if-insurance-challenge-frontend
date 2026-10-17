import { inviteMember } from '@/app/actions/members';
import { firstName, options, RELATION, ROLE, ROLE_MEANING } from '@/lib/labels';
import { DialogActions, DialogCancel } from './dialog';
import { ActionForm, Field, SubmitButton } from './forms';
import { Checkbox, ChipGroup } from './radio-group';
import { input } from './styles';

/** Invite someone: name, phone or email, relation and role chips, approval rights. Lives in a modal. */
export function InviteMemberForm({ homeId, estateName, inDialog = true }: { homeId: string; estateName: string | null; inDialog?: boolean }) {
  const roles = ['helper', 'viewer', 'coordinator'] as const;
  return (
    <ActionForm action={inviteMember.bind(null, homeId)} resetOnSuccess className="flex flex-col gap-3.5">
      <Field label="Name" name="name">
        <input id="name" name="name" className={input} autoComplete="off" />
      </Field>
      <Field label="Phone or email" name="contact">
        <input id="contact" name="contact" className={input} autoComplete="off" placeholder="+358 40 … or name@example.fi" />
      </Field>
      <ChipGroup
        legend={`Relation to ${estateName ? firstName(estateName) : 'the person who died'}`}
        legendSize="sm"
        name="relation"
        size="sm"
        choices={options(RELATION).map(([value, label]) => ({ value, label }))}
      />
      <div className="flex flex-col gap-2">
        <ChipGroup legend="Role" legendSize="sm" name="role" size="sm" defaultValue="helper" choices={roles.map((r) => ({ value: r, label: ROLE[r] }))} />
        <p className="role-meaning -mt-1 text-[13px] text-muted">
          {roles.map((r) => (
            <span key={r} data-role={r}>
              {ROLE[r]}: {ROLE_MEANING[r]}.
            </span>
          ))}
        </p>
      </div>
      <Checkbox name="canAuthorise" description="May authorise a partner’s access to the home. Not for viewers.">
        Can approve local visits
      </Checkbox>
      {inDialog ? (
        <DialogActions>
          <DialogCancel />
          <SubmitButton pendingText="Sending…">Send invitation</SubmitButton>
        </DialogActions>
      ) : (
        <div>
          <SubmitButton pendingText="Sending…">Send invitation</SubmitButton>
        </div>
      )}
    </ActionForm>
  );
}
