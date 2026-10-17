import type { Metadata } from 'next';
import { acceptInvite, continueAs, declineInvite } from '@/app/actions/invites';
import { ActionForm, Field, SubmitButton } from '@/components/forms';
import { input, select } from '@/components/styles';
import { Card, Notice, PageHeader } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import type { InviteView } from '@/lib/contract';
import { options, RELATION } from '@/lib/labels';

export const metadata: Metadata = { title: 'Invitation from If' };

const DEMO_TOKEN = 'demo-virtanen';
const DEMO_PREFILL = { name: 'Aino Virtanen', relation: 'child', city: 'Helsinki', phone: '+358 40 000 0201' };

export default async function InvitePage({ params }: PageProps<'/invite/[token]'>) {
  const { token } = await params;
  let invite: InviteView;
  try {
    invite = await api<InviteView>(`/api/invites/${encodeURIComponent(token)}`, { actor: null });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return (
        <div className="mx-auto max-w-xl py-12 text-center">
          <h1 className="text-2xl font-semibold">This invitation link isn’t valid.</h1>
          <p className="mt-2 text-muted">Check the link in the message from If, or open the demo.</p>
        </div>
      );
    }
    throw err;
  }

  const estate = invite.home.estateName ?? 'the person who died';
  const prefill = token === DEMO_TOKEN ? DEMO_PREFILL : null;

  if (invite.status === 'declined') {
    return (
      <div className="mx-auto max-w-xl py-12">
        <PageHeader title="This invitation is closed." intro={`${invite.home.addressLine}, ${invite.home.city}`} />
      </div>
    );
  }

  if (invite.alreadyAcceptedBy) {
    const landing = invite.status === 'setup' ? `/setup/${invite.home.id}` : `/homes/${invite.home.id}`;
    return (
      <div className="mx-auto max-w-xl">
        <PageHeader title="Invitation from If" intro={`${invite.home.addressLine}, ${invite.home.postalCode} ${invite.home.city}`} />
        <Card>
          <p>This invitation was accepted by {invite.alreadyAcceptedBy.name}.</p>
          <ActionForm action={continueAs.bind(null, token, invite.home.id, invite.alreadyAcceptedBy.id, landing)} className="mt-4">
            <SubmitButton pendingText="Opening…">Continue as {invite.alreadyAcceptedBy.name}</SubmitButton>
            <p className="mt-2 text-sm text-muted">A demo convenience: in a real service, they would sign in.</p>
          </ActionForm>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-muted">From {invite.fromLabel}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Help looking after the home</h1>
        <p className="mt-3 text-lg leading-relaxed">{invite.message}</p>
      </div>

      <Card title="What you get">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>A short care plan based on the home and the policy’s rules</li>
          <li>Share tasks with your family and see who’s on what</li>
          <li>Book a local check visit when nobody can go (priced, and only if you approve)</li>
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <h3 className="font-medium">Cost</h3>
            <p className="text-sm text-muted">The plan is free. Local visits are optional and priced before you approve (prototype prices).</p>
          </div>
          <div>
            <h3 className="font-medium">Privacy</h3>
            <p className="text-sm text-muted">Only people you invite can see this home. You can close the plan at any time.</p>
          </div>
        </div>
      </Card>

      <Card title="Accept and start">
        <ActionForm action={acceptInvite.bind(null, token)} className="flex flex-col gap-4">
          <Field label="Your name" name="name">
            <input id="name" name="name" className={input} required autoComplete="name" defaultValue={prefill?.name} />
          </Field>
          <Field label={`Your relation to ${estate}`} name="relation">
            <select id="relation" name="relation" className={select} required defaultValue={prefill?.relation ?? ''}>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" name="city" optional>
              <input id="city" name="city" className={input} autoComplete="address-level2" defaultValue={prefill?.city} />
            </Field>
            <Field label="Phone" name="phone" optional>
              <input id="phone" name="phone" type="tel" className={input} autoComplete="tel" defaultValue={prefill?.phone} />
            </Field>
            <Field label="Email" name="email" optional>
              <input id="email" name="email" type="email" className={input} autoComplete="email" />
            </Field>
          </div>
          <div>
            <SubmitButton pendingText="Starting…">Accept and start</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Card title="Not the right time?">
        <ActionForm action={declineInvite.bind(null, token)} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <SubmitButton variant="secondary" name="reason" value="someone_lives_there">
              Someone still lives in the home
            </SubmitButton>
            <SubmitButton variant="secondary" name="reason" value="not_now">
              Not now
            </SubmitButton>
            <SubmitButton variant="secondary" name="reason" value="not_responsible">
              I’m not the right person
            </SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <Notice>All people and homes in this prototype are fictional. Messages are simulated.</Notice>
    </div>
  );
}
