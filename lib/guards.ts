import 'server-only';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import { getActor } from './actor';
import { api, ApiError } from './api';
import type { Dashboard, Home, Member, MeResponse } from './contract';

/* Route guards (6.2) and error mapping for pages (5.1). */

export type MemberMe = Extract<MeResponse, { kind: 'member' }>;

export async function currentPath(): Promise<string> {
  return (await headers()).get('x-pathname') ?? '/';
}

/** The print view of the home record has no site chrome. Reached by a full page load. */
export const isPrintPath = (path: string) => /\/record\/print(?:$|\?)/.test(path);

/** Only internal paths, never `//host` or a full URL. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  return next;
}

async function toDemo(): Promise<never> {
  redirect(`/demo?next=${encodeURIComponent(await currentPath())}`);
}

/** 404 → not found; 403 → /forbidden; 401 or removed → clear the cookie and pick a persona again. */
export async function handleApiError(err: unknown): Promise<never> {
  if (err instanceof ApiError) {
    if (err.status === 404) notFound();
    if (err.status === 401 || err.code === 'removed') {
      redirect(`/demo/clear?next=${encodeURIComponent(await currentPath())}`);
    }
    if (err.status === 403) redirect('/forbidden');
  }
  throw err;
}

/** `api()` for pages: maps errors to redirects and not-found. */
export async function read<T>(path: string): Promise<T> {
  try {
    return await api<T>(path);
  } catch (err) {
    return handleApiError(err);
  }
}

/** Who the cookie says you are, or null. One backend call per request. */
export const getMe = cache(async (): Promise<MeResponse | null> => {
  if (!(await getActor())) return null;
  try {
    return await api<MeResponse>('/api/me');
  } catch (err) {
    // A stale cookie (reset demo, removed member) behaves like no cookie; the backend being down still surfaces.
    if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) return null;
    throw err;
  }
});

export async function requireActor(): Promise<MeResponse> {
  if (!(await getActor())) return toDemo();
  const me = await getMe();
  if (!me) redirect(`/demo/clear?next=${encodeURIComponent(await currentPath())}`);
  return me;
}

/** A member of this home (any role). Partner or staff → "This part is for the family". Setup → the setup flow. */
export async function requireMember(homeId: string, opts: { allowSetup?: boolean } = {}): Promise<MemberMe> {
  const me = await requireActor();
  if (me.kind !== 'member') redirect('/forbidden?area=family');
  if (me.home.id !== homeId) redirect('/forbidden');
  if (me.home.status === 'setup' && !opts.allowSetup) redirect(`/setup/${homeId}`);
  return me;
}

export async function requirePartner(): Promise<Extract<MeResponse, { kind: 'partner' }>> {
  const me = await requireActor();
  if (me.kind !== 'partner') redirect('/forbidden?area=partner');
  return me;
}

export async function requireStaff(): Promise<Extract<MeResponse, { kind: 'staff' }>> {
  const me = await requireActor();
  if (me.kind !== 'staff') redirect('/forbidden?area=staff');
  return me;
}

/* Per-request caches shared by the home layout and its pages. */
export const getHome = cache((homeId: string) => read<Home>(`/api/homes/${homeId}`));
export const getDashboard = cache((homeId: string) => read<Dashboard>(`/api/homes/${homeId}/dashboard`));
export const getMembers = cache((homeId: string) => read<Member[]>(`/api/homes/${homeId}/members`));

/* Role checks (7.3). */
export const isClosed = (home: Pick<Home, 'status'>) => ['occupied', 'sold', 'transferred', 'closed', 'declined'].includes(home.status);
export const canHelp = (m: Pick<Member, 'role'>) => m.role === 'helper' || m.role === 'coordinator';
export const isCoordinator = (m: Pick<Member, 'role'>) => m.role === 'coordinator';
export const canAuthorise = (m: Pick<Member, 'role' | 'canAuthorise'>) => m.canAuthorise && m.role !== 'viewer';

export function actorLabel(me: MeResponse): { name: string; role: string; home: string } {
  if (me.kind === 'member') return { name: me.member.name, role: roleName(me.member.role), home: `/homes/${me.home.id}` };
  if (me.kind === 'partner') return { name: me.partner.name, role: 'Visit partner', home: '/partner' };
  return { name: me.label, role: 'If pilot team', home: '/insights' };
}

function roleName(role: Member['role']): string {
  return role === 'coordinator' ? 'Coordinator' : role === 'helper' ? 'Helper' : 'Viewer';
}
