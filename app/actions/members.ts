'use server';

import type { ActionState } from '@/lib/action-state';
import { act, checked, invalid, nullable, oneOf, optional, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { InviteMemberBody, Member, MemberPatch, Relation, Role } from '@/lib/contract';
import { firstName } from '@/lib/labels';

const RELATIONS: Relation[] = ['child', 'spouse', 'sibling', 'grandchild', 'relative', 'friend', 'other'];
const ROLES: Role[] = ['coordinator', 'helper', 'viewer'];

export async function inviteMember(homeId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const relation = oneOf(fd, 'relation', RELATIONS);
  const role = oneOf(fd, 'role', ROLES);
  const name = text(fd, 'name');
  // One "Phone or email" field; separate phone/email fields still work.
  const contact = text(fd, 'contact');
  const email = optional(fd, 'email') ?? (contact.includes('@') ? contact : undefined);
  const phone = optional(fd, 'phone') ?? (contact && !contact.includes('@') ? contact : undefined);
  if (!name || !relation || !role || (!email && !phone)) {
    return invalid({
      ...(name ? {} : { name: 'Add their name.' }),
      ...(email || phone ? {} : { contact: 'We need a phone number or email to send the link.' }),
      ...(relation ? {} : { relation: 'Choose their relation.' }),
      ...(role ? {} : { role: 'Choose a role.' }),
    });
  }
  const body: InviteMemberBody = {
    name,
    relation,
    role,
    canAuthorise: role !== 'viewer' && checked(fd, 'canAuthorise'),
    phone,
    email,
    city: optional(fd, 'city'),
  };
  return act(() => api<{ member: Member; joinPath: string }>(`/api/homes/${homeId}/members`, { body }), {
    message: () => `Invitation sent by ${phone ? 'SMS' : 'email'} (simulated).`,
  });
}

/** Coordinators change role and approval rights. */
export async function updateMemberAccess(memberId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const role = oneOf(fd, 'role', ROLES);
  const body: MemberPatch = { canAuthorise: role !== 'viewer' && checked(fd, 'canAuthorise') };
  if (role) body.role = role;
  return act(() => api<Member>(`/api/members/${memberId}`, { method: 'PATCH', body }), {
    message: (m) => `${firstName(m.name)} is now ${m.role === 'helper' ? 'a helper' : m.role === 'viewer' ? 'a viewer' : 'a coordinator'}${m.canAuthorise ? ' and can approve local visits' : ''}.`,
  });
}

/** Anyone edits their own name and contact details. */
export async function updateMemberDetails(memberId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const name = text(fd, 'name');
  if (!name) return invalid({ name: 'Add your name.' });
  const body: MemberPatch = { name, email: nullable(fd, 'email'), phone: nullable(fd, 'phone'), city: nullable(fd, 'city') };
  return act(() => api<Member>(`/api/members/${memberId}`, { method: 'PATCH', body }), { message: 'Your details are saved.' });
}

export async function removeMember(memberId: string): Promise<ActionState> {
  return act(() => api<{ ok: true }>(`/api/members/${memberId}`, { method: 'DELETE' }), {
    message: 'Removed. Their open tasks went back to “Nobody yet”.',
  });
}
