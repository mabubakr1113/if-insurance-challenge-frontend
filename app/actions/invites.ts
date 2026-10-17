'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { failure, invalid, oneOf, optional, refreshAll, text } from '@/lib/actions';
import { rememberInvite, setActor } from '@/lib/actor';
import { api } from '@/lib/api';
import type { AcceptInviteBody, ActorGrant, DeclineReason, Relation } from '@/lib/contract';

const RELATIONS: Relation[] = ['child', 'spouse', 'sibling', 'grandchild', 'relative', 'friend', 'other'];
const REASONS: DeclineReason[] = ['someone_lives_there', 'not_now', 'not_responsible'];

const DECLINED: Record<DeclineReason, string> = {
  someone_lives_there:
    'Thanks for telling us. Home Watch is for homes nobody lives in. If can still help with the estate’s insurance questions.',
  not_now: 'You can come back to this link at any time.',
  not_responsible: 'Please forward this link to the family member handling the estate.',
};

export async function acceptInvite(token: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const relation = oneOf(fd, 'relation', RELATIONS);
  const body: AcceptInviteBody = {
    name: text(fd, 'name'),
    relation: relation ?? 'child',
    city: optional(fd, 'city'),
    phone: optional(fd, 'phone'),
    email: optional(fd, 'email'),
  };
  if (!body.name || !relation) {
    return invalid({ ...(body.name ? {} : { name: 'Enter your name' }), ...(relation ? {} : { relation: 'Choose your relation' }) });
  }
  let grant: ActorGrant;
  try {
    grant = await api<ActorGrant>(`/api/invites/${encodeURIComponent(token)}/accept`, { body, actor: null });
  } catch (err) {
    return failure(err);
  }
  await setActor(grant.actor);
  if (grant.homeId) await rememberInvite(grant.homeId, token);
  refreshAll();
  redirect(`/setup/${grant.homeId}?step=1`);
}

export async function declineInvite(token: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const reason = oneOf(fd, 'reason', REASONS);
  if (!reason) return { ok: false, error: 'Choose a reason.', at: Date.now() };
  try {
    await api<{ ok: true }>(`/api/invites/${encodeURIComponent(token)}/decline`, { body: { reason }, actor: null });
  } catch (err) {
    return failure(err);
  }
  refreshAll();
  return { ok: true, message: DECLINED[reason], at: Date.now() };
}

/** Demo convenience: view the invitation as the person who already accepted it. */
export async function continueAs(token: string, homeId: string, memberId: string, landing: string): Promise<ActionState> {
  await setActor(`member:${memberId}`);
  await rememberInvite(homeId, token);
  refreshAll();
  redirect(landing);
}

export async function joinFamily(token: string): Promise<ActionState> {
  let grant: ActorGrant;
  try {
    grant = await api<ActorGrant>(`/api/join/${encodeURIComponent(token)}`, { method: 'POST', actor: null });
  } catch (err) {
    return failure(err, { removed: 'This invitation is no longer active.' });
  }
  await setActor(grant.actor);
  refreshAll();
  redirect(`/homes/${grant.homeId}`);
}
