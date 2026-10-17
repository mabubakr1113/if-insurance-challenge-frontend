/**
 * Route check (section 10): prepares the demo through the backend, then fetches every main page as the right
 * person and checks it renders. Usage: npm run check:routes (needs the backend and `npm run dev` running).
 */
import { config } from 'dotenv';
import type { ActorGrant, Booking, DemoState, PersonasResponse, PlanResponse, VisitSummary } from '../lib/contract';

config({ path: '.env.local' });
config();

const BACKEND = (process.env.BACKEND_URL ?? '').replace(/\/+$/, '');
const KEY = process.env.BACKEND_API_KEY ?? '';
const FRONTEND = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

if (!BACKEND || !KEY) {
  console.error('Set BACKEND_URL and BACKEND_API_KEY in .env.local first.');
  process.exit(1);
}

async function backend<T>(path: string, opts: { method?: string; body?: unknown; actor?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { Authorization: `Bearer ${KEY}` };
  if (opts.actor) headers['X-Actor'] = opts.actor;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BACKEND}${path}`, {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} → ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

interface Check {
  route: string;
  actor: string | null;
  as: string;
  expect: string[] | { redirect: string; cookieActor?: string };
}

async function prepare() {
  await backend('/api/demo/reset', { method: 'POST' });
  const grant = await backend<ActorGrant>('/api/invites/demo-virtanen/accept', {
    body: { name: 'Aino Virtanen', relation: 'child', city: 'Helsinki', phone: '+358 40 000 0201' },
  });
  const main = grant.homeId as string;
  await backend(`/api/homes/${main}`, {
    method: 'PATCH',
    actor: grant.actor,
    body: { occupancyConfirmed: true, authorityConfirmed: true, heatingType: 'district', waterSource: 'municipal' },
  });
  await backend(`/api/homes/${main}/activate`, { method: 'POST', actor: grant.actor });

  const [personas, state] = await Promise.all([backend<PersonasResponse>('/api/demo/personas'), backend<DemoState>('/api/demo/state')]);
  const all = personas.groups.flatMap((g) => g.personas);
  const find = (match: (label: string, actor: string) => boolean, what: string) => {
    const p = all.find((x) => match(x.label, x.actor));
    if (!p) throw new Error(`Persona not found: ${what}`);
    return p.actor;
  };
  const aino = find((l, a) => l.startsWith('Aino') && a === grant.actor, 'Aino');
  const sanna = find((l) => l.startsWith('Sanna'), 'Sanna');
  const partner = find((_l, a) => a.startsWith('partner:'), 'partner');
  const staff = find((_l, a) => a === 'staff', 'staff');
  const example = state.exampleHomeId;

  const [plan, visits, bookings] = await Promise.all([
    backend<PlanResponse>(`/api/homes/${main}/tasks?filter=all`, { actor: aino }),
    backend<VisitSummary[]>(`/api/homes/${example}/visits`, { actor: sanna }),
    backend<Booking[]>(`/api/homes/${example}/bookings`, { actor: sanna }),
  ]);
  const task = plan.tasks[0];
  const visit = visits[0];
  const completed = bookings.find((b) => b.status === 'completed');
  if (!task || !visit || !completed) throw new Error('Seed data is missing a task, a visit or a completed booking');

  return { main, example, aino, sanna, partner, staff, taskId: task.id, visitId: visit.id, bookingId: completed.id };
}

async function run(check: Check): Promise<string | null> {
  const headers: Record<string, string> = {};
  if (check.actor) headers.Cookie = `hw_actor=${check.actor}`;
  let res: Response;
  try {
    res = await fetch(`${FRONTEND}${check.route}`, { headers, redirect: 'manual' });
  } catch (err) {
    return `frontend not reachable at ${FRONTEND} (${(err as Error).message})`;
  }
  const location = res.headers.get('location') ?? '';

  if (!Array.isArray(check.expect)) {
    if (check.expect.cookieActor) {
      const cookie = res.headers.get('set-cookie') ?? '';
      const actor = decodeURIComponent(cookie.match(/hw_actor=([^;]+)/)?.[1] ?? '');
      if (actor !== check.expect.cookieActor) return 'demo entry did not select the example coordinator';
      if (!cookie.includes('HttpOnly') || !res.headers.get('cache-control')?.includes('no-store')) return 'demo entry must set a private, uncached cookie';
      const problem = await run({ route: check.expect.redirect, actor, as: 'participant', expect: ['Lindqvist'] });
      if (problem) return `opening the home with the new cookie: ${problem}`;
    }
    if (res.status >= 300 && res.status < 400 && location.includes(check.expect.redirect)) return null;
    const html = res.status === 200 ? await res.text() : '';
    // A redirect after streaming started arrives as a 200 with a client-side redirect to the target.
    if (html.includes(check.expect.redirect) && html.includes('NEXT_REDIRECT')) return null;
    return `expected a redirect to ${check.expect.redirect}, got ${res.status}${location ? ` → ${location}` : ''}`;
  }

  if (res.status !== 200) return `HTTP ${res.status}${location ? ` → ${location}` : ''}`;
  const html = await res.text();
  if (html.includes('NEXT_REDIRECT')) return 'the page redirected';
  return check.expect.some((phrase) => html.includes(phrase)) ? null : `missing "${check.expect.join('" or "')}"`;
}

async function main() {
  console.log(`Backend ${BACKEND} · frontend ${FRONTEND}\n`);
  const ids = await prepare();
  const h = `/homes/${ids.main}`;
  const e = `/homes/${ids.example}`;
  const checks: Check[] = [
    { route: '/', actor: null, as: 'none', expect: ['change things', 'Home Watch'] },
    { route: '/demo', actor: null, as: 'none', expect: ['Simulated events'] },
    { route: '/demo/start', actor: null, as: 'new participant', expect: { redirect: e, cookieActor: ids.sanna } },
    { route: '/demo/start', actor: 'member:00000000-0000-0000-0000-000000000000', as: 'stale demo person', expect: { redirect: e, cookieActor: ids.sanna } },
    { route: '/demo/start', actor: ids.partner, as: 'returning participant', expect: { redirect: e, cookieActor: ids.sanna } },
    { route: '/invite/demo-virtanen', actor: null, as: 'none', expect: ['accepted by'] },
    { route: h, actor: ids.aino, as: 'Aino', expect: ['Needs attention'] },
    { route: `${h}/plan`, actor: ids.aino, as: 'Aino', expect: ['Needs an owner'] },
    { route: `${h}/tasks/${ids.taskId}`, actor: ids.aino, as: 'Aino', expect: ['Why it matters'] },
    { route: `${h}/visits`, actor: ids.aino, as: 'Aino', expect: ['No visits recorded yet'] },
    { route: `${h}/visits/new`, actor: ids.aino, as: 'Aino', expect: ['Heating is running'] },
    { route: `${h}/notes`, actor: ids.aino, as: 'Aino', expect: ['Water main valve'] },
    { route: `${h}/notes/new?essential=water_main_valve&category=water`, actor: ids.aino, as: 'Aino', expect: ['checked this on site'] },
    { route: `${h}/weather`, actor: ids.aino, as: 'Aino', expect: ['When Home Watch acts'] },
    { route: `${h}/help`, actor: ids.aino, as: 'Aino', expect: ['Check visit'] },
    { route: `${h}/family`, actor: ids.aino, as: 'Aino', expect: ['Coordinator'] },
    { route: `${h}/record`, actor: ids.aino, as: 'Aino', expect: ['This record lists observations'] },
    { route: `${h}/settings`, actor: ids.aino, as: 'Aino', expect: ['happening with the home'] },
    { route: e, actor: ids.sanna, as: 'Sanna', expect: ['Lindqvist'] },
    { route: `${e}/visits/${ids.visitId}`, actor: ids.sanna, as: 'Sanna', expect: ['Checklist'] },
    { route: `${e}/help/${ids.bookingId}`, actor: ids.sanna, as: 'Sanna', expect: ['report is ready'] },
    { route: '/notifications', actor: ids.sanna, as: 'Sanna', expect: ['Messages', 'No messages yet'] },
    { route: '/partner', actor: ids.partner, as: 'partner', expect: ['New requests'] },
    { route: '/insights', actor: ids.staff, as: 'staff', expect: ['Pilot dashboard'] },
    { route: e, actor: ids.aino, as: 'Aino', expect: { redirect: '/forbidden' } },
  ];

  let failed = 0;
  for (const check of checks) {
    const started = Date.now();
    const problem = await run(check);
    const ms = Date.now() - started;
    const label = `${check.route.replace(ids.main, '{main}').replace(ids.example, '{example}')} as ${check.as}`;
    if (problem) {
      failed++;
      console.log(`✘ ${label} (${ms} ms): ${problem}`);
    } else {
      console.log(`✔ ${label} (${ms} ms)`);
    }
  }

  await backend('/api/demo/reset', { method: 'POST' });
  console.log(`\n${checks.length - failed}/${checks.length} routes passed. Demo data reset.`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
