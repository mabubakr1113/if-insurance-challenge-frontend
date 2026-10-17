import { NextResponse, type NextRequest } from 'next/server';
import { ACTOR_COOKIE, cookieOptions, isActor } from '@/lib/actor';
import { api } from '@/lib/api';
import type { ActorGrant } from '@/lib/contract';

/** Shareable, account-free entry into the populated example home. */
export async function GET(request: NextRequest) {
  let grant: ActorGrant;
  try {
    grant = await api<ActorGrant>('/api/demo/entry', { actor: null });
    if (!grant.homeId || !grant.memberId || !isActor(grant.actor) || grant.actor !== `member:${grant.memberId}`) {
      throw new Error('The demo entry is missing its coordinator.');
    }
  } catch {
    return NextResponse.redirect(new URL('/demo?start=unavailable', request.url));
  }

  const response = NextResponse.redirect(new URL(`/homes/${encodeURIComponent(grant.homeId)}`, request.url));
  response.cookies.set(ACTOR_COOKIE, grant.actor, cookieOptions());
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
