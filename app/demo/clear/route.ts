import { NextResponse, type NextRequest } from 'next/server';
import { ACTOR_COOKIE } from '@/lib/actor';
import { safeNext } from '@/lib/guards';

/** Clears a stale demo cookie (401 or removed member), then asks the person to pick a persona again. */
export function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get('next'));
  const target = new URL(next ? `/demo?next=${encodeURIComponent(next)}` : '/demo', request.url);
  const response = NextResponse.redirect(target);
  response.cookies.delete(ACTOR_COOKIE);
  return response;
}
