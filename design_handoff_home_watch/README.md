# Handoff: Home Watch (full UI redesign)

## Overview
Home Watch helps a family share the care of an empty home after a parent dies: what needs doing, who is on it, and help when nobody can go. This package is a complete **high-fidelity redesign of every page** in `mabubakr1113/if-insurance-challenge-frontend` (Next.js App Router + Tailwind v4). It covers the family app, the local-partner view, the staff pilot dashboard and the setup flow, plus loading, error, empty, validation and pending states.

**Goal for Claude Code:** restyle and restructure the existing frontend to match this design, in one pass. The data, server actions, API contract (`lib/contract.ts`), guards and labels stay as they are. Only the presentation layer changes.

## About the design files
Files in `prototype/` are **design references built in HTML**. They are working prototypes that show the intended look and behaviour; they are not production code to copy. Recreate them in the existing Next.js + Tailwind codebase using its patterns: server components, `ActionForm`/`SubmitButton`, `components/ui.tsx` and `components/styles.ts`.
- `prototype/Home Watch App v3.dc.html` is the full app. To open it, serve the `prototype/` folder (e.g. `npx serve prototype`) and open the file. Use the "View the demo as" menu at the bottom of the sidebar to switch roles.
- `prototype/Insurer Landing v2.dc.html` is a marketing landing page whose Home Watch tile opens the app. It's optional.
- `screens/` holds 51 captures of every screen, action and state (index at the end of this file).

## Fidelity
**High fidelity.** Match colours, type, spacing, radii and layout exactly. Where this README and a screenshot disagree, this README wins.

**Branding:** the prototype uses the placeholder "Home Watch · by Nordvik" to avoid copying If's brand. In the repo, keep the wordmark rule from `docs/FRONTEND.md` §2: text only, "If Home Watch" with a small "Prototype" tag, and no If logo or brand assets. Copy, voice and the "simulated" labels follow `docs/FRONTEND.md` §5.5 and §9.

---

## Design tokens

### Colours (add these to `app/globals.css` under `@theme inline`, replacing the current palette)
| Token | Hex | Use |
|---|---|---|
| `--color-paper` | `#faf6f3` | App background |
| `--color-sidebar` | `#f5ede8` | Sidebar background |
| `--color-card` | `#fffdfb` | Cards, list containers, inputs on paper |
| `--color-white` | `#ffffff` | Inputs, unselected chips |
| `--color-ink` | `#3b1f3a` | Primary text, primary buttons, selected states (plum) |
| `--color-ink-strong` | `#2a1529` | Primary button hover, toast background |
| `--color-ink-soft` | `#4d3550` | Secondary body text (note bodies, rule text) |
| `--color-muted` | `#6e5468` | Muted text, meta lines, labels |
| `--color-faint` | `#8b7487` | Eyebrow labels, counts, step labels |
| `--color-line` | `#ecdfd6` | Card and list borders |
| `--color-line-soft` | `#f1e6df` | Row dividers inside lists |
| `--color-line-input` | `#e3d3c9` | Input, secondary-button and chip borders |
| `--color-sidebar-line` | `#eadcd3` | Sidebar border, active-nav ring |
| `--color-hover` | `#fbf6f3` | Row and list hover |
| `--color-hover-btn` | `#f5ece7` | Secondary button hover |
| `--color-soft` | `#f3e9e3` | Home pill, summary panels |
| `--color-segment` | `#f1e8e2` | Segmented-control track |
| `--color-skeleton` | `#efe3dc` / `#f4ebe5` | Skeleton blocks |
| `--color-accent` | `#e2674a` | Coral: brand dot, unread dot, small highlights (never body text) |
| `--color-accent-text` | `#c4472c` | Coral used as text (hover links, step numbers) |
| `--color-accent-soft` | `#f3e6ef` | Plum tint: avatars, step bubbles, focus ring, info notices |
| `--color-attention` | `#8a4f0c` | Amber text for "Nobody yet", "Not confirmed", urgent |
| `--color-attention-strong` | `#5a3206` / `#6b3c08` | Text on the amber weather card |
| `--color-attention-soft` | `#fbefdc` | Amber backgrounds (weather alert, urgent badge, nav badges) |
| `--color-high-soft` / `--color-high` | `#fbe1d8` / `#8f2f1b` | "High" priority badge |
| `--color-ok` / `--color-ok-soft` | `#2c6542` / `#e6f2ea` | OK, done, confirmed |
| `--color-concern` / `--color-concern-soft` | `#8a3b2e` / `#f7e9e4` | Concern, destructive actions, field errors |
| `--color-error-border` | `#c4472c` | Input border when invalid |
| Neutral badge | bg `#f1e9e4`, fg `#6e5468` | Neutral status |
| Category chip | bg `#f3ebe6`, fg `#6e5468` | Task category |
| Overlay | `rgba(42,21,41,0.42)` | Modal backdrop (drawer backdrop: 0.38) |

Rules: there is **no alarm red**. Urgency is shown in words first and amber second. Coral is decorative only. Body text is never coral.

### Typography
- **Display:** `Newsreader` (Google Fonts, opsz 6..72, weights 400/500, italic 400). Used for page titles, big numbers, prices, modal titles and the wordmark.
- **UI:** `Hanken Grotesk` (weights 400/500/600/700). Used for everything else.
- Load both with `next/font/google` and replace Geist in `app/layout.tsx`.

| Style | Font | Size / line-height | Weight | Letter-spacing |
|---|---|---|---|---|
| Page title (H1) | Newsreader | 36px / 1.08 | 400 | −0.025em |
| Overview headline | Newsreader | 36px / 1.08 | 400 | −0.025em |
| Modal title | Newsreader | 26px | 400 | 0 |
| Big number (KPI, stats) | Newsreader | 30–34px / 1.1 | 400 | 0 |
| Price | Newsreader | 26–28px | 400 | 0 |
| Wordmark | Newsreader | 22px | 500 | −0.02em, coral "." |
| Section title (card H2) | Hanken | 14–15px | 600 | 0 |
| Eyebrow | Hanken | 12px, uppercase | 700 | 0.07em, colour `#8b7487` |
| Body | Hanken | 15–16px / 1.5–1.6 | 400 | 0 |
| Row title | Hanken | 15px | 600 | 0 |
| Meta / secondary | Hanken | 13px | 400 | 0 |
| Small / caption | Hanken | 12px | 400–600 | 0 |
| Badge | Hanken | 11px | 700 | 0 |
| Nav item | Hanken | 14px | 500 (active 600) | 0 |
| Nav group label | Hanken | 11px uppercase | 700 | 0.08em |
| Buttons | Hanken | 14px (small 13px) | 600 | 0 |

Body: `-webkit-font-smoothing: antialiased`; apply `text-wrap: pretty` to paragraphs.

### Spacing, radius, shadow
- Spacing scale (px): 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 40, 48. Layout uses flex/grid with `gap`.
- Main content: `max-width: 1100px`, centred. Padding is `40px 48px 96px` at ≥720px wide and `22px 18px 88px` below that.
- Radii: badges and chips 999px · buttons and inputs 10px (small 7–9px) · rows inside lists 0 (the container is rounded) · cards and list containers 16px · option tiles 14px · modals 18px · nav items 9px · avatars 50% (persona tile 8–9px).
- Shadows: active nav `0 1px 2px rgba(59,31,58,.08), 0 0 0 1px #eadcd3` · segmented active `0 1px 3px rgba(59,31,58,.12)` · menus `0 18px 50px rgba(59,31,58,.18)` · modals `0 30px 80px rgba(42,21,41,.3)` · toast `0 16px 40px rgba(42,21,41,.3)`. Cards have no shadow, only borders.
- Focus: inputs get `border-color:#3b1f3a; box-shadow:0 0 0 3px #f3e6ef; outline:none`. Keep the global `:focus-visible` outline in `#3b1f3a`.

---

## Shared components

**Buttons** (height 42px; small 32–34px; large 46px)
- Primary: bg `#3b1f3a`, text white, no border, radius 10px, hover `#2a1529`.
- Secondary: bg `#fffdfb`, border `1px #e3d3c9`, text plum, hover bg `#f5ece7`.
- Quiet: transparent, text `#6e5468`, hover plum. Used for "I can't do it", "Cancel" and the "→" links.
- Destructive: bg `#8a3b2e`, text white. Destructive quiet: text `#8a3b2e`.
- Simulated action: bg `#fffaf2`, border `1px dashed #d9a35c`, text `#6b3c08`, label prefix "Simulate:".
- **Pending:** a 14px spinner (2px ring, `rgba(255,255,255,.35)` with a white top; on secondary buttons the ring is `#e3d3c9` with a plum top) at 0.7s linear infinite, placed before the label. The label may change ("Saving…", "Booking…", "Sending…"). Ignore repeat clicks while pending.

**Badge:** padding `2px 8px`, radius 999px, 11px/700. Tones: urgent = amber, high = coral-soft, ok, concern, neutral, accent.

**Card:** bg `#fffdfb`, border `1px #ecdfd6`, radius 16px, padding `18px 20px`, column with 12px gap.

**List container (preferred over nested cards):** card styling with padding 0 and `overflow:hidden`. Each row has `padding:14px 18px; border-bottom:1px solid #f1e6df; margin-bottom:-1px` (the negative margin hides the last divider) and hover bg `#fbf6f3`. The whole row is clickable; buttons inside a row stop propagation.

**Segmented control:** track bg `#f1e8e2`, padding 4px, radius 12px. Items are 32px tall with radius 9px; the active one has a white bg and shadow. Each item ends with its count in `#8b7487`.

**Chip / pill choice:** 32–40px tall, radius 999px. Unselected: white bg, border `#e3d3c9`, plum text. Selected: plum bg and border, white text.

**Radio tile:** border `1.5px #ecdfd6`, bg `#fffdfb`, radius 14px, with an 18px ring radio top-right. Selected: border plum, bg `#fbf5f2`, 8px plum dot.

**Checkbox:** 18–20px square, radius 5–6px, 2px plum border. Checked: plum fill with a white check.

**Tri-state result control (visit checklist):** track bg `#f5eee9`, padding 3px, radius 10px. The buttons are OK, Concern and Not checked, each 30px tall with radius 7px. Selected OK = `#e6f2ea`/`#2c6542` with a matching border; Concern = `#f7e9e4`/`#8a3b2e`; Not checked = neutral. Choosing Concern opens an inline input, "What did you see?".

**Avatar:** a circle with initials (11–14px/700) on `#f3e6ef`. Invited members use `#f1e9e4`. An unowned task shows a dashed `#c9b2a6` circle with "Nobody yet" in amber.

**Status dot:** 8px circle at the start of attention rows. Overdue `#c4472c` · urgent or unowned `#d98a1c` · high `#e2674a` · normal `#d8c6bb` · done `#2c6542`.

**Toast:** fixed at the bottom centre (bottom 28px). Bg `#2a1529`, white 14px text, radius 12px, padding `13px 18px`, with a coral check icon. It enters with a 0.25s slide-up and fade and auto-dismisses after 3s. Use `role="status"`.

**Modal:** backdrop overlay; card max-width 460–540px, radius 18px, padding 26px, gap 14px. The title is Newsreader 26px; actions sit at the bottom right (quiet Cancel, then primary). Clicking the backdrop or pressing Esc closes it. Use `role="dialog"` (`alertdialog` for confirmations) and `aria-modal`.

**Notices:** padding `14px 18px`, radius 12px, 14px text. Info = `#f3e6ef`, neutral = `#f1e9e4`, success = `#e6f2ea` with text `#1f4a30`, warning = `#fbefdc` with text `#6b3c08`.

**Empty state:** dashed `1px #e3d3c9` border, radius 16px, padding `48–56px 24px`, centred. Newsreader 24px title, a 14px muted line, and an optional primary button.

---

## App shell (`app/homes/[homeId]/layout.tsx` + root layout)

**Width ≥ 720px: left sidebar.** It replaces the horizontal `HomeNav` tabs. The sidebar is sticky and 100vh tall, 256px wide, bg `#f5ede8`, right border `#eadcd3`, padding `22px 14px 14px`, column with 22px gap and `overflow-y:auto`. From top to bottom:
1. Wordmark.
2. Home card: white card with a 7px status dot (`#2c6542` active, grey when closed), "Eila Lindqvist's home" (14px/600), and "Koivukuja 7, Turku · Active" (12px muted). In the repo, build these from `whoseHome(estateName)`, the address and `homeStatusText`.
3. Navigation in groups. Each item is 38px tall with an 18px stroke icon (1.7px), the label and an optional count badge. Active: white bg + ring shadow, 600 weight. Inactive: text `#5e4659`.
   - (no label) Overview · Care plan [needs-owner count, amber] · Visits · House notes [missing essentials, amber]
   - **Look after:** Weather [active alerts] · Local visit
   - **People:** Family · Messages [unread, coral-soft]
   - **Home:** Record · Settings
   - Partner persona: only "Visit requests" [new count]. Staff persona: only "Pilot dashboard".
4. Spacer.
5. Persona button (full width, 52px): plum initials tile, name, role and an up/down chevron. In the repo this shows "Viewing as {name} · {role}" and opens the demo "Switch person" menu.

**Width < 720px: sticky top bar** (bg `rgba(250,246,243,.94)` + `backdrop-filter: blur(12px)`, bottom border). It holds a hamburger (40px), the wordmark and the persona button. The hamburger opens a **drawer** from the left (280px, max 86vw) with the same home card and nav. A backdrop click or × closes it.

**Persona menu:** 290px wide (in the sidebar it matches the sidebar width, `left:0; right:0`). Under the eyebrow "View the demo as" it lists Aino Lindqvist (Coordinator · daughter), Mikko Lindqvist (Helper · son), Sanna Virta (Viewer · granddaughter), Turku Home Services (Local partner, fictional) and Nordvik staff (Pilot dashboard). The current person has a green check. Below a divider: "Preview the setup flow" and "Reset demo data" (concern colour). This maps to `/demo`.

**Setup flow (`/setup/[homeId]`)** hides the sidebar and shows a minimal header: wordmark plus an "Exit setup" secondary button.

**Closed plan banner:** a neutral notice above the content: "This plan was closed today (Sold). Everything stays readable, and you can still download the record." All write actions are hidden.

**Page header pattern** (every page): the title block on the left (optional back link, H1, one-line muted intro) and the single primary action right-aligned on the same row. The row wraps on narrow screens.

**Two-column pattern** (task, record a visit, book a visit, booking status): the main column is `flex: 999 1 440px` and the rail is `flex: 1 1 290px`, with `position: sticky; top: 24px` and a 28px gap. On narrow screens the rail wraps below the main column. Actions and summaries live in the rail.

---

## Screens
For data sources and permissions, see `docs/FRONTEND.md` §8 (P1–P26). Below: layout and what's shown, top to bottom.

### Overview: `/homes/[homeId]` (screens 01, 37, 47, 49)
Deliberately sparse: one question, what needs me now?
1. Success notice when `?welcome=1`: "Your care plan is ready. Start with the urgent tasks, then invite family to share them." plus an "Invite family" outline button.
2. Header: the greeting (14px muted), the H1 status headline ("3 things need an owner" / "Nothing urgent" / "Let's build the care plan") and one muted sub-line ("1 overdue · next visit due Thu 13 Nov"). On the right, a single primary "+ Record a visit" (helpers and coordinators only).
3. Two columns, 28px gap:
   - **Main:** "Needs attention": **at most 4** rows (dot · title · reason line · "I'll do it" when unowned), plus a "Care plan →" link. "My tasks" (at most 3 rows; hidden when the user has none).
   - **Rail:**
     - The weather alert card (amber; eyebrow, Newsreader 23px headline, one status line; no forecast tiles). Clicking it opens weather.
     - The supervision card (badge + one sentence; no progress bar).
     - A single clickable "House essentials · {n} items missing or not confirmed" row card → notes (only when something is missing).
   - Removed from v2: the stat strip, the family card, recent activity and the secondary "Book a local visit" button. These are reachable from the sidebar.

### Care plan: `/plan` (03, 04, 50)
The header is the H1 only (no intro) plus "+ Add a task". A segmented filter: All · Mine · Open · Needs an owner · Overdue · Done, each with its count. Groups (All/Open): Needs an owner · Overdue · This week · Later · Done, each under an eyebrow "NEEDS AN OWNER · 3" with a list container.

**Task row (decluttered):** a 20px circle check · the title + priority badge (Urgent/High only) · **one meta line**: "Nobody yet · due Mon 20 Oct, 18:00" / "Mikko · due Sun 19 Oct" / "Done Mon 13 Oct by Mikko" (amber 600 when unowned or overdue) · "I'll do it" only when unowned. Category, source, origin, "Not confirmed", booking and repeat lines appear **only on the task page**. There is no owner column.

Empty: "The care plan is empty" or "Nothing here".

### Task: `/tasks/[taskId]` (05–11, 38)
Back link "‹ Care plan". **Main column** (24px gap):
- H1 title and the status headline (amber when unowned or overdue). No badge row.
- The "Mark as done" panel when opened.
- The viewer notice.
- Eyebrow "WHY IT MATTERS", a 16px paragraph and "Not confirmed: …".
- **"HOW TO DO IT · 3 STEPS ▾" collapsed by default**: a disclosure button (`aria-expanded`) revealing the numbered list container.
- Eyebrow "ACTIVITY" with the comment composer.

**Sticky rail: one card only.**
- A key/value grid: Owner (a select for coordinators), Due, and "Priority · Category" on one line.
- Full-width stacked actions: primary "I'll do it" / secondary "Mark as done" / secondary "Book a local visit" / quiet "I can't do it".
- Below a divider, the details: where it came from, source, repeats, can't do it.

"I can't do it" opens a modal with a required reason.

### Visits: `/visits` (11, 49)
Header with "+ Record a visit". A supervision strip card (sentence + state badge). A list of visit rows: a 40px rounded initials tile (partner `#f3e6ef`) · the date and time (16px/600) · "{visitor} · Family visit / Local partner visit" · the summary "16 °C inside · 7 OK · 1 concern · 3 photos" (concern colour when > 0) · a chevron. Empty: "No visits recorded yet" + "The first visit matters most…" + a button.

### Visit report: `/visits/[visitId]` (12)
Back link · eyebrow line "{kind} · {visitor}" · H1 date. Three stat tiles: Inside (card), OK (ok-soft), Concerns (concern-soft). The checklist card (rows: label + result badge; concern note underneath in concern colour; order concerns first per spec). A photo grid (4:3 thumbnails, 10px radius). A notes card. "Closed by this visit" (✓ green) and "Follow-ups added to the plan" (→ coral) side by side.

### Record a visit: `/visits/new` (13–15)
Main column: When (`datetime-local`) and Indoor temperature (optional; error "Enter a number, like 17.5") in a 2-column grid · eyebrow "CHECKLIST" + "Mark the rest OK" small button + a list of checklist rows using the tri-state control · eyebrow "PHOTOS AND NOTES" (photo tiles + textarea). **Sticky rail "Summary":**
- "{n} of 8 checked" with a 5px progress bar (width transition 0.25s)
- "This visit will close": a live list with ✓ (always the monthly/first visit; the heating check when Heating = OK; the snow, storm, heat-pump and oil checks when their item is OK)
- "{n} concern(s) will become follow-up tasks."
- the validation message "Mark at least one check before saving."
- a full-width 46px primary "Save the visit"

On success it goes to the new visit report, with a toast such as "Visit recorded. 2 tasks closed, 0 follow-ups added."

### House notes: `/notes` (16–18, 50)
Header with "+ Add a note". The essentials list container: label + why (13px muted), a state badge (Missing = amber · Not checked on site = neutral · Confirmed / Confirmed with photo = ok) and an Add/Edit button. Then an eyebrow per category and a grid (min 300px) of note cards: optional 130px photo header, title, 2-line clamped body, "Not checked on site" (amber 12px/600), "Updated by {name}, {date}".

**Note modal:** category chips · Title (required: "Give the note a title.") · Details textarea · checkbox "I've checked this on site" · amber hint "Don't store alarm codes, key-box codes or passwords." · Save. Empty: "No notes yet. Start with the water main valve…".

### Weather: `/weather` (19)
Header with secondary "Refresh forecast" (spinner while pending; toast "Forecast updated. No new alerts."). Four day tiles (auto-fit min 200px, radius 16px, bg `#f7f0ec`; the alert day is amber): date, a Newsreader 40px low temperature, "High {x} · {summary}". An "Active alert" card containing a clickable amber row → the task. A "When Home Watch acts" card (threshold → action rows + the note "A forecast can't tell us the temperature inside…"). The 30-day alert table was removed (alerts live in the record).

### Book a local visit: `/help?taskId=` (20–23)
Header. An info notice when a booking is already active ("There's already a visit … See the visit"). The "For the task" chip with ×. Main sections, each under an eyebrow:
- **1 · Visit type:** three radio tiles: name, "45 min · From tomorrow" and the Newsreader price. **The includes list shows only on the selected tile.**
- **2 · Time:** a list container with one row per day (130px day label + time chips, selected = plum). Error: "Choose a time."
- **3 · Access:** a list container of radio rows, then "Key holder: …", then a notes textarea. Error: "Choose how the partner gets in."

**Sticky rail "Summary":** Visit, Time (amber "Choose a time" until picked), Access, Partner; a divider; "Total" with a Newsreader 28px price and the price split; the authority checkbox (approvers; error "Confirm you can authorise access."); for non-approvers "Your request goes to Aino Lindqvist for approval."; a full-width 46px primary "Approve and book" / "Send for approval"; the caption "Prototype price, not a quote. No payment is taken." Below it, a "Past and current visits" card. Viewers and closed homes see a neutral notice instead of the form.

### Booking status: `/help/[bookingId]` (24, 25)
Back link "Local visits". Main column: status badge · H1 package · status sentence (labels.ts `bookingText`) · a **5-step progress bar** (Requested → Sent to partner → Confirmed → At the house → Report ready; 4px bars, done = plum) · eyebrow "TIMELINE" (dot + who/what + time). Rail card: Approve (pending approvals) / "Read the report" (completed) / "Simulate: Partner confirms → Partner arrives → Partner sends the report" (demo, dashed amber) / quiet "Cancel visit" (opens a modal with a required reason), then the facts list (Visit, Time, Partner · fictional, Access, Notes, Total with split, Requested, Approved).

### Family: `/family` (26–28)
Header with "+ Invite someone" (coordinators). A grid (min 340px) of member cards: a 44px avatar, name "(you)", relation line, role badge, joined or invited line, stats. For coordinators managing other members, a divider and then role chips (Coordinator · Helper · Viewer), an "approve visits" toggle chip (green when on) and a quiet destructive "Remove". Below: a "Your details" form (Name, City, Phone, Email + "Save my details"). The Roles explainer was removed; role meanings appear as the subtitle of the role chips in the invite modal.

**Invite modal:** Name (required) · Phone or email (required: "We need a phone number or email to send the link.") · relation chips · role chips · checkbox "Can approve local visits" · "Send invitation" (toast "Invitation sent by SMS (simulated).").

### Record: `/record` (29)
Header with secondary "Download (JSON)" and primary "Print or save as PDF". An info notice ("About this record. It shows what was checked and when. It isn't a promise about what a claim would cover." — use `record.disclaimer`). A single timeline card titled "Key events" (visits, completed tasks, bookings, alerts) with a "Show everything" toggle that switches it to "Everything, newest first" (rows with a 96px date column). Stat tiles and the members card were removed.

### Settings: `/settings` (30–32)
"The home" facts card with "Edit answers →" (→ setup). "What's happening with the home?" with status chips (Still empty · Lived in again · Sold · Passed to an heir). Choosing anything other than Still empty reveals the destructive "Close the plan", which opens a confirmation modal ("Close the plan?" + the consequences list + "Keep it open" / "Yes, close the plan"). A "Demo data" card with "Reset demo data".

### Messages: `/notifications` (33, 51)
Header with "{n} unread" / "All caught up" and "Mark all as read". A list of message cards: unread = white bg, border `#d9b8c9`, 700 title, coral dot. Each card shows the title, time, body and a channel badge ("SMS · simulated" in amber, "In app" neutral). The whole card opens the link and marks it read.

### Partner: `/partner` (37)
H1 "Visit requests", plus "Turku Home Services · Turku region" and a "Fictional partner" amber badge. Three groups (New requests · Scheduled · Done) with rows: address (16px/600), "{package} · {slot}", "Requested by … · approved by …", the partner price (Newsreader 24px), a status badge, and the action: Accept → Start the visit → Send the report. Empty groups show a dashed box.

### Pilot dashboard: `/insights` (38)
H1, an "Updated …" line and the amber "Demo data" notice. Stat groups (Adoption, Responsibility, Prevention, Visits and revenue) as tiles (min 180px; Newsreader 34px value, 13px label, optional 12px hint). A funnel card: label column (190px) plus a plum bar with width ∝ count and opacity stepping down 0.1 per stage, then the count and conversion %. The footnote about measures never being summed. The per-home table was removed.

### Setup: `/setup/[homeId]?step=1..5` (39–44)
Narrow column, max 640px. The "{address}" line, H1 "Setting up Eila Lindqvist's home", "Step N of 5 · {name}", and five clickable 4px progress bars with labels. One card per step (padding 26px, radius 18px, 22px gap):
1. **The home:** occupancy chips (choosing "Yes, someone lives there" shows the info notice + "Close this invitation"), Empty since (date), Year built, building-type chips.
2. **Access:** authority chips, Who has keys, access notes (hint: no codes).
3. **Heating and water:** chips for heating, heating on, water source, valve closed (with the terms hint) and alarm; the "Not sure is fine…" hint.
4. **Family:** the member list + "Invite someone" + the simulated note.
5. **Review:** one block per section with "Edit", the amber "Will be checked on the first visit:" list, the terms caption, and "Create the care plan".

Back (secondary, left) and Continue (primary, right; pending spinner while saving). Creating the plan → overview with the welcome notice (45).

---

## Interactions and states

**Loading (02).** Every navigation shows a skeleton while data loads: a 140×14 bar, a 360×36 title bar, a 480×16 line, a row of three 200px blocks (auto-fit min 300px, radius 16px) and three 72px row blocks. Colours `#efe3dc` / `#f2e8e2` / `#f4ebe5`, with the `hwPulse` animation (opacity 1 → 0.45 → 1, 1.4s ease-in-out infinite) and `aria-busy="true"`. In Next.js, add a `loading.tsx` per route segment (`app/homes/[homeId]/loading.tsx`, `app/partner/loading.tsx`, `app/insights/loading.tsx`, `app/notifications/loading.tsx`, `app/setup/[homeId]/loading.tsx`) built from a shared `<PageSkeleton/>`.

**Error (46).** A centred block (max 520px): a 56px rounded concern-soft tile with a warning icon, a Newsreader 32px title ("We couldn't load the care plan" — page-specific), the body "The Home Watch service didn't respond. Nothing you entered was lost. Try again in a moment.", a primary "Try again" (spinner while retrying; calls `reset()`), and a 12px muted error code. Implement it in `app/error.tsx` and per-segment `error.tsx`. Nav badges are hidden while in the error state. Map backend errors per `docs/FRONTEND.md` P26.

**Empty (47–51).** Every list has a dashed empty state (copy above). The overview headline becomes "Let's build the care plan".

**Pending.** Every mutating button shows the spinner and blocks repeat clicks (`useFormStatus` inside `SubmitButton`).

**Success feedback.** A toast after every action. Copy used:
- "You're on it. The family can see you took it."
- "Done. It's in the home record." / "Done. The next one is scheduled in 30 days."
- "Thanks. The family can see you can't take it."
- "Note added to the house notes." / "Note saved."
- "Booked. Turku Home Services will confirm shortly." / "Sent to Aino for approval."
- "Visit cancelled. No charge."
- "Invitation sent by SMS (simulated)."
- "{Name} is now the owner."
- "Plan closed. The record stays available."
- "All messages marked as read."
- "Record downloaded."

Implement it as a small client `<Toaster/>` fed by the `ActionForm` `{ ok, message }` result.

**Validation.** Required fields show the error text under the field in `#8a3b2e` (13px), and the input border turns `#c4472c`. Errors appear on submit, not while typing. Rules:
- Decline reason: required.
- Comment: required.
- Note title: required.
- Invite: name and contact required.
- Booking: slot, access and (for approvers) the authority checkbox required.
- Visit: at least one check answered; temperature must be numeric if filled.
- Cancel booking: reason required.
- New task: title required.

Server field errors from `fieldErrors` render the same way.

**Role behaviour** (`docs/FRONTEND.md` §7.3).
- Viewer: no write buttons. They see "Viewers can read and comment. Ask Aino to change your role." and can still comment.
- Helper: no assign select, no invite, no role changes, no plan closing. Their booking button reads "Send for approval".
- Coordinator: everything.
- Closed home: all writes hidden.

**Keyboard and accessibility.** Esc closes modals, menus and the drawer. Clickable rows also need keyboard access (use `<Link>` or a `<button>` for the row). Radio tiles and chips need `role="radio"` / `aria-pressed`. Live summaries (visit form) use `aria-live="polite"`. Toasts use `role="status"`. Keep text contrast at 4.5:1 or above (all listed pairs pass).

**Motion.** Toast slide-up 0.25s ease-out · spinner 0.7s linear · skeleton pulse 1.4s · progress-bar width 0.25s. Nothing else animates.

**Responsive.** The sidebar is replaced by the top bar + drawer below 720px. All grids use `auto-fit/minmax(min(100%, X), 1fr)` so they collapse to one column. Two-column screens wrap the rail below the main column. Tables scroll horizontally.

**Live updates.** Keep `AutoRefresh` (10s) on the overview, plan, booking status, partner and notifications pages. Pause it while a form has unsaved input.

## State management (client)
The server stays the source of truth; existing actions + `revalidatePath` handle it. Client state needed:
- `navOpen` (drawer), `menuOpen` (persona menu)
- modal: decline | note | invite | newTask | closePlan | cancelBooking
- `completeOpen` (mark-as-done panel)
- visit-form results map + concern notes (for the live "will close" list; the closing logic mirrors `components/visit-form.tsx`)
- booking-form `pkg` / `slot` / `access` / `confirm` (mirrors `components/booking-form.tsx`)
- setup chips (server-saved per step, as today)
- toast queue

## Assets
- Fonts: Newsreader, Hanken Grotesk (Google Fonts).
- Icons: simple 24px stroke icons drawn inline (1.7px stroke, round caps). Lucide equivalents: home, list-checks, calendar, file-text, cloud, map-pin, users, bell, clipboard, settings, briefcase, bar-chart. `lucide-react` is fine.
- Photos: the prototype uses placeholder images from picsum.photos. In the repo, use the real `Photo.url` (signed) in plain `<img>` per `docs/FRONTEND.md` §5.4.
- Photo upload tiles: use the existing `PhotoPicker`, styled as dashed 10–12px rounded tiles.

## Route mapping
| Design screen | Repo file(s) |
|---|---|
| Shell, sidebar, drawer | `app/layout.tsx`, `app/homes/[homeId]/layout.tsx`, `components/site-header.tsx`, `components/home-nav.tsx` (→ sidebar) |
| Overview | `app/homes/[homeId]/page.tsx`, `components/supervision.tsx`, `components/weather.tsx`, `components/activity-list.tsx` |
| Care plan, Task | `app/homes/[homeId]/plan/page.tsx`, `app/homes/[homeId]/tasks/[taskId]/page.tsx`, `tasks/new`, `components/task-item.tsx` |
| Visits, Report, Record | `visits/page.tsx`, `visits/[visitId]/page.tsx`, `visits/new/page.tsx`, `components/visit-form.tsx`, `components/checklist-fields.tsx`, `components/visit-report.tsx` |
| House notes | `notes/page.tsx`, `notes/[noteId]`, `notes/new`, `components/note-form.tsx` |
| Weather | `weather/page.tsx`, `components/weather.tsx` |
| Local visit, Booking | `help/page.tsx`, `help/[bookingId]/page.tsx`, `components/booking-form.tsx` |
| Family | `family/page.tsx`, `components/invite-member-form.tsx` |
| Record | `record/page.tsx`, `record/print/page.tsx`, `components/record-summary.tsx` |
| Settings | `settings/page.tsx` |
| Messages | `app/notifications/page.tsx` |
| Partner | `app/partner/page.tsx`, `app/partner/jobs/[bookingId]/page.tsx` |
| Pilot dashboard | `app/insights/page.tsx` |
| Setup | `app/setup/[homeId]/page.tsx`, `components/radio-group.tsx` |
| Errors, loading | `app/error.tsx`, `app/not-found.tsx`, `app/forbidden/page.tsx`, new `loading.tsx` files |
| Shared primitives | `components/ui.tsx`, `components/styles.ts`, `components/forms.tsx` |

Suggested order: tokens + fonts → `styles.ts`/`ui.tsx` primitives (Button, Badge, Card, ListContainer, Row, Segmented, Chip, Notice, Empty, Skeleton, Toast, Modal) → shell/sidebar → overview → plan/task → visits → booking → remaining pages → loading/error files → run `npm run lint`, `npx tsc --noEmit`, `npm run build` and `npm run check:routes`.

## Screenshot index (`screens/`, captured with the sidebar layout)
01 overview · 02 loading skeleton · 03 care plan · 04 filter: needs an owner · 05 task · 06 how-to expanded · 07 "I'll do it" + toast · 08 task after accepting · 09 mark-as-done panel · 10 decline modal · 11 decline validation · 12 visits · 13 visit report · 14 record a visit · 15 record validation · 16 checklist filled + live summary · 17 house notes · 18 note modal · 19 note validation · 20 weather · 21 book a visit · 22 booking validation · 23 booking filled · 24 booked (toast) · 25 booking status · 26 partner confirmed (simulated) · 27 family · 28 invite modal · 29 invite validation · 30 record (key events) · 31 record (everything) · 32 settings · 33 status changed · 34 close-plan confirm · 35 messages · 36 persona menu · 37 helper view (Mikko) · 38 viewer view (Sanna, task) · 39 partner requests · 40 pilot dashboard · 41 setup step 1 · 42 step 1, someone lives there · 43 step 2 · 44 step 3 · 45 step 4 · 46 step 5 review · 47 overview after setup (welcome) · 48 error state · 49–53 empty states (overview, care plan, visits, house notes, messages).

Below 720px the sidebar becomes a top bar with a menu drawer (see App shell).
