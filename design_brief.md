# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for educational institutions or training providers. It manages courses (Kurse), instructors (Dozenten), rooms (Räume), participants (Teilnehmer), and enrollments/registrations (Anmeldungen). The system tracks which participants are enrolled in which courses, which instructor teaches which course, in which room, and whether payment has been received.

### Who Uses This
An administrative coordinator or office manager at a training center, school, or Volkshochschule. They are not technical — they manage courses, assign rooms and instructors, register participants, and track payments. They need quick access to "what's happening" across all courses.

### The ONE Thing Users Care About Most
**How many registrations are there across active courses, and how is payment status?** The user opens the dashboard to see at a glance: total enrollments, how many paid vs. unpaid, and which courses are filling up. This is their daily pulse check.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** → Primary Action Button — Register a participant for a course (this is the #1 daily task)
2. Neuen Kurs erstellen — Add a new course
3. Neuen Teilnehmer hinzufügen — Add a new participant

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a refined indigo-slate color palette with warm paper-white backgrounds. The accent color is a rich indigo (`hsl(243 55% 54%)`) — academic, trustworthy, and distinctive without being corporate blue. Cards float with subtle shadows on a warm off-white canvas, creating depth. The overall feel is "a well-organized academic planner" — structured but inviting.

### Layout Strategy
- The hero element is an asymmetric banner showing total Anmeldungen count with a payment status breakdown (paid vs. unpaid as a visual bar). It spans the full width and is visually dominant through size and an indigo gradient accent line.
- The layout is **asymmetric on desktop**: a wide left column (2/3) holds the hero + course overview chart, while a narrow right column (1/3) shows recent activity and quick stats.
- Visual interest comes from: varying card sizes (hero is 2x height of secondary KPIs), a subtle gradient accent on the hero, and typography weight contrast between the large hero number and small labels.
- Secondary KPI cards are compact and inline below the hero, creating a rhythm break.

### Unique Element
The hero KPI features a horizontal segmented bar showing paid vs. unpaid ratio — filled in indigo for paid and a muted warm tone for unpaid. This makes the payment status instantly visual without needing a pie chart. The bar has rounded caps and is 12px tall, sitting right below the big enrollment number.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Professional, modern, and warm — it has geometric precision with subtle rounded terminals that feel approachable for non-technical users. It creates clear hierarchy through its wide weight range (300-800).

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 25% 97%)` | `--background` |
| Main text | `hsl(230 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(230 25% 15%)` | `--card-foreground` |
| Borders | `hsl(230 15% 90%)` | `--border` |
| Primary action | `hsl(243 55% 54%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(243 40% 95%)` | `--accent` |
| Muted background | `hsl(230 20% 95%)` | `--muted` |
| Muted text | `hsl(230 10% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 42%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The warm off-white background (`hsl(40 25% 97%)`) avoids clinical coolness. The indigo primary (`hsl(243 55% 54%)`) is academic and distinguished — it signals authority without coldness. The muted slate tones for text create comfortable reading. Green for "bezahlt" (paid) and the destructive red for unpaid/delete creates intuitive status coding.

### Background Treatment
Warm off-white (`hsl(40 25% 97%)`) — not pure white, not gray. This gives the page a subtle warmth like quality paper. Cards are pure white to create gentle lift.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero dominates the first viewport fold. Below it, secondary KPIs stack vertically as compact rows (not cards). The chart becomes a simplified horizontal bar chart. Lists are touch-friendly card stacks.

### What Users See (Top to Bottom)

**Header:**
App title "Kursverwaltung" in 20px font-weight-700, left-aligned. No subtitle needed.

**Hero Section (The FIRST thing users see):**
- Full-width card with 24px padding
- Large number showing total Anmeldungen count in 48px font-weight-800
- Label "Anmeldungen gesamt" in 13px font-weight-400 muted text above the number
- Below the number: a 12px-tall horizontal segmented bar showing bezahlt (indigo) vs. unbezahlt (muted) ratio
- Below the bar: inline text "X bezahlt · Y offen" in 13px
- Takes approximately 30% of viewport height
- Why: The coordinator needs to know enrollment status at a glance — this answers "how are we doing?"

**Section 2: Quick Stats Row**
- Horizontal scrollable row of 3 compact stat pills (not full cards):
  - Aktive Kurse (count)
  - Dozenten (count)
  - Freie Plätze (calculated: sum of maximale_teilnehmer - current registrations)
- Each pill: muted background, 14px bold number, 11px label below
- This provides context without taking much vertical space

**Section 3: Kurse Übersicht**
- List of courses as cards, each showing:
  - Kurstitel (16px font-weight-600)
  - Dozent name + Raum name (13px muted)
  - Startdatum - Enddatum (13px muted)
  - Badge showing "X/Y Plätze" (enrollment count / max)
  - Badge color: green if <80% full, yellow if 80-99%, red if 100%
- Sorted by startdatum (soonest first)
- Show max 5, with "Alle anzeigen" link navigating to /kurse

**Section 4: Letzte Anmeldungen**
- Last 5 registrations as simple list items
- Each: Teilnehmer name + Kursname + date
- Badge for bezahlt status (green "Bezahlt" / yellow "Offen")

**Bottom Navigation:**
Fixed bottom tab bar with 5 tabs (icons + labels):
1. Home (LayoutDashboard icon) → /
2. Kurse (GraduationCap icon) → /kurse
3. Dozenten (Users icon) → /dozenten
4. Teilnehmer (UserCheck icon) → /teilnehmer
5. Räume (DoorOpen icon) → /raeume

Note: Anmeldungen is accessed from within Kurse context or via the primary action button, not as a separate tab (to keep mobile tabs at 5 max).

### Mobile-Specific Adaptations
- Hero is full-width, no side margins on the card
- Stats are horizontal scrollable pills instead of grid
- Course list cards stack vertically with 12px gap
- Chart is omitted on mobile to save space — the segmented bar in the hero provides the visual summary
- Bottom padding of 80px to avoid content hidden behind bottom nav

### Touch Targets
- All list items minimum 48px height
- Bottom tab icons 24px with 44px hit area
- Primary action button (FAB) is 56px circular, positioned bottom-right above the nav bar

### Interactive Elements
- Course cards tap to navigate to /kurse (filtered to that course)
- Anmeldung items tap to show detail in a bottom sheet

---

## 5. Desktop Layout

### Overall Structure
Two-column layout: 65% left / 35% right, with a max-width of 1400px centered.

**Eye flow:** Hero (top-left, spanning left column) → Quick stats (below hero, left) → Course chart (left) → Recent activity (right column, top) → Quick actions (right column).

### Section Layout

**Top area (full width):**
- Page title "Kursverwaltung" (28px, font-weight-800) with primary action button "Neue Anmeldung" on the right

**Left column (65%):**
1. **Hero Card** — Total Anmeldungen with payment bar (same as mobile but wider, number at 56px)
2. **Quick Stats Row** — 3 stat cards side by side (Aktive Kurse, Dozenten, Freie Plätze)
3. **Anmeldungen Trend Chart** — Bar chart showing registrations per course (horizontal bars, sorted by count descending). X-axis: count, Y-axis: course name. This answers "which courses are most popular?"

**Right column (35%):**
1. **Letzte Anmeldungen** — Last 8 registrations with participant name, course, date, payment badge
2. **Kurse mit freien Plätzen** — Courses that still have availability, with progress bar showing fill rate

### What Appears on Hover
- Course cards: subtle shadow increase + slight translateY(-1px)
- Table rows: muted background highlight
- Stat cards: slight shadow increase

### Clickable/Interactive Areas
- Course names → navigate to /kurse
- Participant names in recent list → navigate to /teilnehmer
- "Alle anzeigen" links on each section → navigate to respective page

---

## 6. Components

### Hero KPI
- **Title:** Anmeldungen gesamt
- **Data source:** Anmeldungen app (count all records)
- **Calculation:** Count of all Anmeldungen records
- **Display:** Large number (48px mobile, 56px desktop, font-weight-800) with segmented horizontal bar below showing bezahlt ratio
- **Context shown:** Bezahlt vs. Offen count, displayed as colored segments in horizontal bar + inline text
- **Why this is the hero:** The coordinator's #1 question every day is "how many enrollments do we have and are they paid?"

### Secondary KPIs

**Aktive Kurse**
- Source: Kurse app
- Calculation: Count of all Kurse records (or filter by date if startdatum <= today <= enddatum)
- Format: number
- Display: Compact stat card, 24px bold number, 12px muted label

**Dozenten**
- Source: Dozenten app
- Calculation: Count of all Dozenten records
- Format: number
- Display: Compact stat card

**Freie Plätze**
- Source: Kurse (maximale_teilnehmer) cross-referenced with Anmeldungen (count per kurs)
- Calculation: Sum of (maximale_teilnehmer - anmeldungen_count) for each Kurs
- Format: number
- Display: Compact stat card

### Chart
- **Type:** Horizontal bar chart — WHY: comparing course popularity is best done with named bars, and horizontal allows longer course names
- **Title:** Anmeldungen pro Kurs
- **What question it answers:** Which courses are most popular / filling up fastest?
- **Data source:** Anmeldungen grouped by kurs (applookup), joined with Kurse for names
- **X-axis:** Count of Anmeldungen
- **Y-axis:** Kurstitel (course name)
- **Colors:** Bars in primary color (indigo), with max capacity shown as a light background bar
- **Mobile simplification:** Hidden on mobile — the hero segmented bar provides the at-a-glance summary instead

### Lists/Tables

**Letzte Anmeldungen**
- Purpose: See most recent activity — who registered for what
- Source: Anmeldungen joined with Teilnehmer (name) and Kurse (title)
- Fields shown: Teilnehmer name, Kurstitel, Anmeldedatum, Bezahlt status (badge)
- Mobile style: Simple list with dividers
- Desktop style: Clean list in a card
- Sort: By anmeldedatum descending (newest first)
- Limit: 5 on mobile, 8 on desktop

**Kurse mit freien Plätzen (Desktop only sidebar)**
- Purpose: Quick view of which courses still have capacity
- Source: Kurse joined with Anmeldungen count
- Fields shown: Kurstitel, fill progress bar (enrolled/max), available spots count
- Desktop style: Compact list in card
- Sort: By available spots ascending (almost full first)
- Limit: 5

### Primary Action Button (REQUIRED!)
- **Label:** "Neue Anmeldung"
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:** Teilnehmer (select from existing), Kurs (select from existing), Anmeldedatum (date, default today), Bezahlt (checkbox, default false)
- **Mobile position:** fab (floating action button, bottom-right, 56px, above bottom nav)
- **Desktop position:** header (top-right, inline with page title)
- **Why this action:** Registering participants for courses is the #1 daily task for the coordinator

### CRUD Operations Per App (REQUIRED!)

**Kurse CRUD Operations**
- **Create:** "+" button on /kurse page header opens Dialog. Fields: Kurstitel (text, required), Beschreibung (textarea), Startdatum (date), Enddatum (date), Maximale Teilnehmerzahl (number), Preis EUR (number), Dozent (select from Dozenten app), Raum (select from Räume app). Default: Startdatum = today.
- **Read:** Card list sorted by Startdatum (soonest first). Each card: Kurstitel, Beschreibung truncated, date range, Dozent name, Raum name, enrollment badge. Click card → Detail Dialog showing all fields + list of enrolled participants.
- **Update:** Pencil icon in detail view → same Dialog as Create, pre-filled with current values.
- **Delete:** Trash icon in detail view → Confirmation: "Möchtest du den Kurs '{titel}' wirklich löschen?"

**Räume CRUD Operations**
- **Create:** "+" button on /raeume page header opens Dialog. Fields: Raumname (text, required), Gebäude (text), Kapazität (number).
- **Read:** Table with columns: Raumname, Gebäude, Kapazität. Click row → Detail Dialog.
- **Update:** Pencil icon in detail view or row → same Dialog as Create, pre-filled.
- **Delete:** Trash icon → Confirmation: "Möchtest du den Raum '{raumname}' wirklich löschen?"

**Dozenten CRUD Operations**
- **Create:** "+" button on /dozenten page header opens Dialog. Fields: Vorname (text, required), Nachname (text, required), E-Mail (email), Telefon (tel), Fachgebiet (text).
- **Read:** Card grid (2 cols desktop, 1 col mobile). Each card: Full name, Fachgebiet badge, Email, Telefon. Click → Detail Dialog with all fields + list of their courses.
- **Update:** Pencil icon in detail/card → same Dialog as Create, pre-filled.
- **Delete:** Trash icon → Confirmation: "Möchtest du den Dozenten '{vorname} {nachname}' wirklich löschen?"

**Teilnehmer CRUD Operations**
- **Create:** "+" button on /teilnehmer page header opens Dialog. Fields: Vorname (text, required), Nachname (text, required), E-Mail (email), Telefon (tel), Geburtsdatum (date).
- **Read:** Table with columns: Name (Vorname + Nachname), E-Mail, Telefon, Geburtsdatum. Searchable by name. Click row → Detail Dialog with all fields + list of their enrollments.
- **Update:** Pencil icon → same Dialog as Create, pre-filled.
- **Delete:** Trash icon → Confirmation: "Möchtest du den Teilnehmer '{vorname} {nachname}' wirklich löschen?"

**Anmeldungen CRUD Operations**
- **Create:** Primary action "Neue Anmeldung" (FAB on mobile, header button on desktop). Dialog fields: Teilnehmer (select from Teilnehmer app, required), Kurs (select from Kurse app, required), Anmeldedatum (date, default today), Bezahlt (checkbox, default false).
- **Read:** Accessed via /kurse detail or dashboard. Table/list: Teilnehmer name, Kurs name, Anmeldedatum, Bezahlt badge. Sortable by date.
- **Update:** Pencil icon → same Dialog, pre-filled. Main use case: toggling bezahlt status.
- **Delete:** Trash icon → Confirmation: "Möchtest du die Anmeldung von '{teilnehmer_name}' für '{kurs_name}' wirklich löschen?"

---

## 7. Navigation (React Router)

### Navigation Structure
- **Navigation style:** Sidebar (desktop) + Bottom tabs (mobile)
- **Dashboard/Home route:** Overview KPIs, hero enrollment stats, recent activity, quick actions

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard Overview | Hero KPI, quick stats, trend chart, recent anmeldungen |
| `/kurse` | Kurse | Full CRUD list of all courses with enrollment counts |
| `/dozenten` | Dozenten | Full CRUD card grid of all instructors |
| `/teilnehmer` | Teilnehmer | Full CRUD searchable table of all participants |
| `/raeume` | Räume | Full CRUD table of all rooms |

Anmeldungen are managed inline: from the dashboard FAB, from within Kurse detail views, and from a dedicated section on the dashboard. No separate /anmeldungen route needed — they are always in context of a Kurs or Teilnehmer.

### Navigation Design

**Desktop:**
- Fixed left sidebar, 260px wide, white background with border-right
- App logo/title "Kursverwaltung" at top with a small GraduationCap icon
- Nav items stacked vertically with icon + label
- Active item: indigo background (`--primary`) with white text
- Inactive items: muted-foreground text, hover shows muted background
- Sidebar is always visible (not collapsible)

**Mobile:**
- Fixed bottom tab bar, white background with border-top
- 5 tabs with icon (20px) + label (11px) stacked vertically
- Tabs: Übersicht, Kurse, Dozenten, Teilnehmer, Räume
- Icons: LayoutDashboard, GraduationCap, Users, UserCheck, DoorOpen

### Active Route Indicator
- Desktop: Active nav item has `bg-primary text-primary-foreground` with rounded-lg
- Mobile: Active tab icon and label in primary color, inactive in muted-foreground

### Dashboard Overview Page (/)
- Hero KPI (Anmeldungen + payment bar)
- 3 quick stat cards (Aktive Kurse, Dozenten, Freie Plätze)
- Anmeldungen pro Kurs chart (desktop only)
- Letzte Anmeldungen list
- Kurse mit freien Plätzen (desktop sidebar column)

---

## 8. Visual Details

### Border Radius
Rounded (8px) — `--radius: 0.5rem`. Cards and buttons feel modern but not overly playful.

### Shadows
Subtle — Cards: `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). On hover: `shadow-md` transition. The hero card has `shadow-md` by default to elevate it.

### Spacing
Normal to spacious — 24px gap between major sections, 16px gap between cards in a grid, 12px internal padding on compact elements, 24px on larger cards.

### Animations
- **Page load:** Stagger fade-in for cards (opacity 0→1, translateY 8px→0, 200ms, stagger 50ms)
- **Page transitions:** Fade (150ms opacity transition between routes)
- **Hover effects:** Cards lift with shadow-md + translateY(-1px), 150ms ease
- **Tap feedback:** Scale 0.98 on press, 100ms

---

## 9. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(40 25% 97%);
  --foreground: hsl(230 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(230 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(230 25% 15%);
  --primary: hsl(243 55% 54%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(230 20% 95%);
  --secondary-foreground: hsl(230 25% 15%);
  --muted: hsl(230 20% 95%);
  --muted-foreground: hsl(230 10% 50%);
  --accent: hsl(243 40% 95%);
  --accent-foreground: hsl(230 25% 15%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(230 15% 90%);
  --input: hsl(230 15% 90%);
  --ring: hsl(243 55% 54%);
  --chart-1: hsl(243 55% 54%);
  --chart-2: hsl(152 55% 42%);
  --chart-3: hsl(40 90% 50%);
  --chart-4: hsl(200 70% 50%);
  --chart-5: hsl(330 65% 55%);
  --sidebar: hsl(0 0% 100%);
  --sidebar-foreground: hsl(230 25% 15%);
  --sidebar-primary: hsl(243 55% 54%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(243 40% 95%);
  --sidebar-accent-foreground: hsl(230 25% 15%);
  --sidebar-border: hsl(230 15% 90%);
  --sidebar-ring: hsl(243 55% 54%);
}
```

---

## 10. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans, weights 300-800)
- [ ] All CSS variables copied exactly from Section 9
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the warm academic mood described in Section 2
- [ ] React Router navigation implemented with all routes from Section 7
- [ ] Each app has its own page/route with full CRUD
- [ ] Navigation works on both mobile (bottom tabs) and desktop (sidebar)
- [ ] CRUD patterns are consistent across all apps
- [ ] Delete confirmations are in place
- [ ] Toast feedback on all CRUD operations
- [ ] Segmented payment bar in hero works correctly
- [ ] Anmeldungen chart shows bars per course (desktop)
