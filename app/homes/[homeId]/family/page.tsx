import type { Metadata } from 'next';
import { removeMember, updateMemberAccess, updateMemberDetails } from '@/app/actions/members';
import { ActionForm, ConfirmSubmit, Field, SubmitButton } from '@/components/forms';
import { InviteMemberForm } from '@/components/invite-member-form';
import { checkbox, input, select } from '@/components/styles';
import { Badge, Card, Notice, PageHeader } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { getHome, getMembers, isClosed, isCoordinator, requireMember } from '@/lib/guards';
import { AUTHORISE_MEANING, options, RELATION, ROLE, ROLE_MEANING } from '@/lib/labels';

export const metadata: Metadata = { title: 'Family' };

export default async function FamilyPage({ params }: PageProps<'/homes/[homeId]/family'>) {
  const { homeId } = await params;
  const me = await requireMember(homeId);
  const [home, members] = await Promise.all([getHome(homeId), getMembers(homeId)]);
  const closed = isClosed(home);
  const coordinator = isCoordinator(me.member) && !closed;
  const pending = members.filter((m) => m.status === 'invited');
  const self = members.find((m) => m.id === me.member.id) ?? me.member;
  const estate = home.estateName ?? 'the person who died';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Family" intro="Everyone who helps look after the home, and what they can do." />

      <Card title="Roles">
        <dl className="grid gap-2 sm:grid-cols-[14rem_1fr]">
          {(['coordinator', 'helper', 'viewer'] as const).map((r) => (
            <div key={r} className="contents">
              <dt className="font-medium">{ROLE[r]}</dt>
              <dd className="text-muted">{ROLE_MEANING[r]}</dd>
            </div>
          ))}
          <dt className="font-medium">Can approve local visits</dt>
          <dd className="text-muted">{AUTHORISE_MEANING}</dd>
        </dl>
      </Card>

      <section aria-labelledby="members" className="flex flex-col gap-3">
        <h2 id="members" className="text-xl font-semibold">
          Members
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <li key={m.id}>
              <Card as="article" className="h-full">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {m.name}
                      {m.id === me.member.id ? <span className="font-normal text-muted"> (you)</span> : null}
                    </p>
                    <p className="text-sm text-muted">
                      {RELATION[m.relation]} of {estate}
                      {m.city ? ` · ${m.city}` : ''}
                    </p>
                  </div>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge>{ROLE[m.role]}</Badge>
                    {m.canAuthorise ? <Badge tone="accent">Can approve visits</Badge> : null}
                  </span>
                </div>
                <p className="mt-2 text-sm">{m.status === 'invited' ? 'Invited, not joined yet' : `Joined${m.joinedAt ? ` on ${fmtDate(m.joinedAt)}` : ''}`}</p>
                <p className="text-sm text-muted">
                  {m.stats.openTasks} open · {m.stats.doneTasks} done · {m.stats.visits} {m.stats.visits === 1 ? 'visit' : 'visits'}
                  {m.stats.lastVisitAt ? ` · last visit ${fmtDate(m.stats.lastVisitAt)}` : ''}
                </p>

                {coordinator ? (
                  <details className="mt-3 rounded-lg bg-soft px-3 py-2">
                    <summary className="cursor-pointer text-sm font-medium">Change role or remove</summary>
                    <ActionForm action={updateMemberAccess.bind(null, m.id)} className="mt-3 flex flex-col gap-3">
                      <Field label="Role" name="role" htmlFor={`role-${m.id}`}>
                        <select id={`role-${m.id}`} name="role" className={select} defaultValue={m.role}>
                          {options(ROLE).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <label className="flex items-start gap-3 text-sm">
                        <input type="checkbox" name="canAuthorise" className={checkbox} defaultChecked={m.canAuthorise} />
                        <span>Can approve local visits (not for viewers)</span>
                      </label>
                      <div>
                        <SubmitButton variant="secondary" pendingText="Saving…">
                          Save
                        </SubmitButton>
                      </div>
                    </ActionForm>
                    <ActionForm action={removeMember.bind(null, m.id)} className="mt-3 border-t border-line pt-3">
                      <ConfirmSubmit label={`Remove ${m.name.split(' ')[0]}`} confirmLabel="Yes, remove">
                        Their open tasks go back to “Nobody yet”. They can no longer see the home.
                      </ConfirmSubmit>
                    </ActionForm>
                  </details>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      {pending.length ? (
        <Card title="Pending invitations">
          <ul className="flex flex-col gap-2">
            {pending.map((m) => (
              <li key={m.id}>
                <span className="font-medium">{m.name}</span>
                <span className="text-muted">
                  {' '}
                  · invited by {[m.phone ? 'SMS' : null, m.email ? 'email' : null].filter(Boolean).join(' and ') || 'link'} (simulated)
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">
            The join link is shown when someone is invited and appears in their Messages. In this demo you can also switch to them from the Demo page.
          </p>
        </Card>
      ) : null}

      {coordinator ? (
        <Card title="Invite someone">
          <InviteMemberForm homeId={homeId} estateName={home.estateName} />
        </Card>
      ) : null}

      {!closed ? (
        <Card title="Your details">
          <ActionForm action={updateMemberDetails.bind(null, self.id)} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" name="name" htmlFor="self-name">
                <input id="self-name" name="name" className={input} defaultValue={self.name} required autoComplete="name" />
              </Field>
              <Field label="City" name="city" htmlFor="self-city" optional>
                <input id="self-city" name="city" className={input} defaultValue={self.city ?? ''} autoComplete="address-level2" />
              </Field>
              <Field label="Phone" name="phone" htmlFor="self-phone" optional>
                <input id="self-phone" name="phone" type="tel" className={input} defaultValue={self.phone ?? ''} autoComplete="tel" />
              </Field>
              <Field label="Email" name="email" htmlFor="self-email" optional>
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
      ) : null}

      {!coordinator && !closed ? <Notice>Only coordinators can invite people or change roles.</Notice> : null}
    </div>
  );
}
