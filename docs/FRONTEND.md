# If Home Watch — Frontend spec

The web app for the If Home Watch prototype: a Next.js app on Vercel that families, a visit partner and If's pilot team use. It holds no data of its own. Every read and write goes, server-side, to the backend API (`if-insurance-challenge-backend`, specified in `BACKEND.md`), which runs on Supabase.

Product context: `VENTURE_BRIEF.md`. This document lists **every page and everything each page shows and lets people do**. It deliberately does not prescribe visual components; choose clean, accessible UI that fits the content.

---

## ▶ Claude Code prompt — paste this as one command

> Run Claude Code inside the `if-insurance-challenge-frontend` repo, with this file at `docs/FRONTEND.md`. Build the backend first (`BACKEND.md`) so there is an API to talk to.

```text
You are in the if-insurance-challenge-frontend repo. Read docs/FRONTEND.md from top to bottom, then build everything it specifies end to end in this session. Don't ask me questions. Where the doc is silent, choose the simplest option consistent with it and list that choice in your final summary.

Do it in this order:
1. Create and switch to the branch feat/frontend-mvp (never commit to main). Commit in small logical steps of about 3–4 files, with clear messages.
2. Scaffold a Next.js App Router + TypeScript + Tailwind CSS + ESLint app in this folder (section 3). If create-next-app refuses because the folder isn't empty, scaffold into a temporary folder and move the files in, keeping README.md, IDEAS.md, docs/ and .commandcode/ and merging .gitignore.
3. Install the dependencies and add the npm scripts from section 3.
4. Create .env.example and .env.local (section 4). If ../if-insurance-challenge-backend/.env.local exists, copy its API_KEY into BACKEND_API_KEY. Default BACKEND_URL is http://localhost:3001.
5. Copy section 7.2 byte for byte into lib/contract.ts.
6. Build the architecture in section 5, the global layout and route guards in section 6, every page in section 8 (all content, actions, empty states and redirects), and the copy, formatting and labels in section 9.
7. Verify (section 10): npm run lint, npx tsc --noEmit and npm run build must pass with zero errors. Make sure the backend is reachable at BACKEND_URL. If it isn't and ../if-insurance-challenge-backend exists, start it there with npm run dev. Then run npm run check:routes and fix things until every route passes. Also walk through the 9-step demo script on the /demo page once, using the backend's demo endpoints, and fix anything that breaks.
8. Deploy (section 11): if `vercel whoami` succeeds and BACKEND_PROD_URL is set in .env.local, link the project, add the env vars, deploy to production and open / and /demo on the production URL. Otherwise print the exact manual steps.
9. Finish with a short summary: what was built, the local and production URLs, how to run the demo, and every decision you made that the doc didn't specify.
```

---

## 1. What you're building

Four kinds of user, one app:

| User | What they do | Where |
| --- | --- | --- |
| **Family coordinator** (Aino) | Accepts If's invitation, sets up the home, invites family, shares tasks, books local visits | `/invite`, `/setup`, `/homes/...` |
| **Family helper / viewer** (Mikko) | Accepts tasks, records visits, adds house notes; viewers only read and comment | `/join`, `/homes/...` |
| **Visit partner** (fictional "Talonvahti Demo Oy") | Accepts visit requests, does the checklist, sends the report | `/partner/...` |
| **If pilot team** | Sees adoption, prevention and visit economics | `/insights` |

Plus a public landing page (`/`) and a demo hub (`/demo`) where the presenter picks who to "be" and triggers simulated events (cold night, partner visit, reset).

**The 3-minute demo the frontend must make smooth:**

1. Aino opens the invitation → accepts.
2. Setup in 5 short steps → "Create the care plan".
3. She invites Mikko and assigns him the first visit.
4. Switch to Mikko → he adds the water-main-valve photo and note → records a visit.
5. Presenter triggers "Cold night" → the heating check turns urgent; nobody has accepted it.
6. Switch to Aino → "Request a local visit" → approve and book.
7. Presenter triggers "Complete partner visit" → the report arrives with photos and one concern.
8. The overview shows the updated plan; Aino downloads or prints the home record.
9. Switch to the If pilot team → insights.

---

## 2. Stack and ground rules

| Thing | Choice |
| --- | --- |
| Framework | Next.js (latest stable), App Router, TypeScript strict |
| Styling | Tailwind CSS. shadcn/ui components are fine. No other UI frameworks. |
| Data | Only through the backend API (section 7), called from **server code** (server components, server actions, route handlers) |
| Forms | Server actions + `useActionState`; light client components only where needed (photo picking, step state) |
| Dates | `Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki' })`; no date library needed |
| Charts | Hand-rolled SVG or `recharts` on `/insights` only |
| Hosting | Vercel |
| Package manager | npm |

**Keep it simple:**

- No Supabase client, no auth library, no global state library, no React Query. Server components fetch; server actions mutate and call `revalidatePath`.
- Who you are is a demo cookie (section 5.2), set on `/demo`, `/invite` or `/join`.
- Everything is English. All people, homes and the partner are fictional; say so where it matters.
- Accessible by default: semantic headings, labels on every field, visible focus, colour never the only signal, works at 375 px wide.
- **Look and feel:** calm, warm, plenty of white space. This is a family dealing with a death: no alarm-red dashboards, no gamification, no exclamation marks. Urgency is shown with words first ("Nobody has taken this yet") and colour second. The wordmark is text only: "If Home Watch" with a small "Prototype" tag. Don't copy If's logo or brand assets.

---

## 3. Project setup

```bash
npx create-next-app@latest . --ts --eslint --tailwind --app --no-src-dir --import-alias "@/*" --use-npm
npm i zod
npm i -D tsx dotenv
# optional: npx shadcn@latest init   (then add components as needed)
# optional: npm i recharts            (only for /insights)
```

`package.json` scripts:

```json
{
  "dev": "next dev -p 3000",
  "build": "next build",
  "start": "next start -p 3000",
  "lint": "next lint",
  "check:routes": "tsx scripts/check-routes.ts"
}
```

(If the installed Next.js has no `next lint`, use `eslint .`.)

Folder layout:

```text
app/
  layout.tsx                         # global shell (section 6)
  page.tsx                           # P1 landing
  not-found.tsx, error.tsx, forbidden/page.tsx
  demo/page.tsx                      # P2
  invite/[token]/page.tsx            # P3
  join/[token]/page.tsx              # P4
  setup/[homeId]/page.tsx            # P5 (?step=1..5)
  homes/[homeId]/layout.tsx          # P6 home shell
  homes/[homeId]/page.tsx            # P7 overview
  homes/[homeId]/plan/page.tsx       # P8
  homes/[homeId]/tasks/new/page.tsx  # P9
  homes/[homeId]/tasks/[taskId]/page.tsx        # P10
  homes/[homeId]/visits/page.tsx                # P11
  homes/[homeId]/visits/new/page.tsx            # P12
  homes/[homeId]/visits/[visitId]/page.tsx      # P13
  homes/[homeId]/notes/page.tsx                 # P14
  homes/[homeId]/notes/new/page.tsx             # P15
  homes/[homeId]/notes/[noteId]/page.tsx        # P15
  homes/[homeId]/weather/page.tsx               # P16
  homes/[homeId]/help/page.tsx                  # P17
  homes/[homeId]/help/[bookingId]/page.tsx      # P18
  homes/[homeId]/family/page.tsx                # P19
  homes/[homeId]/record/page.tsx                # P20
  homes/[homeId]/record/print/page.tsx          # P20 print view
  homes/[homeId]/record/download/route.ts       # proxies the backend export
  homes/[homeId]/settings/page.tsx              # P21
  notifications/page.tsx                        # P22
  partner/page.tsx                              # P23
  partner/jobs/[bookingId]/page.tsx             # P24
  insights/page.tsx                             # P25
  actions/                                      # server actions grouped by area
lib/
  contract.ts                        # section 7.2, byte-identical to the backend
  api.ts                             # server-only API client (section 5.1)
  actor.ts                           # demo cookie helpers (section 5.2)
  guards.ts                          # requireActor / requireMember / requirePartner / requireStaff
  format.ts                          # dates, money, temperature, relative time (section 9)
  labels.ts                          # enum → English labels (section 9)
  image.ts                           # browser-side downscale before upload (section 5.4)
components/                          # whatever the pages need
scripts/check-routes.ts              # section 10
```

---

## 4. Environment variables

`.env.example` (committed) and `.env.local` (git-ignored):

```bash
BACKEND_URL=http://localhost:3001      # the backend API base URL (no trailing slash)
BACKEND_API_KEY=                       # must equal the backend's API_KEY. Server only: never NEXT_PUBLIC_
BACKEND_PROD_URL=                      # optional: production backend URL, used only for the Vercel deploy step
```

Nothing is `NEXT_PUBLIC_`. `lib/api.ts` throws a clear error if `BACKEND_URL` or `BACKEND_API_KEY` is missing.

---

## 5. Architecture

### 5.1 API client (`lib/api.ts`, `import 'server-only'`)

```ts
api<T>(path: string, opts?: { method?: 'GET'|'POST'|'PATCH'|'DELETE'; body?: unknown; actor?: ActorHeader | null }): Promise<T>
apiForm<T>(path: string, form: FormData): Promise<T>    // multipart (photos)
```

- Adds `Authorization: Bearer ${BACKEND_API_KEY}` and `X-Actor` (taken from the cookie unless `actor` is passed; `null` = send none).
- `cache: 'no-store'` on every call.
- On a non-2xx response, throws `ApiError { status, code, message, details }` from the backend's error JSON.
- On a network failure, throws `ApiError { status: 503, code: 'backend_unreachable' }`.
- Pages map errors: `404` → `notFound()`; `403` → redirect to `/forbidden`; `401 actor_required` or `removed` → clear the cookie and redirect to `/demo?next=<path>`; `503` → the error boundary's "service isn't responding" message.

### 5.2 Who you are: the demo cookie (`lib/actor.ts`)

- The cookie `hw_actor` holds an `ActorHeader` (`member:<uuid>`, `partner:<uuid>` or `staff`). It is httpOnly, `sameSite=lax`, secure in production, 30 days.
- It is set by server actions on `/demo` ("View as"), `/invite/[token]` (accept) and `/join/[token]` (join). It is cleared by "Stop viewing" on `/demo`, or automatically on 401/removed.
- `GET /api/me` tells pages who the actor is (name, role, home, unread count).

### 5.3 Reading and writing

- **Read:** server components call `api()` directly and render.
- **Write:** forms post to server actions in `app/actions/*`. Each action calls the API, then `revalidatePath` on the affected pages, then either `redirect()` or returns `{ ok: true, message }` / `{ ok: false, error, fieldErrors }`. Field errors come from the backend's `400` zod `details`; show them next to the fields.
- **Live-ish updates:** a tiny client component `<AutoRefresh seconds={10} />` calls `router.refresh()` on an interval. It is used on the overview, plan, booking status, partner pages and notifications, so a second screen (Mikko's) updates within 10 seconds of Aino's change. Pause it while a form on the page has unsaved input.

### 5.4 Photos

- Pick a file (camera or library) in a client component → downscale it in the browser (`lib/image.ts`: longest side 1600 px, JPEG quality 0.8, via canvas) → send it as `FormData` to a server action → `apiForm('/api/homes/:id/photos', form)` → get a `Photo` back → keep its `id` in the form's state and show a thumbnail. On submit of the parent form, send `photoIds`.
- Show photos with plain `<img>` tags (signed URLs expire after 60 minutes and the seed uses SVG placeholders), with `alt` = caption or "Photo by {uploadedByLabel}". Never use `next/image` for these.
- Limits: 5 MB after downscale, jpeg/png/webp. Show the backend's error message if it refuses.

### 5.5 Simulated things are always labelled

Anything not real gets a short visible label:

- notifications sent by SMS or email → "SMS (simulated)" / "Email (simulated)"
- the forecast when `source === 'simulated'` → "Simulated forecast (demo)"
- the partner → "Fictional partner"
- prices → "Prototype price, not a quote"
- bookings → "Booking is simulated. No payment is taken."

---

## 6. Global layout, navigation and route guards

### 6.1 On every page

- **Header:** the wordmark "If Home Watch" with a "Prototype" tag (links to `/`). If an actor cookie is set: "Viewing as {name} · {role or 'Visit partner' or 'If pilot team'}" with "Switch person" (→ `/demo`) and "Messages" with the unread count (→ `/notifications`). If no cookie: "Try the demo" (→ `/demo`).
- **Footer:** "Hackathon prototype for the If challenge "If Insurance Could Do More", JunctionX Turku 2026. Fictional people, homes and partner. Messages and bookings are simulated. Not an If service." Plus links: "How it works" (`/#how`), "Demo" (`/demo`).

### 6.2 Route guards (`lib/guards.ts`)

| Area | Rule |
| --- | --- |
| `/`, `/demo`, `/invite/*`, `/join/*` | public |
| `/setup/[homeId]` | member of the home with role coordinator; if the home is `active` → redirect to `/homes/[homeId]`; if it's closed or declined → show the closed message |
| `/homes/[homeId]/*` | member of that home (any role). No cookie → `/demo?next=…`. A partner or staff cookie → message "This part is for the family" with a link to their own area. A member of another home → `/forbidden`. Home status `setup` → redirect to `/setup/[homeId]`. |
| `/notifications` | any actor |
| `/partner/*` | partner actor; otherwise the message "This part is for the visit partner" + "Switch person" |
| `/insights` | staff actor; otherwise "This part is for If's pilot team" + "Switch person" |

Role-based actions inside home pages follow 7.3. Show only what the person may do, and say why something is missing when it matters (e.g. a viewer sees "Viewers can read and comment. Ask {coordinator} to change your role.").

### 6.3 Home navigation (shown on every `/homes/[homeId]/*` page, see P6)

Overview · Plan (badge: needs-owner count) · Visits · House notes (badge: missing essentials) · Weather · Local visit · Family · Record · Settings

---

## 7. API contract

Sections 7.1–7.4 appear word for word in `BACKEND.md` as well. **Do not change one side without the other.**

<!-- CONTRACT:START (identical in BACKEND.md and FRONTEND.md) -->

### 7.1 Conventions

- **Base URL:** `BACKEND_URL` (local: `http://localhost:3001`). Every path starts with `/api`.
- **Server-to-server only.** Only the frontend's server code (server components, server actions, route handlers) calls the backend. The browser never calls it directly, so the API key never reaches the browser.
- **Every request** sends `Authorization: Bearer <API_KEY>`. A missing or wrong key returns `401`.
- **Who is acting** goes in the `X-Actor` header: `member:<uuid>`, `partner:<uuid>` or `staff`. Endpoints marked `none` in the Actor column ignore it.
- **JSON in, JSON out**, except photo upload (`multipart/form-data`) and export (a file download). Success responses return the object itself, with no wrapper.
- **Errors** always look like `{ "error": { "code": "not_found", "message": "Task not found", "details": ... } }` with status `400` (validation; `details` = zod issues), `401`, `403`, `404`, `409` (conflict, wrong state) or `500`.
- **Timestamps** are ISO 8601 strings in UTC (`2026-10-21T15:00:00.000Z`). **Dates** are `YYYY-MM-DD`. The UI shows everything in `Europe/Helsinki`.
- **Money** is integer euro cents (`6900` = €69).
- **Photo `url`s** are signed Supabase Storage URLs valid for 60 minutes. Never cache them longer.

### 7.2 Shared types — `lib/contract.ts` (byte-identical in both repos)

```ts
// lib/contract.ts — SHARED API CONTRACT for If Home Watch.
// Keep this file byte-identical in if-insurance-challenge-backend and if-insurance-challenge-frontend.

/* ---------------- enums ---------------- */
export type HomeStatus = 'invited' | 'setup' | 'active' | 'occupied' | 'sold' | 'transferred' | 'closed' | 'declined';
export type YesNoUnknown = 'yes' | 'no' | 'unknown';
export type BuildingType = 'detached' | 'semi_detached' | 'terraced' | 'cottage' | 'other';
export type HeatingType = 'district' | 'electric' | 'oil' | 'ground_heat_pump' | 'air_heat_pump' | 'wood' | 'unknown';
export type WaterSource = 'municipal' | 'well' | 'unknown';
export type Role = 'coordinator' | 'helper' | 'viewer';
export type Relation = 'child' | 'spouse' | 'sibling' | 'grandchild' | 'relative' | 'friend' | 'other';
export type MemberStatus = 'invited' | 'joined' | 'removed';
export type TaskStatus = 'open' | 'accepted' | 'done' | 'cancelled';
export type TaskPriority = 'urgent' | 'high' | 'normal';
export type TaskCategory = 'water' | 'heating' | 'electricity' | 'security' | 'outside' | 'admin' | 'visit' | 'appliances' | 'other';
export type TaskOrigin = 'plan' | 'weather' | 'visit_concern' | 'manual';
export type TaskFilter = 'all' | 'mine' | 'open' | 'needs_owner' | 'overdue' | 'done';
export type CheckResult = 'ok' | 'concern' | 'not_checked';
export type VisitorType = 'family' | 'partner';
export type NoteCategory = 'water' | 'heating' | 'electricity' | 'access' | 'contacts' | 'appliances' | 'other';
export type EssentialKey = 'water_main_valve' | 'water_meter' | 'fuse_box' | 'heating_controls' | 'key_location' | 'neighbour_contact' | 'well_pump';
export type PackageKey = 'check' | 'winter' | 'urgent';
export type BookingStatus = 'pending_approval' | 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'declined';
export type AccessMethod = 'key_holder_meets' | 'key_box' | 'partner_collects_key' | 'other';
export type WeatherRule = 'hard_frost' | 'frost' | 'storm' | 'heavy_snow';
export type ForecastSource = 'open-meteo' | 'simulated';
export type SupervisionState = 'no_visit_yet' | 'ok' | 'due_soon' | 'overdue';
export type NotificationChannel = 'in_app' | 'sms' | 'email';
export type TransitionStatus = 'occupied' | 'sold' | 'transferred' | 'closed';
export type DeclineReason = 'someone_lives_there' | 'not_now' | 'not_responsible';
export type ActorHeader = `member:${string}` | `partner:${string}` | 'staff';
export type ActivityType =
  | 'home_invited' | 'home_activated' | 'home_updated' | 'home_transition'
  | 'member_invited' | 'member_joined' | 'member_updated' | 'member_removed'
  | 'task_created' | 'task_accepted' | 'task_declined' | 'task_assigned' | 'task_completed'
  | 'task_reopened' | 'task_commented' | 'task_escalated' | 'task_updated' | 'task_cancelled'
  | 'visit_recorded' | 'note_saved' | 'photo_added' | 'weather_alert'
  | 'booking_requested' | 'booking_approved' | 'booking_confirmed' | 'booking_declined'
  | 'booking_started' | 'booking_completed' | 'booking_cancelled';

/* ---------------- core objects ---------------- */
export interface PersonRef { id: string; name: string }
export interface SourceRef { label: string; url: string | null }

export interface Home {
  id: string;
  status: HomeStatus;
  addressLine: string;
  postalCode: string;
  city: string;
  lat: number;
  lng: number;
  estateName: string | null;          // the person who died, e.g. "Eila Virtanen" (fictional)
  buildingType: BuildingType | null;
  yearBuilt: number | null;
  vacantSince: string | null;         // YYYY-MM-DD
  lastKnownVisit: string | null;      // YYYY-MM-DD, last visit before Home Watch
  occupancyConfirmed: boolean;        // "nobody lives here" confirmed
  authorityConfirmed: boolean;        // someone in the family can authorise access
  keyHolder: string | null;
  accessNotes: string | null;
  heatingType: HeatingType | null;
  heatingOn: YesNoUnknown | null;
  waterSource: WaterSource | null;
  waterMainClosed: YesNoUnknown | null;
  hasAlarm: YesNoUnknown | null;
  activatedAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  newOwnerWantsCoverHelp: boolean | null;
}

export interface MemberStats { openTasks: number; doneTasks: number; visits: number; lastVisitAt: string | null }

export interface Member {
  id: string;
  homeId: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  relation: Relation;                 // relationship to the person who died (Home.estateName)
  role: Role;
  canAuthorise: boolean;
  status: MemberStatus;
  joinedAt: string | null;
  stats: MemberStats;
}

export interface Partner {
  id: string;
  name: string;
  area: string;
  phone: string | null;
  email: string | null;
  description: string | null;
}

export interface Photo { id: string; url: string; caption: string | null; uploadedByLabel: string; createdAt: string }

export interface Task {
  id: string;
  homeId: string;
  templateKey: string | null;
  title: string;
  why: string | null;
  how: string[];
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: PersonRef | null;
  dueAt: string | null;
  isOverdue: boolean;                 // open/accepted and dueAt < now
  needsOwner: boolean;                // open, no assignee, no active booking, and urgent or due within 48 h
  recurrenceDays: number | null;
  origin: TaskOrigin;
  source: SourceRef | null;
  needsInfo: string | null;           // an unconfirmed detail, shown as "Not confirmed: ..."
  declinedBy: PersonRef[];
  bookingId: string | null;           // an active local visit covers this task
  completedAt: string | null;
  completedByLabel: string | null;
  completionNote: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  actorLabel: string;                 // "Aino Virtanen", "Talonvahti Demo Oy", "Home Watch"
  message: string;                    // ready-to-show sentence
  taskId: string | null;
  visitId: string | null;
  bookingId: string | null;
  createdAt: string;
}

export interface CheckItem { key: string; label: string; help: string }
export interface VisitCheck { key: string; label: string; result: CheckResult; note: string | null }

export interface Visit {
  id: string;
  homeId: string;
  visitorType: VisitorType;
  visitorName: string;
  memberId: string | null;
  partnerId: string | null;
  bookingId: string | null;
  visitedAt: string;
  indoorTempC: number | null;
  checks: VisitCheck[];
  notes: string | null;
  photos: Photo[];
  okCount: number;
  concernCount: number;
  completedTasks: PersonRef[];        // { id: taskId, name: task title } closed by this visit
  followUpTasks: Task[];              // tasks created from this visit's concerns
  createdAt: string;
}

export interface VisitSummary {
  id: string;
  visitorType: VisitorType;
  visitorName: string;
  visitedAt: string;
  indoorTempC: number | null;
  okCount: number;
  concernCount: number;
  photoCount: number;
  bookingId: string | null;
}

export interface Note {
  id: string;
  homeId: string;
  category: NoteCategory;
  title: string;
  body: string;
  essentialKey: EssentialKey | null;
  confirmed: boolean;
  photos: Photo[];
  updatedByLabel: string;
  updatedAt: string;
}

export interface EssentialStatus { key: EssentialKey; label: string; why: string; category: NoteCategory; noteId: string | null; confirmed: boolean; hasPhoto: boolean }

export interface ForecastDay { date: string; minC: number; maxC: number; gustMs: number; snowCm: number }

export interface WeatherAlert {
  id: string;
  rule: WeatherRule;
  forDate: string;                    // the day the weather is forecast for
  message: string;
  taskId: string | null;
  taskStatus: TaskStatus | null;
  actionedBeforeDate: boolean;        // the linked task was done before forDate
  source: ForecastSource;
  createdAt: string;
}

export interface WeatherThresholds { hardFrostC: number; frostC: number; stormGustMs: number; heavySnowCm: number }

export interface HomeWeather {
  source: ForecastSource;
  fetchedAt: string | null;
  days: ForecastDay[];                // today + next 3 days, Europe/Helsinki dates
  activeAlerts: WeatherAlert[];       // alerts whose forDate is today or later
  recentAlerts: WeatherAlert[];       // last 30 days, newest first
  thresholds: WeatherThresholds;
}

export interface Supervision {
  state: SupervisionState;
  lastVisitAt: string | null;
  lastVisitorName: string | null;
  daysSinceLastVisit: number | null;
  nextDueAt: string;
  ruleLabel: string;                  // "If's home terms describe supervision of an empty home as a visit at least monthly."
  source: SourceRef;
}

export interface VisitPackage {
  key: PackageKey;
  name: string;
  durationMin: number;
  includes: string[];
  partnerPriceCents: number;
  ifFeeCents: number;
  totalCents: number;
  leadTime: string;                   // "Next 3 days" | "Within 24 hours"
}

export interface Slot { start: string; end: string }

export interface Booking {
  id: string;
  homeId: string;
  status: BookingStatus;
  package: VisitPackage;
  partner: Partner;
  slotStart: string;
  slotEnd: string;
  accessMethod: AccessMethod;
  accessDetails: string | null;
  notes: string | null;
  taskId: string | null;
  taskTitle: string | null;
  requestedBy: PersonRef | null;
  approvedBy: PersonRef | null;
  createdAt: string;
  approvedAt: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  visitId: string | null;
}

export interface Notification {
  id: string;
  homeId: string | null;
  channel: NotificationChannel;       // sms/email are simulated: shown in-app only
  title: string;
  body: string;
  link: string | null;                // frontend path, e.g. "/homes/<id>/tasks/<id>"
  readAt: string | null;
  createdAt: string;
}

/* ---------------- composite responses ---------------- */
export interface Persona { actor: ActorHeader; label: string; subtitle: string; homeId: string | null; landing: string }
export interface PersonasResponse { groups: { title: string; description: string; personas: Persona[] }[]; inviteUrl: string }

export interface DemoState {
  mainHomeId: string;
  mainHomeStatus: HomeStatus;
  exampleHomeId: string;
  latestBooking: { id: string; homeId: string; status: BookingStatus } | null;
  forecastSource: ForecastSource;
}

export type MeResponse =
  | { kind: 'member'; member: Member; home: { id: string; addressLine: string; city: string; estateName: string | null; status: HomeStatus }; unread: number }
  | { kind: 'partner'; partner: Partner; unread: number }
  | { kind: 'staff'; label: string; unread: number };

export interface InviteView {
  token: string;
  status: HomeStatus;
  home: { id: string; addressLine: string; postalCode: string; city: string; estateName: string | null };
  fromLabel: string;                  // "If estate support"
  message: string;
  alreadyAcceptedBy: PersonRef | null;
}

export interface JoinView {
  member: Member;
  home: { id: string; addressLine: string; city: string; estateName: string | null };
  invitedBy: string | null;
}

export interface ActorGrant { homeId: string | null; memberId: string | null; actor: ActorHeader }

export interface Dashboard {
  home: Home;
  me: Member;
  supervision: Supervision;
  weather: HomeWeather;
  needsAttention: Task[];             // max 6: needsOwner, then overdue, then urgent, then soonest due
  myTasks: Task[];                    // my open/accepted tasks, soonest due first
  nextVisitTask: Task | null;         // open/accepted monthly_visit or first_walkthrough
  counts: { open: number; overdue: number; needsOwner: number; doneLast30d: number; openConcerns: number };
  members: Member[];
  essentialsMissing: EssentialStatus[];
  activeBooking: Booking | null;      // newest booking not completed/cancelled/declined
  recentActivity: Activity[];         // last 8
}

export interface PlanResponse {
  tasks: Task[];
  counts: { all: number; mine: number; open: number; needsOwner: number; overdue: number; done: number };
}

export interface TaskDetail { task: Task; activity: Activity[]; photos: Photo[]; booking: Booking | null; canEdit: boolean }

export interface NotesResponse { notes: Note[]; essentials: EssentialStatus[] }

export interface BookingOptions {
  packages: VisitPackage[];
  partner: Partner;
  slots: Record<PackageKey, Slot[]>;
  accessMethods: { key: AccessMethod; label: string }[];
  canApprove: boolean;                // the current member can approve (canAuthorise)
  authorisedMembers: PersonRef[];
  task: Task | null;                  // the task from ?taskId=, if any
  keyHolder: string | null;
}

export interface BookingDetail { booking: Booking; timeline: Activity[]; visit: Visit | null; canApprove: boolean; canCancel: boolean }

export interface PartnerJob {
  booking: Booking;
  home: { id: string; addressLine: string; postalCode: string; city: string; estateName: string | null };
  coordinator: { name: string; phone: string | null } | null;
}

export interface PartnerJobDetail extends PartnerJob {
  checklist: CheckItem[];
  essentials: Note[];                 // notes with an essentialKey
  keyHolder: string | null;
  accessNotes: string | null;
}

export interface NotificationsResponse { items: Notification[]; unread: number }

export interface HomeRecord {
  home: Home;
  generatedAt: string;
  members: Member[];
  visits: Visit[];
  completedTasks: Task[];
  openTasks: Task[];
  bookings: Booking[];
  alerts: WeatherAlert[];
  activity: Activity[];
  disclaimer: string;
}

export interface Insights {
  generatedAt: string;
  dataNote: string;                   // "Demo data: 2 story homes + 12 generated background homes"
  homes: { invited: number; setupStarted: number; active: number; closed: number; declined: number; setupCompletionRate: number };
  family: { avgMembersPerHome: number; joinedRate: number };
  tasks: { acceptedWithin48hRate: number; avgHoursToFirstAccepted: number | null; overdueNow: number; needsOwnerNow: number; completedLast30d: number };
  supervision: { onTimeRate: number; overdueHomes: number };
  weather: { alertsLast30d: number; actionedBeforeDateRate: number };
  visits: { familyLast30d: number; partnerLast30d: number };
  paidVisits: { requested: number; completed: number; conversionRate: number; serviceRevenueCents: number; avgIfFeeCents: number };
  transitions: { occupied: number; sold: number; transferred: number; closed: number; coverHelpRequested: number };
  funnel: { stage: string; count: number }[];
  homesTable: { id: string; city: string; status: HomeStatus; daysActive: number | null; supervision: SupervisionState | null; openTasks: number; paidVisits: number }[];
  assumptions: { label: string; value: string }[];
}

/* ---------------- request bodies ---------------- */
export interface AcceptInviteBody { name: string; relation: Relation; email?: string; phone?: string; city?: string }
export interface DeclineInviteBody { reason: DeclineReason }
export interface HomeSetupPatch {
  occupancyConfirmed?: boolean;
  vacantSince?: string | null;
  lastKnownVisit?: string | null;
  authorityConfirmed?: boolean;
  keyHolder?: string | null;
  accessNotes?: string | null;
  buildingType?: BuildingType | null;
  yearBuilt?: number | null;
  heatingType?: HeatingType | null;
  heatingOn?: YesNoUnknown | null;
  waterSource?: WaterSource | null;
  waterMainClosed?: YesNoUnknown | null;
  hasAlarm?: YesNoUnknown | null;
}
export interface TransitionBody { status: TransitionStatus; note?: string; newOwnerWantsCoverHelp?: boolean }
export interface InviteMemberBody { name: string; relation: Relation; role: Role; canAuthorise: boolean; email?: string; phone?: string; city?: string }
export interface MemberPatch { name?: string; email?: string | null; phone?: string | null; city?: string | null; role?: Role; canAuthorise?: boolean }
export interface CreateTaskBody { title: string; why?: string; category: TaskCategory; priority: TaskPriority; dueAt?: string | null; assigneeId?: string | null }
export interface TaskPatch { title?: string; why?: string | null; priority?: TaskPriority; dueAt?: string | null; status?: 'cancelled' }
export interface DeclineTaskBody { reason: string }
export interface AssignTaskBody { memberId: string | null }
export interface CompleteTaskBody { note?: string; photoIds?: string[] }
export interface CommentBody { body: string }
export interface CheckInput { key: string; result: CheckResult; note?: string }
export interface RecordVisitBody { visitedAt: string; indoorTempC?: number | null; checks: CheckInput[]; notes?: string; photoIds?: string[] }
export interface NoteBody { category: NoteCategory; title: string; body: string; essentialKey?: EssentialKey | null; confirmed: boolean; photoIds?: string[] }
export interface CreateBookingBody { packageKey: PackageKey; slotStart: string; accessMethod: AccessMethod; accessDetails?: string; notes?: string; taskId?: string | null; confirmAuthority?: boolean }
export interface CancelBookingBody { reason: string }
export interface PartnerDeclineBody { reason: string }
export interface PartnerReportBody { indoorTempC: number | null; checks: CheckInput[]; notes?: string; photoIds?: string[] }
export interface MarkReadBody { ids?: string[] }
```

### 7.3 Who may call what

| Code | Meaning |
| --- | --- |
| `none` | API key only; `X-Actor` ignored |
| `any` | any valid actor |
| `M` | a member of this home (any role, status not `removed`) |
| `H` | a member of this home with role `helper` or `coordinator` |
| `C` | a member of this home with role `coordinator` |
| `A` | a member of this home with `canAuthorise = true` (and not a viewer) |
| `P` | the partner the booking is assigned to |
| `S` | `staff` |

Actions on a home whose status is `occupied`, `sold`, `transferred`, `closed` or `declined` are read-only. Writes return `409 home_closed`.

### 7.4 Endpoints

**System and demo**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | none | – | `{ ok: true, time: string, version: string }` |
| GET | `/api/me` | any | – | `MeResponse` |
| GET | `/api/demo/personas` | none | – | `PersonasResponse` |
| GET | `/api/demo/state` | none | – | `DemoState` |
| POST | `/api/demo/reset` | none | – | `{ ok: true, inviteUrl: string }` |
| POST | `/api/demo/homes/:homeId/cold-night` | none | – | `HomeWeather` |
| POST | `/api/demo/homes/:homeId/storm` | none | – | `HomeWeather` |
| POST | `/api/demo/homes/:homeId/clear-weather` | none | – | `HomeWeather` |
| POST | `/api/demo/bookings/:bookingId/complete` | none | – | `Visit` |

**Invitations and joining**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/invites/:token` | none | – | `InviteView` |
| POST | `/api/invites/:token/accept` | none | `AcceptInviteBody` | `ActorGrant` (409 `already_accepted` if a coordinator exists) |
| POST | `/api/invites/:token/decline` | none | `DeclineInviteBody` | `{ ok: true }` |
| GET | `/api/join/:token` | none | – | `JoinView` |
| POST | `/api/join/:token` | none | – | `ActorGrant` |

**Homes**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/homes/:homeId` | M | – | `Home` |
| PATCH | `/api/homes/:homeId` | C | `HomeSetupPatch` | `Home` |
| POST | `/api/homes/:homeId/activate` | C | – | `{ home: Home, tasks: Task[] }` (400 `occupancy_not_confirmed` if not confirmed) |
| GET | `/api/homes/:homeId/dashboard` | M | – | `Dashboard` |
| POST | `/api/homes/:homeId/transition` | C | `TransitionBody` | `Home` |
| GET | `/api/homes/:homeId/record` | M | – | `HomeRecord` |
| GET | `/api/homes/:homeId/export` | M | – | `HomeRecord` as a JSON file download |
| GET | `/api/homes/:homeId/activity?limit=50` | M | – | `Activity[]` newest first |

**Family members**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/homes/:homeId/members` | M | – | `Member[]` (removed members excluded) |
| POST | `/api/homes/:homeId/members` | C | `InviteMemberBody` | `{ member: Member, joinPath: string }` |
| PATCH | `/api/members/:memberId` | C, or self for name/email/phone/city | `MemberPatch` | `Member` |
| DELETE | `/api/members/:memberId` | C | – | `{ ok: true }` (409 `last_coordinator`) |

**Tasks**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/homes/:homeId/tasks?filter=all` | M | – | `PlanResponse` |
| POST | `/api/homes/:homeId/tasks` | H | `CreateTaskBody` | `Task` |
| GET | `/api/tasks/:taskId` | M | – | `TaskDetail` |
| PATCH | `/api/tasks/:taskId` | C | `TaskPatch` | `Task` |
| POST | `/api/tasks/:taskId/accept` | H | – | `Task` |
| POST | `/api/tasks/:taskId/decline` | H | `DeclineTaskBody` | `Task` |
| POST | `/api/tasks/:taskId/assign` | C (anyone) or H (only self) | `AssignTaskBody` | `Task` |
| POST | `/api/tasks/:taskId/complete` | H | `CompleteTaskBody` | `{ task: Task, nextTask: Task \| null }` |
| POST | `/api/tasks/:taskId/reopen` | H | – | `Task` |
| POST | `/api/tasks/:taskId/comments` | M | `CommentBody` | `Activity` |

**Visits, photos, house notes**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/homes/:homeId/visit-checklist` | M or P | – | `CheckItem[]` |
| GET | `/api/homes/:homeId/visits` | M | – | `VisitSummary[]` newest first |
| POST | `/api/homes/:homeId/visits` | H | `RecordVisitBody` | `Visit` |
| GET | `/api/visits/:visitId` | M, or P for its own booking | – | `Visit` |
| POST | `/api/homes/:homeId/photos` | H, or P with an active booking at this home | multipart: `file` (jpeg/png/webp, max 5 MB), `caption?`, `visitId?`, `noteId?`, `taskId?` | `Photo` |
| DELETE | `/api/photos/:photoId` | H | – | `{ ok: true }` |
| GET | `/api/homes/:homeId/notes` | M | – | `NotesResponse` |
| POST | `/api/homes/:homeId/notes` | H | `NoteBody` | `Note` |
| GET | `/api/notes/:noteId` | M | – | `Note` |
| PATCH | `/api/notes/:noteId` | H | `Partial<NoteBody>` | `Note` |
| DELETE | `/api/notes/:noteId` | H | – | `{ ok: true }` |

**Weather**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/homes/:homeId/weather` | M | – | `HomeWeather` (refetches when older than 60 min and not simulated) |
| POST | `/api/homes/:homeId/weather/refresh` | M | – | `HomeWeather` (always refetches unless simulated; runs the rules) |

**Local visits (bookings)**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/catalog/visit-packages` | none | – | `VisitPackage[]` |
| GET | `/api/homes/:homeId/booking-options?taskId=` | H | – | `BookingOptions` |
| GET | `/api/homes/:homeId/bookings` | M | – | `Booking[]` newest first |
| POST | `/api/homes/:homeId/bookings` | H | `CreateBookingBody` | `Booking` |
| GET | `/api/bookings/:bookingId` | M | – | `BookingDetail` |
| POST | `/api/bookings/:bookingId/approve` | A | – | `Booking` |
| POST | `/api/bookings/:bookingId/cancel` | the requester, A or C | `CancelBookingBody` | `Booking` |

**Partner**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/partner/jobs?status=open\|scheduled\|done` | P (any partner) | – | `PartnerJob[]` (open = requested; scheduled = confirmed/in_progress; done = completed/declined/cancelled) |
| GET | `/api/partner/jobs/:bookingId` | P | – | `PartnerJobDetail` |
| POST | `/api/partner/jobs/:bookingId/accept` | P | – | `Booking` |
| POST | `/api/partner/jobs/:bookingId/decline` | P | `PartnerDeclineBody` | `Booking` |
| POST | `/api/partner/jobs/:bookingId/start` | P | – | `Booking` |
| POST | `/api/partner/jobs/:bookingId/complete` | P | `PartnerReportBody` | `Visit` |

**Messages and insights**

| Method | Path | Actor | Body | Returns |
| --- | --- | --- | --- | --- |
| GET | `/api/notifications` | any | – | `NotificationsResponse` (newest first, max 100) |
| POST | `/api/notifications/read` | any | `MarkReadBody` (no ids = mark all) | `{ ok: true }` |
| GET | `/api/insights` | S | – | `Insights` |

<!-- CONTRACT:END -->

---

## 8. Pages

Each page lists: **Access**, **Data** (API calls), **Shows** (content, top to bottom), **Actions** (what people can do and what happens), **States** (empty, edge and error cases). "→" means "navigates to". Copy in quotes is suggested wording; keep its meaning, polish freely.

### P1 · Landing — `/`

**Access:** public. **Data:** none (static).

**Shows:**

1. **Hero:** "When a parent's home is left empty, someone has to look after it." Subline: "If Home Watch helps the family share the care: what needs doing, who's on it, and help when nobody can go." Primary action "Try the demo" (→ `/demo`), secondary "How it works" (→ `#how`).
2. **The problem**, three points:
   - "Nobody owns the house." Each sibling assumes another will go.
   - "Nobody knows the house." Where's the water main valve? Is the heating on?
   - "The rules are in a policy PDF." If's home terms describe supervising an empty home as a visit at least monthly, and say the water main should be closed when it's unoccupied for more than a week (§5, §5.5).
3. **How it works** (`id="how"`), five steps: "If offers help when the family gets in touch about the estate" · "Answer a few questions; get an ordered care plan with reasons" · "Every task gets a named owner" · "A cold night or storm turns into a check" · "If nobody can go, book a vetted local visit and get a report with photos".
4. **A cold night, as a short story:** "−18 °C is forecast for Tuesday. The heating check becomes urgent, and nobody has taken it. Aino books a check visit in two minutes. By lunchtime the report is in: 17 °C inside, heating running, one photo of snow building up on the roof, already added as a task."
5. **What families get:** one shared plan · a named owner for every task · house notes in one place · a record of every visit.
6. **What it isn't:** "Not a claim guarantee: the record shows what was checked, not what's covered." · "Not a safety score." · "Never contact based only on a death notice." · "Not a sensor product."
7. **Why If:** "If knows the moment, writes the rules and is there when the home changes hands. Home Watch uses all three to prevent damage instead of paying for it afterwards."
8. **Closing:** "The family knows who is looking after the house, and can get help when nobody can go." + "Try the demo".

### P2 · Demo hub — `/demo`

**Access:** public. **Data:** `GET /api/demo/personas`, `GET /api/demo/state`, `GET /api/me` (if a cookie is set). Honors `?next=` (only internal paths) after choosing a persona.

**Shows:**

1. Title "Demo" + "Pick who you are. Switching is instant, and everyone sees the same live data."
2. **Currently viewing as** {label} (if a cookie is set) + "Stop viewing".
3. **Start the story:** "Open Aino's invitation from If" (→ `inviteUrl`), with the main home's status: invited → "Not started yet"; setup → "Setup in progress"; active → "Care plan active"; closed → "Plan closed".
4. **Personas** from the API, by group: group title + description, then each persona's label and subtitle with "View as".
5. **Presenter controls** (labelled "Simulated events"), each with an explanation and a result message after it runs:
   - "Cold night (−18 °C) at the Virtanen home" → `POST /api/demo/homes/{mainHomeId}/cold-night` → "Cold night forecast for tomorrow. The heating check is now urgent." Enabled only when the main home is active.
   - "Storm at the Virtanen home" → `.../storm`.
   - "Back to the real forecast" → `.../clear-weather`. Show which forecast is in use (`forecastSource`).
   - "Complete the latest partner visit" → `POST /api/demo/bookings/{latestBooking.id}/complete` → "Visit report delivered." Enabled when the latest booking is pending approval, requested, confirmed or in progress; shows its status.
   - "Reset all demo data" → a two-step in-page confirmation ("This deletes everything created in the demo. Continue?"; never `window.confirm`) → `POST /api/demo/reset` → clears the cookie → "Demo reset. Start again from the invitation."
6. **Demo script**, 9 numbered steps, each with a "Go" link where one applies:
   1. Open the invitation as Aino and accept (→ `/invite/demo-virtanen`)
   2. Answer the 5 setup questions → create the care plan
   3. Family page: invite Mikko (helper) → Plan: assign him "First visit"
   4. View as Mikko → House notes: add the water main valve with a photo → record a visit
   5. Presenter: cold night
   6. View as Aino → Overview → "Request a local visit" for the heating check → approve and book
   7. Presenter: complete the partner visit
   8. As Aino: Overview, then Record → download or print
   9. View as If pilot team → Insights

**States:** backend unreachable → "The Home Watch service isn't responding. Start the backend (port 3001) and reload."

### P3 · Invitation from If — `/invite/[token]`

**Access:** public. **Data:** `GET /api/invites/:token`.

**Shows:**

1. Sender line: "From {fromLabel}" (e.g. "If estate support").
2. The message from the API, e.g. "We're sorry for your loss. If you're looking after Eila Virtanen's home at Esimerkkitie 12, Kaarina, Home Watch can help the family keep it safe while it's empty."
3. **What you get:** "A short care plan based on the home and the policy's rules" · "Share tasks with your family and see who's on what" · "Book a local check visit when nobody can go (priced, and only if you approve)".
4. **Cost:** "The plan is free. Local visits are optional and priced before you approve (prototype prices)."
5. **Privacy:** "Only people you invite can see this home. You can close the plan at any time."
6. **Accept form:** your name · your relation to {estateName} (choices) · city (optional) · phone (optional) · email (optional). For the token `demo-virtanen`, prefill Aino Virtanen, Child, Helsinki, +358 40 000 0201.

**Actions:**

- "Accept and start" → `POST .../accept` → set the cookie to `grant.actor` → `/setup/{homeId}?step=1`.
- "Someone still lives in the home" → `POST .../decline {reason:'someone_lives_there'}` → message: "Thanks for telling us. Home Watch is for homes nobody lives in. If can still help with the estate's insurance questions."
- "Not now" → decline `not_now` → "You can come back to this link at any time."
- "I'm not the right person" → decline `not_responsible` → "Please forward this link to the family member handling the estate."

**States:** `alreadyAcceptedBy` set → "This invitation was accepted by {name}." + "Continue as {name}" (sets the cookie to that member; demo convenience) · status `declined` → "This invitation is closed." · invalid token → 404 "This invitation link isn't valid."

### P4 · Join the family — `/join/[token]`

**Access:** public. **Data:** `GET /api/join/:token`.

**Shows:** "{invitedBy} invited you to help look after {estateName}'s home at {addressLine}, {city}." · "Your role: {role}" + its meaning (section 9) · "You can approve local visits" if `canAuthorise` · what helpers do: "take tasks, record visits, add house notes" · privacy line as in P3.

**Actions:** "Join" → `POST /api/join/:token` → set the cookie → `/homes/{homeId}`.

**States:** removed member → "This invitation is no longer active." · invalid token → 404.

### P5 · Setup — `/setup/[homeId]?step=1..5`

**Access:** coordinator. **Data:** `GET /api/homes/:id`, `GET /api/me`, `GET /api/homes/:id/members` (step 4).

**Shows on every step:** "Setting up {estateName}'s home · {addressLine}, {city}" · "Step N of 5" with the step names (The home · Access · Heating and water · Family · Review) · Back / Continue. Continue saves that step (`PATCH /api/homes/:id`) before moving on, so leaving and returning keeps the answers.

**Step 1 — The home**

- "Is anyone living in the home now?" — "No, it's empty" / "Yes, someone lives there". Choosing yes shows: "Home Watch is for homes nobody lives in. If someone still lives there, they can keep using their own home insurance as usual." + "Close this invitation" → decline `someone_lives_there` → closed message.
- "Since when has it been empty?" (date, optional)
- "When did someone last visit?" (date, optional)
- Building type (Detached house · Semi-detached · Terraced · Cottage · Other) · Year built (optional)
- Saves `occupancyConfirmed: true` + the fields.

**Step 2 — Access and authority**

- "Can you authorise access to the home, for example for a local visit?"
  - "Yes" → `authorityConfirmed: true` and `PATCH /api/members/{me} { canAuthorise: true }`
  - "No, someone else can" → `authorityConfirmed: true` + note "Invite them in step 4 and let them approve visits."
  - "Not sure yet" → `authorityConfirmed: false` + note "You can still share tasks. Booking a local visit needs someone who can authorise access."
- "Who has keys?" (text) · "Anything a visitor should know about access?" (text; hint "Don't write alarm codes or key-box codes here.")

**Step 3 — Heating and water** (each question has "Not sure"; the hint under the step reads "Not sure is fine. It becomes a 'not confirmed' item to check on the first visit.")

- "How is the home heated?" (District heating · Electric · Oil · Ground-source heat pump · Air heat pump · Wood · Not sure)
- "Is the heating on?" (Yes · No · Not sure)
- "Where does the water come from?" (Municipal water · Own well · Not sure)
- "Is the main water valve closed?" (Yes · No · Not sure) + why: "If's home terms say it should be closed when the home is unoccupied for more than a week."
- "Is there a burglar alarm?" (Yes · No · Not sure)

**Step 4 — Family**

- The members already in the home (name, role, "can approve visits").
- Invite form: name · relation to {estateName} · role (Helper · Viewer · Coordinator) with one-line meanings · "Can approve local visits" · phone · email → `POST /api/homes/:id/members`.
- Note: "Invitations are simulated: in this demo they appear in the person's Messages, and you can switch to them from the Demo page."
- "Skip for now" is allowed.

**Step 5 — Review**

- A summary of every answer, grouped by step, each group with "Edit" (→ that step).
- Not-sure answers listed as "Will be checked on the first visit: …".
- "The plan is based on If's published home terms and practical advice. Check the terms version on your own policy."
- "Create the care plan" → `POST /api/homes/:id/activate` → `/homes/{id}?welcome=1`. A `400 occupancy_not_confirmed` → back to step 1 with the message.

### P6 · Home shell — all `/homes/[homeId]/*` pages

**Data:** `GET /api/me`, `GET /api/homes/:id`, plus the badge counts from `GET /api/homes/:id/dashboard` (cache per request).

**Shows:** "{estateName}'s home" · {addressLine}, {postalCode} {city} · status in words (Active · Closed: sold on {date} · …) · the home navigation (6.3) with badges · "Viewing as {name} · {role}". If the status is occupied, sold, transferred or closed: a banner "This plan was closed on {date} ({reason}). Everything stays readable, and you can still download the record." All write actions are hidden on closed homes.

### P7 · Overview — `/homes/[homeId]`

**Access:** member. **Data:** `GET /api/homes/:id/dashboard`. Auto-refresh every 10 s.

**Shows, top to bottom:**

1. **Welcome** (only with `?welcome=1`): "Your care plan is ready: {counts.open} tasks. Start with the urgent ones, and invite family to share them." + "Invite family" (→ Family).
2. **One-line status:** e.g. "2 things need an owner · 1 overdue · next visit due Sat 1 Nov". If everything is fine: "Nothing urgent. Next visit due {date}."
3. **Supervision:** copy by state (section 9), the last visit by whom, the next due date, then `ruleLabel` with a link to `source`.
4. **Weather:** today + 3 days (day, min/max °C, gusts m/s, snow cm), source line ("Forecast: Open-Meteo, updated 14:05" or "Simulated forecast (demo)"), and each active alert: message + its task's state ("Heating check: nobody has taken it yet" / "Mikko is on it" / "Done") with a link to the task. "Weather details" → Weather.
5. **Needs attention** (`needsAttention`, up to 6): per task, the title · why it's listed ("Nobody has taken this yet" / "3 days overdue" / "Urgent, due Tue 18:00") · owner or "Nobody yet" · a "Not confirmed: …" line if `needsInfo` · "Local visit booked for {slot}" if `bookingId`. Actions per task: "I'll do it" (accept; helpers and coordinators) · "Request a local visit" (when `needsOwner`; → `/help?taskId=`) · open the task.
6. **Local visit in progress** (`activeBooking`): package · partner · slot · status in words · → booking page.
7. **My tasks** (`myTasks`): title · due · → task.
8. **Missing house essentials** (`essentialsMissing`): e.g. "Neighbour contact not added yet" → `/notes/new?essential=…`.
9. **Family:** each member's name, role, open tasks, last visit; "Invite family" for coordinators.
10. **Recent activity** (8): actor, message, relative time ("12 min ago"); "See everything" → Record.
11. **Quick actions:** Record a visit · Add a house note · Request a local visit · Add a task (each shown only if allowed).

### P8 · Care plan — `/homes/[homeId]/plan?filter=all`

**Access:** member. **Data:** `GET /api/homes/:id/tasks?filter=`. Auto-refresh every 10 s.

**Shows:**

- Intro: "Every task has a reason, an owner and a due date. 'Not confirmed' means something nobody has checked yet."
- **Filters with counts:** All · Mine · Open · Needs an owner · Overdue · Done.
- **Tasks grouped** (when the filter is All or Open): "Needs an owner" · "Overdue" · "This week" (due within 7 days) · "Later" · "Done" · "Cancelled" (All only).
- **For each task:** title · category · priority (Urgent / High; Normal shows nothing) · due ("Due Tue 21 Oct, 18:00" / "3 days overdue" / "Done Mon 20 Oct by Mikko") · owner or "Nobody yet" · short source ("If terms §5.5") · "Not confirmed: …" · "Local visit booked {date}" · "Repeats every 30 days" · "Can't do it: Mikko" (declinedBy) · origin hint for weather tasks ("From the cold-night forecast") and follow-ups ("From Jari's visit").

**Actions:** "I'll do it" per open task · open the task · "Add a task" (→ P9; helpers and coordinators).

**States:** empty filter → "Nothing here." · plan not created yet → → setup.

### P9 · New task — `/homes/[homeId]/tasks/new`

**Access:** helper or coordinator. **Data:** `GET /api/homes/:id/members`.

**Fields:** title · why it matters (optional) · category · priority (Normal · High · Urgent) · due date and time (default 7 days ahead, 18:00) · owner (coordinators: anyone or nobody; helpers: me or nobody).

**Actions:** "Add task" → `POST /api/homes/:id/tasks` → → the task page.

### P10 · Task — `/homes/[homeId]/tasks/[taskId]`

**Access:** member. **Data:** `GET /api/tasks/:id` (`TaskDetail`).

**Shows:**

1. Title, and a status sentence: "Mikko is on it, due Tue 21 Oct, 18:00" / "Nobody has taken this yet, due …" / "Done by Mikko on Mon 20 Oct" / "Cancelled".
2. Priority, category, overdue state.
3. **Why it matters** (`why`).
4. **How to do it** (`how`, numbered).
5. **Source:** `source.label` linked to `source.url` + "Check the terms version on your own policy."
6. **Not confirmed:** `needsInfo`.
7. **Where it came from:** plan ("Part of the care plan") · weather ("Added because of the forecast for {date}") · follow-up ("Follow-up from {visitor}'s visit on {date}" → visit) · manual ("Added by {created by}").
8. Repeats ("Repeats every 30 days; the next one is created when this is done").
9. **Local visit** card if `booking` (package, slot, status → booking page).
10. **Completion** (if done): who, when, note, photos.
11. "Can't do it" list: the names in `declinedBy`.
12. **Activity** for this task, including comments, oldest first.

**Actions** (only those allowed by role and status):

- "I'll do it" → accept.
- "I can't do it" → requires a reason (e.g. "I'm abroad until November") → decline.
- "Assign to…" → coordinators pick any joined member or "Nobody"; helpers can pick "Me" or "Nobody".
- "Mark as done" → optional note + photos → complete → if `nextTask` came back: "Done. The next one is due {date}."
- "Reopen" (done tasks).
- "Request a local visit" → `/help?taskId={id}` (open tasks without a booking).
- "Edit" (coordinators): title, why, priority, due → `PATCH`.
- "Cancel task" (coordinators): two-step confirmation → `PATCH { status: 'cancelled' }`.
- "Comment" (everyone, including viewers).

### P11 · Visits — `/homes/[homeId]/visits`

**Access:** member. **Data:** `GET /api/homes/:id/visits`, `GET /api/homes/:id/dashboard` (for supervision).

**Shows:** the supervision summary (as on the overview) · "Record a visit" (helpers and coordinators) · visits, newest first: date and time · visitor (name; partner visits are labelled "Local partner visit") · indoor temperature · "9 OK · 1 concern" · photo count · → report.

**States:** none yet → "No visits recorded yet. The first visit matters most: it finds the valves and checks the heating."

### P12 · Record a visit — `/homes/[homeId]/visits/new`

**Access:** helper or coordinator. **Data:** `GET /api/homes/:id/visit-checklist`, `GET /api/homes/:id/tasks?filter=open`.

**Fields and content:**

- When: date and time (default now; not more than an hour in the future).
- Indoor temperature, °C (optional, one decimal; hint "A thermometer reading or the thermostat display").
- **Checklist:** for each item its label and help text, a result (OK · Concern · Not checked; default Not checked) and a note. The note is required for Concern ("What did you see?").
- Photos (several, optional captions).
- General notes.
- **What this visit will close:** list the open tasks it will complete: always "Monthly supervision visit" and "First visit" if open, plus "Check the heating…" when Heating is OK, and the snow, storm, heat-pump and oil checks when their item is OK. Update the list live as results change.
- "Concerns become follow-up tasks automatically."

**Actions:** "Save visit" → `POST /api/homes/:id/visits` → → `/visits/{id}?new=1`.

### P13 · Visit report — `/homes/[homeId]/visits/[visitId]`

**Access:** member. **Data:** `GET /api/visits/:id`.

**Shows:**

1. With `?new=1`: "Visit saved. {completedTasks.length} tasks completed, {followUpTasks.length} follow-ups created."
2. "Visit on {Tue 21 Oct 2026, 10:12} by {visitorName}" (+ "Local partner visit", linking to the booking, if `bookingId`).
3. Indoor temperature.
4. **Checks:** concerns first, then OK, then not checked; each with its label, result and note.
5. **Photos** with captions and who took them.
6. General notes.
7. **Completed by this visit:** task links.
8. **Follow-ups created:** task links with owner ("Nobody yet").
9. "This report records what the visitor saw. It isn't an insurance decision."

**Actions:** "Print" (browser print) · back to Visits.

### P14 · House notes — `/homes/[homeId]/notes`

**Access:** member. **Data:** `GET /api/homes/:id/notes`.

**Shows:**

- Intro: "Everything someone needs to look after this house, in one place. Don't store alarm codes, key-box codes or passwords."
- **Essentials:** each one's label, why, and state (Missing · Added, not checked on site · Confirmed · Confirmed with photo), with "Add" (→ `/notes/new?essential=KEY&category=CAT`) or "Edit".
- **Notes by category** (Water · Heating · Electricity · Access · Contacts · Appliances · Other): title · the first two lines of the body · photo thumbnails · "Not checked on site" if not confirmed · updated by and when · → note.

**Actions:** "Add a note" (helpers and coordinators).

### P15 · Note — `/homes/[homeId]/notes/new` and `/homes/[homeId]/notes/[noteId]`

**Access:** member (editing: helper or coordinator). **Data:** `GET /api/notes/:id` when editing.

**Fields:** category · title (prefilled with the essential's label when opened from an essential) · text · essential (shown as a fixed label when set) · "I've checked this on site" (confirmed) · photos (add or remove).

Hints by essential:

- water main valve → "Say where it is and whether it's open or closed now."
- key location → "Say who has keys and where a spare is. Never write codes."
- neighbour → "Name and phone of someone nearby who agreed to help."

**Actions:** "Save" → `POST` or `PATCH` → → notes with "Saved." (when the essential completes a task, the plan shows it on the next load) · "Delete" (two-step confirmation). Viewers see the note read-only.

### P16 · Weather — `/homes/[homeId]/weather`

**Access:** member. **Data:** `GET /api/homes/:id/weather`.

**Shows:**

- Today + 3 days: date, min/max °C, gusts m/s, snow cm. Mark any value that crosses a threshold, in words too ("hard frost").
- Source and update time; "Simulated forecast (demo)" when simulated.
- **Active alerts:** message · linked task, its state and owner · → task.
- **When Home Watch acts** (from `thresholds`): "−15 °C or colder: the heating check becomes urgent" · "−5 °C or colder: a heating check is added" · "Gusts of 20 m/s or more: a check after the storm" · "20 cm of snow or more: a roof check from the ground" + "Prototype thresholds."
- "A forecast can't tell us the temperature inside. It's a reason to check, not proof of a problem."
- **Recent alerts** (30 days): date · message · "Checked before the day" yes/no.

**Actions:** "Refresh forecast" → `POST .../weather/refresh`.

### P17 · Request a local visit — `/homes/[homeId]/help?taskId=`

**Access:** helper or coordinator (viewers see "Ask {coordinator} to request a visit"). **Data:** `GET /api/homes/:id/booking-options?taskId=`, `GET /api/homes/:id/bookings`.

**Shows, as one page in sections:**

0. **Context:** if `task`: "For: {task.title}" + why it's urgent (overdue, needs an owner, the alert date). If an active booking exists: "There's already a visit {status} for {slot}" → booking page.
   Intro: "A vetted local partner visits, follows the checklist and sends a report with photos." + "Fictional partner: {partner.name}, {partner.area}."
1. **Choose a visit:** each package's name, duration, what's included, lead time, total price, and the split "€59 to the partner + €10 If coordination fee" + "Prototype price, not a quote".
2. **Choose a time:** the selected package's slots grouped by day ("Tue 21 Oct · 09:00–11:00 · 13:00–15:00"). None → "No times left in the next 3 days. The urgent check may still have one."
3. **Access:** the method choices (labels from the API) + details (hint "e.g. 'Key box by the back door; code sent separately'. Don't write codes here."). Show "Key holder: {keyHolder}".
4. **Notes for the partner** (optional).
5. **Review and approve:** package · time · access · partner · total and split.
   - If `canApprove`: a required statement "I can authorise access to this home for this visit" → "Approve and book" (sends `confirmAuthority: true`).
   - Otherwise: "Your request goes to {authorisedMembers} for approval." → "Send for approval". If nobody can approve: "Nobody in the family can approve visits yet. Ask the coordinator to give someone approval rights (Family page)." (button disabled).
   - "Booking is simulated in this prototype. No payment is taken."

**Actions:** submit → `POST /api/homes/:id/bookings` → → `/help/{bookingId}`. Show `409 slot_unavailable` as "That time was just taken. Pick another."

### P18 · Local visit status — `/homes/[homeId]/help/[bookingId]`

**Access:** member. **Data:** `GET /api/bookings/:id` (`BookingDetail`). Auto-refresh every 10 s.

**Shows:**

1. Status headline (section 9 copy), e.g. "Sent to Talonvahti Demo Oy, waiting for them to confirm."
2. Package and what's included · time · partner (name, area, phone; "Fictional partner") · access method and details · notes · the linked task (→ task) · total and split.
3. Requested by {name} on {date} · approved by {name} on {date}.
4. **Timeline** (oldest first): each step with time and who.
5. **When completed:** a report summary (indoor temperature, "9 OK · 1 concern", follow-ups) → full report.
6. "Partner responses are simulated in this demo."

**Actions:** "Approve" (if `canApprove`) · "Cancel visit" with a reason (if `canCancel`; two-step).

### P19 · Family — `/homes/[homeId]/family`

**Access:** member. **Data:** `GET /api/homes/:id/members`.

**Shows:**

- **Roles explained:** Coordinator — "manages the plan, the family and the home's status" · Helper — "takes tasks, records visits, adds notes" · Viewer — "sees everything and can comment" · "Can approve local visits" — "may authorise a partner's access to the home".
- **Members:** name · relation to {estateName} · city · role · can approve visits · status (Invited / Joined on {date}) · open tasks · tasks done · visits · last visit.
- **Pending invitations:** name, how invited (SMS/email, simulated), the join link path, "In this demo you can also switch to them from the Demo page."

**Actions:**

- Coordinators: "Invite someone" (name · relation · role · can approve · phone · email · city) · change role · toggle "can approve" · "Remove" (two-step; explains "Their open tasks go back to 'Nobody yet'"). `409 last_coordinator` → "The home needs at least one coordinator."
- Everyone: edit their own name and contact details.

### P20 · Home record — `/homes/[homeId]/record` (+ `/record/print`, `/record/download`)

**Access:** member. **Data:** `GET /api/homes/:id/record`.

**Shows:**

1. "A complete record of what was checked and done for this home."
2. **Summary:** period (activated → today, or → closed date) · visits (family / partner) · tasks completed · open tasks · weather alerts and how many were checked before the day · local visits.
3. **Timeline** (newest first; all activity, with visits, completed tasks, bookings and alerts emphasised): date, who, what; links to visits and tasks.
4. **Family members** and their roles.
5. The **disclaimer** from the API, prominent.

**Actions:**

- "Download (JSON)" → `/homes/[homeId]/record/download`, a route handler that calls `GET /api/homes/:id/export` server-side and streams the file with the backend's `Content-Disposition`.
- "Print or save as PDF" → `/record/print`.

**Print view:** one clean column, no navigation. The home header and "Generated {date}", the summary, every visit in full (checks and results, temperature, notes, photo thumbnails with captions), completed tasks with who and when, open tasks, weather alerts, bookings and the disclaimer. Calls `window.print()` on load, with a "Print" button as a fallback.

### P21 · Settings and what happens next — `/homes/[homeId]/settings`

**Access:** member (editing: coordinator). **Data:** `GET /api/homes/:id`.

**Shows:**

1. **Home details:** address, estate name, building type, year built.
2. **Setup answers:** emptiness dates, access (key holder, access notes), heating, water, alarm. Coordinators can edit them (`PATCH`), with a note: "Changing these won't change existing tasks. Add or edit tasks in the plan if needed."
3. **What happens to the home next?** Choices with one-line explanations:
   - "Someone lives there again" (occupied)
   - "Sold"
   - "Passed to an heir" (transferred)
   - "Close the plan for another reason" (closed)

   Plus a note field. For sold or transferred: "The new owner would like help arranging home insurance" with "Optional. If will only contact them if they ask."
   A two-step confirmation lists what happens: "Open tasks are cancelled · active local visits are cancelled · everything stays readable · you can still download the record." → `POST .../transition` → → overview (with the closed banner).
4. **Data and privacy:** what's stored (house notes, photos, visit records, names and contact details of invited family) · who sees it ("invited family; a visit partner sees only the address, access details, essential notes and the checklist for their visit") · "Download the record" · "In a real service you could delete all data here."

### P22 · Messages — `/notifications`

**Access:** any actor. **Data:** `GET /api/notifications`. Auto-refresh every 15 s.

**Shows:** the title "Messages", then newest first: channel label ("SMS (simulated)" · "Email (simulated)" · "In app") · title · body · time · unread marker · "Open" when there's a link.

**Actions:** "Open" → marks it read (`POST /api/notifications/read { ids:[id] }`) → → its link · "Mark all as read".

**States:** none → "No messages yet."

### P23 · Partner: jobs — `/partner`

**Access:** partner. **Data:** `GET /api/partner/jobs?status=open`, `?status=scheduled`, `?status=done`. Auto-refresh every 10 s.

**Shows:** partner name, area, "Fictional partner" · three groups:

- **New requests:** address · city · package · time · what you're paid (partner price) · requested and approved by
- **Scheduled:** confirmed and in progress
- **Done:** completed, declined, cancelled, with the date

Each item → job.

**States:** an empty group → "Nothing here right now."

### P24 · Partner: job — `/partner/jobs/[bookingId]`

**Access:** partner. **Data:** `GET /api/partner/jobs/:id` (`PartnerJobDetail`).

**Shows:**

1. Status in words.
2. Address, city and estate name.
3. Time · package and what's included · "You're paid {partnerPrice}. If's coordination fee is charged to the family separately."
4. **Access:** method, details, key holder, access notes.
5. **Contact:** the coordinator's name and phone.
6. **House essentials:** each essential note (title, text, photos), e.g. the water main valve with its photo.
7. The linked task's title, if any.

**Actions by status:**

- requested → "Accept" · "Decline" (reason required)
- confirmed → "Start visit"
- in progress (or confirmed) → **visit report form:** indoor temperature · the checklist from `checklist` (OK · Concern · Not checked + note; note required for Concern) · photos · notes → "Complete visit" → `POST .../complete` → a confirmation with the report summary
- completed, declined, cancelled → read-only (with the report summary if completed)

### P25 · If pilot dashboard — `/insights`

**Access:** staff. **Data:** `GET /api/insights`.

**Shows:**

1. "Pilot dashboard" + `dataNote`, prominent (demo data, not real customers).
2. **Adoption:** invited · setup completion rate · active · average family members per home · joined rate.
3. **Responsibility:** urgent and high tasks accepted within 48 h · average hours to the first accepted task · needs an owner now · overdue now · completed in the last 30 days.
4. **Prevention:** supervision on time (rate) · homes overdue · weather alerts (30 days) · alerts checked before the day (rate).
5. **Visits and revenue:** family and partner visits (30 days) · paid visits requested and completed · conversion rate · service revenue (If's fee only) · average If fee.
6. **Transitions:** occupied · sold · transferred · closed · new owners asking for help with cover.
7. **Funnel:** the 5 stages with counts and the step-to-step conversion %.
8. **Homes:** city · status · days active · supervision · open tasks · paid visits.
9. **Assumptions:** each label and value.
10. "Service revenue, premiums and avoided claims are separate measures and are never added together. Avoided claims are not estimated here."

### P26 · Errors

- **Not found** (`not-found.tsx`): "We couldn't find that page." → Home · Demo.
- **Forbidden** (`/forbidden`): "You don't have access to this home. You're viewing as {name}." → "Switch person".
- **Error boundary** (`error.tsx`): `backend_unreachable` → "The Home Watch service isn't responding. If you're running locally, start the backend on port 3001." Anything else → "Something went wrong." + "Try again".

---

## 9. Copy, formatting and labels

### 9.1 Voice

Calm, plain and kind. Short sentences. Talk about the house, not the death ("Eila's home", never "the deceased"). No insurance jargon. Never use "guarantee", "safe", "compliant" or "covered" to describe what the app does. Urgency comes from facts: "Nobody has taken this yet", "−18 °C on Tuesday night".

### 9.2 Formatting (`lib/format.ts`, Europe/Helsinki)

| What | Format |
| --- | --- |
| Date | `Tue 21 Oct` (add the year if it isn't the current year) |
| Date and time | `Tue 21 Oct, 18:00` (24 h) |
| Slot | `Tue 21 Oct · 09:00–11:00` |
| Relative | `12 min ago`, `in 2 days`, `3 days overdue` |
| Temperature | `−18 °C` (real minus sign U+2212, a thin space before °C is fine) |
| Wind | `26 m/s` · Snow: `12 cm` |
| Money | `€69`, or `€69.50` when there are cents |
| Rates | `82%` |

### 9.3 Status copy

**Supervision:**

- `no_visit_yet` → "No visit recorded yet. The first visit is due {date}."
- `ok` → "Last visit {n} days ago by {name}. Next one due by {date}."
- `due_soon` → "Next visit due in {n} days ({date})."
- `overdue` → "The monthly visit is {n} days overdue."

**Booking:**

- `pending_approval` → "Waiting for approval from {names}."
- `requested` → "Sent to {partner}, waiting for them to confirm."
- `confirmed` → "Confirmed for {slot}."
- `in_progress` → "{partner} is at the house now."
- `completed` → "Visit done. The report is ready."
- `cancelled` → "Cancelled: {reason}."
- `declined` → "{partner} couldn't take this visit: {reason}."

**Task:**

- open with no owner → "Nobody has taken this yet"
- accepted → "{name} is on it"
- done → "Done by {name} on {date}"
- cancelled → "Cancelled"

### 9.4 Labels (`lib/labels.ts`)

| Enum | Labels |
| --- | --- |
| Role | coordinator: Coordinator · helper: Helper · viewer: Viewer |
| Relation | child: Child · spouse: Spouse · sibling: Sibling · grandchild: Grandchild · relative: Other relative · friend: Friend · other: Other |
| HomeStatus | invited: Invited · setup: Setting up · active: Active · occupied: Lived in again · sold: Sold · transferred: Passed to an heir · closed: Closed · declined: Not used (someone lives there) |
| BuildingType | detached: Detached house · semi_detached: Semi-detached · terraced: Terraced house · cottage: Cottage · other: Other |
| HeatingType | district: District heating · electric: Electric heating · oil: Oil heating · ground_heat_pump: Ground-source heat pump · air_heat_pump: Air heat pump · wood: Wood heating · unknown: Not sure |
| WaterSource | municipal: Municipal water · well: Own well · unknown: Not sure |
| YesNoUnknown | yes: Yes · no: No · unknown: Not sure |
| TaskPriority | urgent: Urgent · high: High · normal: Normal |
| TaskCategory | water: Water · heating: Heating · electricity: Electricity · security: Security · outside: Outside · admin: Paperwork · visit: Visit · appliances: Appliances · other: Other |
| CheckResult | ok: OK · concern: Concern · not_checked: Not checked |
| NoteCategory | water: Water · heating: Heating · electricity: Electricity · access: Access · contacts: Contacts · appliances: Appliances · other: Other |
| AccessMethod | from `BookingOptions.accessMethods` (labels come from the API) |
| BookingStatus | pending_approval: Waiting for approval · requested: Sent to partner · confirmed: Confirmed · in_progress: In progress · completed: Done · cancelled: Cancelled · declined: Declined |
| WeatherRule | hard_frost: Hard frost · frost: Frost · storm: Storm · heavy_snow: Heavy snow |
| NotificationChannel | in_app: In app · sms: SMS (simulated) · email: Email (simulated) |

---

## 10. Verification (`npm run check:routes`)

`scripts/check-routes.ts` (loads `.env.local`; frontend base `FRONTEND_URL`, default `http://localhost:3000`):

1. Call the backend directly (with `BACKEND_API_KEY`) to `POST /api/demo/reset`, accept `/api/invites/demo-virtanen/accept` as "Aino Virtanen", patch the setup (occupancy, authority, district heating, municipal water) and activate. Read `/api/demo/personas` to get the actor strings for Aino, Sanna (example home), the partner and staff.
2. Fetch each page below with the header `Cookie: hw_actor=<actor>`. Assert HTTP 200 (no redirect to `/demo` or `/forbidden`) and that the HTML contains the phrase listed:

| Route | As | Must contain |
| --- | --- | --- |
| `/` | none | "someone has to look after it" |
| `/demo` | none | "Simulated events" |
| `/invite/demo-virtanen` | none | "accepted by" (it was accepted in step 1) |
| `/homes/{main}` | Aino | "Needs attention" |
| `/homes/{main}/plan` | Aino | "Needs an owner" |
| `/homes/{main}/tasks/{any task}` | Aino | "Why it matters" |
| `/homes/{main}/visits` | Aino | "No visits recorded yet" |
| `/homes/{main}/visits/new` | Aino | "Heating is running" |
| `/homes/{main}/notes` | Aino | "Water main valve" |
| `/homes/{main}/notes/new?essential=water_main_valve&category=water` | Aino | "checked this on site" |
| `/homes/{main}/weather` | Aino | "When Home Watch acts" |
| `/homes/{main}/help` | Aino | "Check visit" |
| `/homes/{main}/family` | Aino | "Coordinator" |
| `/homes/{main}/record` | Aino | "This record lists observations" |
| `/homes/{main}/settings` | Aino | "What happens to the home next" |
| `/homes/{example}` | Sanna | "Lindqvist" |
| `/homes/{example}/visits/{any visit}` | Sanna | "Visit on" |
| `/homes/{example}/help/{completed booking}` | Sanna | "report is ready" |
| `/notifications` | Sanna | "Messages" or "No messages yet" |
| `/partner` | partner | "New requests" |
| `/insights` | staff | "Pilot dashboard" |
| `/homes/{example}` | Aino | redirect to `/forbidden` (assert the redirect) |

3. Print ✔/✘ per route and exit 1 on any failure. Finish by calling `POST /api/demo/reset` again so the demo starts clean.

---

## 11. Deploy to Vercel

Steps (Claude Code runs them if `vercel whoami` works and `BACKEND_PROD_URL` is set; otherwise print them):

1. `vercel link --yes` (project name `if-home-watch`).
2. `printf "%s" "$BACKEND_PROD_URL" | vercel env add BACKEND_URL production` and `printf "%s" "$BACKEND_API_KEY" | vercel env add BACKEND_API_KEY production` (repeat for `preview`).
3. `vercel deploy --prod`, then open `/` and `/demo` on the production URL and check the personas load.

The backend's `API_KEY` and the frontend's `BACKEND_API_KEY` must be the same value.

---

## 12. Out of scope (do not build)

Real login · real SMS or email · payments · maps · push notifications · offline mode · languages other than English · editing the plan templates · admin screens. Mention them only as "later" where the copy needs to.
