'use server';

import type { ActionState } from '@/lib/action-state';
import { act, checked, invalid, oneOf, optional, text } from '@/lib/actions';
import { api } from '@/lib/api';
import type { AccessMethod, Booking, CreateBookingBody, PackageKey } from '@/lib/contract';

const PACKAGES: PackageKey[] = ['check', 'winter', 'urgent'];
const ACCESS: AccessMethod[] = ['key_holder_meets', 'key_box', 'partner_collects_key', 'other'];

export async function createBooking(homeId: string, taskId: string | null, canApprove: boolean, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const packageKey = oneOf(fd, 'packageKey', PACKAGES);
  const slotStart = text(fd, 'slotStart');
  const accessMethod = oneOf(fd, 'accessMethod', ACCESS);
  const errors: Record<string, string> = {};
  if (!packageKey) errors.packageKey = 'Choose a visit.';
  if (!slotStart) errors.slotStart = 'Choose a time.';
  if (!accessMethod) errors.accessMethod = 'Choose how the partner gets in.';
  if (canApprove && !checked(fd, 'confirmAuthority')) errors.confirmAuthority = 'Confirm you can authorise access.';
  if (Object.keys(errors).length) return invalid(errors);

  const body: CreateBookingBody = {
    packageKey: packageKey as PackageKey,
    slotStart,
    accessMethod: accessMethod as AccessMethod,
    accessDetails: optional(fd, 'accessDetails'),
    notes: optional(fd, 'notes'),
    taskId,
    confirmAuthority: canApprove ? true : undefined,
  };
  return act(() => api<Booking>(`/api/homes/${homeId}/bookings`, { body }), { redirect: (b) => `/homes/${homeId}/help/${b.id}?new=1` });
}

export async function approveBooking(bookingId: string): Promise<ActionState> {
  return act(() => api<Booking>(`/api/bookings/${bookingId}/approve`, { method: 'POST' }), { message: (b) => `Approved. ${b.partner.name} will confirm shortly.` });
}

export async function cancelBooking(bookingId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const reason = text(fd, 'reason');
  if (!reason) return invalid({ reason: 'Add a short reason for the partner.' });
  return act(() => api<Booking>(`/api/bookings/${bookingId}/cancel`, { body: { reason } }), { message: 'Visit cancelled. No charge.' });
}
