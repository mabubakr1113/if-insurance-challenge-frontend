'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { act, failure, refreshAll } from '@/lib/actions';
import { clearActor, isActor, setActor } from '@/lib/actor';
import { api } from '@/lib/api';
import type { HomeWeather, Visit } from '@/lib/contract';
import { safeNext } from '@/lib/guards';

export async function viewAs(actor: string, landing: string, next: string | null): Promise<ActionState> {
  if (!isActor(actor)) return { ok: false, error: 'Unknown person.', at: Date.now() };
  await setActor(actor);
  refreshAll();
  redirect(safeNext(next) ?? safeNext(landing) ?? '/');
}

export async function stopViewing(): Promise<ActionState> {
  await clearActor();
  refreshAll();
  return { ok: true, message: 'You’re no longer viewing as anyone.', at: Date.now() };
}

const WEATHER_MESSAGES = {
  'cold-night': 'Cold night forecast for tomorrow. The heating check is now urgent.',
  storm: 'Storm forecast for tomorrow. A check after the storm has been added.',
  'clear-weather': 'Back to the real forecast.',
} as const;

export async function simulateWeather(homeId: string, kind: keyof typeof WEATHER_MESSAGES): Promise<ActionState> {
  return act(() => api<HomeWeather>(`/api/demo/homes/${homeId}/${kind}`, { method: 'POST', actor: null }), {
    message: WEATHER_MESSAGES[kind],
  });
}

export async function completePartnerVisit(bookingId: string): Promise<ActionState> {
  return act(() => api<Visit>(`/api/demo/bookings/${bookingId}/complete`, { method: 'POST', actor: null }), {
    message: 'Visit report delivered.',
  });
}

export async function resetDemo(): Promise<ActionState> {
  try {
    await api<{ ok: true; inviteUrl: string }>('/api/demo/reset', { method: 'POST', actor: null });
  } catch (err) {
    return failure(err);
  }
  await clearActor();
  refreshAll();
  return { ok: true, message: 'Demo reset. Start again from the invitation.', at: Date.now() };
}
