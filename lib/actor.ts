import 'server-only';
import { cookies } from 'next/headers';
import type { ActorHeader } from './contract';

/* The demo "who am I" cookie (5.2). Set and cleared only in server actions and route handlers. */

export const ACTOR_COOKIE = 'hw_actor';
const INVITE_COOKIE = 'hw_invite';
const ACTOR_PATTERN = /^(?:(?:member|partner):[0-9a-f-]{36}|staff)$/i;
const MAX_AGE = 60 * 60 * 24 * 30;

export function isActor(value: string | undefined | null): value is ActorHeader {
  return !!value && ACTOR_PATTERN.test(value);
}

export function cookieOptions() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: MAX_AGE, path: '/' };
}

export async function getActor(): Promise<ActorHeader | null> {
  const value = (await cookies()).get(ACTOR_COOKIE)?.value;
  return isActor(value) ? value : null;
}

export async function setActor(actor: ActorHeader): Promise<void> {
  (await cookies()).set(ACTOR_COOKIE, actor, cookieOptions());
}

export async function clearActor(): Promise<void> {
  (await cookies()).delete(ACTOR_COOKIE);
}

/**
 * The invitation token of the home being set up. `Home` doesn't carry it, but setup step 1 needs it to close
 * the invitation ("someone still lives there"), so it's remembered when the invitation is accepted.
 */
export async function rememberInvite(homeId: string, token: string): Promise<void> {
  (await cookies()).set(INVITE_COOKIE, `${homeId}:${token}`, cookieOptions());
}

export async function rememberedInvite(homeId: string): Promise<string | null> {
  const value = (await cookies()).get(INVITE_COOKIE)?.value;
  if (!value?.startsWith(`${homeId}:`)) return null;
  return value.slice(homeId.length + 1) || null;
}
