import type { Metadata } from 'next';
import { removeMember, updateMemberAccess, updateMemberDetails } from '@/app/actions/members';
import { Dialog } from '@/components/dialog';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from '@/components/forms';
import { Icon } from '@/components/icons';
import { InviteMemberForm } from '@/components/invite-member-form';
import { input } from '@/components/styles';
import { Avatar, Badge, ButtonLink, Card, PageHeader } from '@/components/ui';
import type { Member } from '@/lib/contract';
import { fmtDate } from '@/lib/format';
import { getHome, getMembers, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { firstName, RELATION, ROLE } from '@/lib/labels';

export const metadata: Metadata = { title: 'Family' };

const ROLES = ['coordinator', 'helper', 'viewer'] as const;
const chipBase = 'inline-flex h-[30px] cursor-pointer items-center gap-1 rounded-full border px-[11px] text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50';

export default async function FamilyPage({ params, searchParams }: PageProps<'/homes/[homeId]/family'>) {
  const { homeId } = await params;
  const sp = await searchParams;
  const me = await requireMember(homeId);
  const [home, members] = await Promise.all([getHome(homeId), getMembers(homeId)]);
  const closed = isClosed(home);
  const coordinator = isCoordinator(me.member) && !closed;
  const self = members.find((m) => m.id === me.member.id) ?? me.member;
  const estate = home.estateName ?? 'the person who died';
  const familyHref = `/homes/${homeId}/family`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Family"
        intro="Everyone who helps look after the home, and what they can do."
        actions={
          coordinator ? (
            <ButtonLink href={`${familyHref}?invite=1`} icon="plus" scroll={false}>
              Invite someone
            </ButtonLink>
          ) : null
        }
      />

      <ul className="grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))]">
        {members.map((m) => (
          <li key={m.id}>
            <MemberCard member={m} isMe={m.id === me.member.id} estate={estate} manage={coordinator && m.id !== me.member.id} />
          </li>
        ))}
      </ul>

      {!closed ? (
        <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))]">
          <Card size="section" title="Your details" className="gap-3.5">
            <ActionForm action={updateMemberDetails.bind(null, self.id)} className="flex flex-col gap-3.5">
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
                <Field label="Name" name="name" htmlFor="self-name">
                  <input id="self-name" name="name" className={input} defaultValue={self.name} autoComplete="name" />
                </Field>
                <Field label="City" name="city" htmlFor="self-city">
                  <input id="self-city" name="city" className={input} defaultValue={self.city ?? ''} autoComplete="address-level2" />
                </Field>
                <Field label="Phone" name="phone" htmlFor="self-phone">
                  <input id="self-phone" name="phone" type="tel" className={input} defaultValue={self.phone ?? ''} autoComplete="tel" />
                </Field>
                <Field label="Email" name="email" htmlFor="self-email">
                  <input id="self-email" name="email" type="email" className={input} defaultValue={self.email ?? ''} autoComplete="email" />
                </Field>
              </div>
              <div>
                <SubmitButton variant="secondary" pendingText="Saving…">
                  Save my details
                </SubmitButton>
              </div>
            </ActionForm>
          </Card>
        </div>
      ) : null}

      {coordinator && sp.invite === '1' ? (
        <Dialog title="Invite someone" closeHref={familyHref} width="md">
          <InviteMemberForm homeId={homeId} estateName={home.estateName} />
        </Dialog>
      ) : null}
    </div>
  );
}

function MemberCard({ member: m, isMe, estate, manage }: { member: Member; isMe: boolean; estate: string; manage: boolean }) {
  const invited = m.status === 'invited';
  const via = [m.phone ? 'SMS' : null, m.email ? 'email' : null].filter(Boolean).join(' and ') || 'link';
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar name={m.name} size={44} invited={invited} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-semibold">
            {m.name}
            {isMe ? <span className="font-normal text-muted"> (you)</span> : null}
          </span>
          <span className="text-[13px] text-muted">
            {RELATION[m.relation]} of {estate}
            {m.city ? ` · ${m.city}` : ''}
          </span>
        </div>
        <Badge tone="role" size="md">
          {ROLE[m.role]}
        </Badge>
      </div>
      <div className="flex flex-col gap-0.5 text-[13px]">
        <span>{invited ? `Invited by ${via} (simulated), not joined yet` : `Joined${m.joinedAt ? ` ${fmtDate(m.joinedAt)}` : ''}`}</span>
        <span className="text-muted">
          {m.stats.openTasks} open · {m.stats.doneTasks} done · {m.stats.visits} {m.stats.visits === 1 ? 'visit' : 'visits'}
          {m.canAuthorise ? ' · can approve visits' : ''}
        </span>
      </div>

      {manage ? (
        <div className="flex flex-col gap-2.5 border-t border-line-soft pt-3">
          <ActionForm action={updateMemberAccess.bind(null, m.id)} aria-label={`Role for ${m.name}`}>
            {m.canAuthorise ? <input type="hidden" name="canAuthorise" value="true" /> : null}
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => {
                const on = m.role === r;
                return (
                  <button
                    key={r}
                    type="submit"
                    name="role"
                    value={r}
                    aria-pressed={on}
                    disabled={on}
                    className={`${chipBase} ${on ? 'border-ink bg-ink text-white disabled:opacity-100' : 'border-line-input bg-white text-ink hover:bg-hover-btn'}`}
                  >
                    {ROLE[r]}
                  </button>
                );
              })}
            </div>
          </ActionForm>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ActionForm action={updateMemberAccess.bind(null, m.id)}>
              <input type="hidden" name="role" value={m.role} />
              <button
                type="submit"
                name="canAuthorise"
                value={m.canAuthorise ? 'false' : 'true'}
                aria-pressed={m.canAuthorise}
                disabled={m.role === 'viewer'}
                title={m.role === 'viewer' ? 'Viewers can’t approve visits' : undefined}
                className={`${chipBase} ${m.canAuthorise ? 'border-ok bg-ok-soft text-ok' : 'border-line-input bg-white text-muted hover:bg-hover-btn'}`}
              >
                {m.canAuthorise ? <Icon name="check" size={12} strokeWidth={3} /> : null}
                {m.canAuthorise ? 'Can approve visits' : 'Can’t approve visits'}
              </button>
            </ActionForm>
            <ActionForm action={removeMember.bind(null, m.id)}>
              <ConfirmSubmit
                label="Remove"
                title={`Remove ${firstName(m.name)}?`}
                confirmLabel="Yes, remove"
                cancelLabel="Keep them"
                triggerVariant="dangerQuiet"
                triggerSize="sm"
                pendingText="Removing…"
              >
                Their open tasks go back to “Nobody yet”. They can no longer see the home.
              </ConfirmSubmit>
            </ActionForm>
          </div>
        </div>
      ) : null}
    </article>
  );
}
