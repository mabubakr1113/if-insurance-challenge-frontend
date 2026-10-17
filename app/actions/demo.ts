'use server';

import { redirect } from 'next/navigation';
import type { ActionState } from '@/lib/action-state';
import { act, failure, refreshAll } from '@/lib/actions';
import { clearActor, getActor, isActor, setActor } from '@/lib/actor';
import { api } from '@/lib/api';
import type { Booking, HomeWeather, Persona, PersonasResponse, Visit } from '@/lib/contract';
import { safeNext } from '@/lib/guards';

export interface DemoMenu {
  personas: Pick<Persona, 'actor' | 'label' | 'subtitle' | 'landing'>[];
  current: string | null;
  inviteUrl: string;
}

/**
 * The "View the demo as" menu, loaded when it opens: the family of the current home (or the example home),
 * then the partner and the pilot team.
 */
export async function demoMenu(): Promise<DemoMenu | null> {
  try {
    const [data, current] = await Promise.all([api<PersonasResponse>('/api/demo/personas', { actor: null }), getActor()]);
    const families = data.groups.filter((g) => g.personas.some((p) => p.homeId));
    const others = data.groups.filter((g) => !g.personas.some((p) => p.homeId));
    const mine = families.find((g) => g.personas.some((p) => p.actor === current)) ?? families.find((g) => g.title.startsWith('Example')) ?? families[0];
    const personas = [...(mine?.personas ?? []), ...others.flatMap((g) => g.personas)].map(({ actor, label, subtitle, landing }) => ({ actor, label, subtitle, landing }));
    return { personas, current, inviteUrl: data.inviteUrl };
  } catch {
    return null;
  }
}

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

const SIMULATE = {
  confirm: { path: 'accept', message: (b: Booking) => `${b.partner.name} confirmed the visit (simulated).` },
  arrive: { path: 'start', message: (b: Booking) => `${b.partner.name} is at the house (simulated).` },
} as const;

/** Booking status page, demo only: the partner's next step, sent as the (fictional) partner. */
export async function simulatePartnerStep(bookingId: string, partnerId: string, step: keyof typeof SIMULATE): Promise<ActionState> {
  const s = SIMULATE[step];
  return act(() => api<Booking>(`/api/partner/jobs/${bookingId}/${s.path}`, { method: 'POST', actor: `partner:${partnerId}` }), { message: s.message });
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
