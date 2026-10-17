'use server';

import type { ActionState } from '@/lib/action-state';
import { act, checked, invalid, nullable, oneOf, optional, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { InviteMemberBody, Member, MemberPatch, Relation, Role } from '@/lib/contract';

const RELATIONS: Relation[] = ['child', 'spouse', 'sibling', 'grandchild', 'relative', 'friend', 'other'];
const ROLES: Role[] = ['coordinator', 'helper', 'viewer'];

export async function inviteMember(homeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const relation = oneOf(fd, 'relation', RELATIONS);
  const role = oneOf(fd, 'role', ROLES);
  const name = text(fd, 'name');
  if (!name || !relation || !role) {
    return invalid({
      ...(name ? {} : { name: 'Enter their name' }),
      ...(relation ? {} : { relation: 'Choose their relation' }),
      ...(role ? {} : { role: 'Choose a role' }),
    });
  }
  const body: InviteMemberBody = {
    name,
    relation,
    role,
    canAuthorise: role !== 'viewer' && checked(fd, 'canAuthorise'),
    phone: optional(fd, 'phone'),
    email: optional(fd, 'email'),
    city: optional(fd, 'city'),
  };
  return act(() => api<{ member: Member; joinPath: string }>(`/api/homes/${homeId}/members`, { body }), {
    message: (r) =>
      `${r.member.name} is invited. The invitation appears in their Messages (simulated), and you can switch to them from the Demo page. Join link: ${r.joinPath}`,
  });
}

/** Coordinators change role and approval rights. */
export async function updateMemberAccess(memberId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const role = oneOf(fd, 'role', ROLES);
  const body: MemberPatch = { canAuthorise: role !== 'viewer' && checked(fd, 'canAuthorise') };
  if (role) body.role = role;
  return act(() => api<Member>(`/api/members/${memberId}`, { method: 'PATCH', body }), { message: 'Saved.' });
}

/** Anyone edits their own name and contact details. */
export async function updateMemberDetails(memberId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = text(fd, 'name');
  if (!name) return invalid({ name: 'Enter a name' });
  const body: MemberPatch = { name, email: nullable(fd, 'email'), phone: nullable(fd, 'phone'), city: nullable(fd, 'city') };
  return act(() => api<Member>(`/api/members/${memberId}`, { method: 'PATCH', body }), { message: 'Your details are saved.' });
}

export async function removeMember(memberId: string): Promise<ActionState> {
  return act(() => api<{ ok: true }>(`/api/members/${memberId}`, { method: 'DELETE' }), {
    message: 'Removed. Their open tasks are back to “Nobody yet”.',
  });
}
