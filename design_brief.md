# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for an educational institution or training provider. It manages courses (Kurse), instructors (Dozenten), rooms (Räume), participants (Teilnehmer), and registrations (Anmeldungen). The system tracks which participants are enrolled in which courses, which instructor teaches each course, in which room, and whether payment has been received.

### Who Uses This
An administrator or coordinator at a training center or Volkshochschule (adult education center). They manage course schedules, handle registrations, track payments, and need to see at a glance how their courses are doing — how many seats are filled, which courses are upcoming, and where revenue stands.

### The ONE Thing Users Care About Most
**Registration status across all courses** — How many people are enrolled in each course, are courses filling up or underbooked, and has everyone paid? This is the heartbeat of a course management operation.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** → Primary Action Button (register a participant to a course)
2. Neuen Kurs erstellen (create a new course)
3. Neuen Teilnehmer hinzufügen (add a new participant)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a warm, academic palette — a soft ivory background paired with a deep indigo primary accent that evokes the seriousness and trustworthiness of an educational institution. Subtle amber/gold highlights for financial metrics (revenue, payment status) create a natural association with money. The overall feel is "refined academic administration" — professional but not corporate, warm but not casual.

### Layout Strategy
The dashboard overview uses an **asymmetric layout** with a large hero section dominating the top — a prominent course fill rate visualization that immediately communicates the health of the entire operation. Below, secondary KPIs are arranged in a 4-column grid (desktop) with deliberate size variation: revenue gets a slightly taller card to emphasize financial health. The right column on desktop shows a "recent registrations" activity feed that gives a sense of momentum.

### Unique Element
The hero section features a **horizontal stacked bar** for each active course showing enrollment vs. capacity. Each bar is color-coded: green for courses with healthy enrollment (>50%), amber for courses needing attention (<50%), and red for nearly empty courses. This "course health overview" gives an instant visual pulse of the entire operation — no other dashboard element competes for attention.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans is geometric yet warm — it reads as professional and modern without being cold. The wide range of weights (300–800) allows for dramatic hierarchy. It fits the academic-yet-approachable character of a course management tool.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 30% 97%)` | `--background` |
| Main text | `hsl(230 25% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(230 25% 18%)` | `--card-foreground` |
| Borders | `hsl(230 15% 90%)` | `--border` |
| Primary action | `hsl(234 56% 46%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(234 56% 95%)` | `--accent` |
| Muted background | `hsl(230 15% 95%)` | `--muted` |
| Muted text | `hsl(230 10% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 42%)` | (component use) |
| Warning/amber | `hsl(38 92% 50%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The warm ivory background (`hsl(40 30% 97%)`) avoids the sterile feel of pure white while keeping everything bright and readable. Deep indigo primary (`hsl(234 56% 46%)`) is authoritative and academic — reminiscent of university branding — but not as cold as pure blue. The subtle warmth in the background and the depth of the indigo create a cohesive, distinguished atmosphere.

### Background Treatment
The page background is a warm off-white (`hsl(40 30% 97%)`) that provides gentle contrast against pure white cards. This creates natural depth without shadows, making cards feel like they're resting on a warm paper surface.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile uses a single-column vertical flow with the hero KPI taking the full width at the top. Visual interest is created through size variation — the hero enrollment bar chart is tall and prominent, while secondary KPIs use a compact 2x2 grid. The recent activity feed becomes a scrollable list below.

### What Users See (Top to Bottom)

**Header:**
Title "Kursverwaltung" in 600 weight, 20px. No subtitle. Clean and minimal.

**Hero Section (The FIRST thing users see):**
- **What:** Total active courses count as a large number (48px, 700 weight, primary color), with "Aktive Kurse" label above (12px, 500 weight, muted-foreground). Below, a compact horizontal bar for overall enrollment rate (enrolled / total capacity across all courses) as a progress bar with percentage label.
- **Size:** Takes about 30% of viewport height.
- **Why hero:** The administrator needs to immediately know the operational status — how many courses are running and how full they are overall.

**Section 2: Quick Stats (2x2 compact grid)**
Four small metric cards in a 2-column grid:
1. **Teilnehmer** — Total registered participants (count)
2. **Anmeldungen** — Total registrations this period (count)
3. **Umsatz** — Total revenue from course prices × registrations (currency EUR)
4. **Bezahlt** — Payment rate as percentage (paid registrations / total registrations)

Each card: white background, 14px label (muted-foreground), 24px value (700 weight, foreground), small icon top-right (muted-foreground).

**Section 3: Kursauslastung (Course Enrollment Chart)**
A vertical list of active courses, each showing:
- Course title (14px, 600 weight)
- Horizontal progress bar (enrollment / max capacity)
- "X / Y Plätze" text (12px, muted)
- Bar color: green (>60%), amber (30-60%), red (<30%)

**Section 4: Letzte Anmeldungen (Recent Registrations)**
A simple list of the 5 most recent registrations showing:
- Participant name (14px, 500 weight)
- Course title (12px, muted)
- Date (12px, muted, right-aligned)
- Payment badge: green "Bezahlt" or amber "Offen"

**Bottom Navigation:**
Fixed bottom tab bar with 6 items:
1. Übersicht (Home icon) — Dashboard overview
2. Kurse (BookOpen icon)
3. Dozenten (GraduationCap icon)
4. Teilnehmer (Users icon)
5. Anmeldungen (ClipboardList icon)
6. Räume (DoorOpen icon)

### Mobile-Specific Adaptations
- KPI grid becomes 2x2 instead of 4-column
- Course enrollment bars are full width
- Recent activity list items are stacked vertically
- Bottom padding of 80px on main content to clear bottom nav

### Touch Targets
- All buttons minimum 44px height
- Bottom nav items: full width divided equally, 56px height
- List items: full width, minimum 48px height with comfortable padding

### Interactive Elements
- Tapping a course in the enrollment list navigates to `/kurse`
- Tapping a registration in recent activity navigates to `/anmeldungen`

---

## 5. Desktop Layout

### Overall Structure
Two-area layout:
- **Left sidebar** (256px fixed width): Navigation with app links
- **Main content area** (fluid, max-width 1200px, centered)

Main content is divided as:
1. **Top row:** Hero KPI (left, ~60% width) + Quick Stats (right, ~40% width, 2x2 grid)
2. **Middle row:** Kursauslastung chart (left, ~60%) + Letzte Anmeldungen (right, ~40%)
3. Each app page fills the full main content area

Eye flow: Top-left hero (course count + enrollment) → right stats → down to course bars → right to recent activity.

### Section Layout
- **Top area:** Page title "Übersicht" (28px, 700 weight) with primary action button "Neue Anmeldung" on the right
- **Hero row:** Two columns — hero card (enrollment overview) left, 4 stat cards in 2x2 grid right
- **Content row:** Two columns — course enrollment bars (left), recent registrations feed (right)

### What Appears on Hover
- Cards: subtle shadow elevation (`0 2px 8px hsl(230 25% 18% / 0.06)`)
- Course enrollment bars: show tooltip with exact numbers
- Recent registrations: row highlight with muted background
- Sidebar nav items: background changes to accent color

### Clickable/Interactive Areas
- Course names in enrollment section → navigate to `/kurse`
- Recent registration rows → navigate to `/anmeldungen`
- Stat cards are not clickable (the numbers are self-explanatory)

---

## 6. Components

### Hero KPI
- **Title:** Aktive Kurse & Gesamtauslastung
- **Data source:** Kurse app (filter by courses where enddatum >= today or enddatum is null) + Anmeldungen app (count per course)
- **Calculation:** Count of active courses. For each course, count registrations from Anmeldungen where kurs matches. Overall enrollment rate = total registrations / sum of maximale_teilnehmer across active courses.
- **Display:** Large course count number (48px, 700 weight, primary color) with label above. Below, a thick progress bar (12px height, rounded) showing overall enrollment percentage, with "X% belegt" label.
- **Context shown:** Enrollment rate gives context — "12 Kurse, 73% belegt" tells a complete story.
- **Why this is the hero:** The course administrator's primary concern is utilization — are courses filling up? This single view answers that instantly.

### Secondary KPIs

**Teilnehmer**
- Source: Teilnehmer app
- Calculation: Total count of all participant records
- Format: number
- Display: Compact card, Users icon

**Anmeldungen**
- Source: Anmeldungen app
- Calculation: Total count of all registration records
- Format: number
- Display: Compact card, ClipboardList icon

**Umsatz (Geschätzt)**
- Source: Anmeldungen app + Kurse app
- Calculation: For each anmeldung, look up the linked kurs and its preis. Sum all prices for registrations. This gives estimated revenue.
- Format: currency EUR (e.g., "12.450 €")
- Display: Compact card, Euro icon

**Zahlungsquote**
- Source: Anmeldungen app
- Calculation: Count where bezahlt === true / total count × 100
- Format: percent (e.g., "84%")
- Display: Compact card, CheckCircle icon. Color: green if >80%, amber if 50-80%, red if <50%.

### Chart: Kursauslastung (Course Enrollment Bars)
- **Type:** Horizontal progress bars (custom, not recharts) — WHY: Progress bars are more intuitive than a bar chart for showing capacity utilization. Each course is its own row, making comparison easy.
- **Title:** Kursauslastung
- **What question it answers:** Which courses are filling up and which need more marketing?
- **Data source:** Kurse app + Anmeldungen app (count registrations per course)
- **Display per course:** Course title, horizontal bar (enrolled / max), "X / Y" label
- **Bar colors:** hsl(152 55% 42%) for >60%, hsl(38 92% 50%) for 30-60%, hsl(0 72% 51%) for <30%
- **Mobile simplification:** Full-width bars, smaller text, no hover tooltips (tap to see details)
- **Sort:** By enrollment percentage, descending (fullest first)
- **Limit:** Show all active courses (typically <20)

### Lists: Letzte Anmeldungen (Recent Registrations)
- **Purpose:** Shows momentum — are people signing up? Helps admin spot issues quickly.
- **Source:** Anmeldungen app + Teilnehmer app (for names) + Kurse app (for course titles)
- **Fields shown:** Participant name (vorname + nachname), course title, registration date, payment status badge
- **Mobile style:** Simple list with stacked layout
- **Desktop style:** Compact list rows with inline layout
- **Sort:** By anmeldedatum descending (newest first)
- **Limit:** 5 most recent

### Primary Action Button (REQUIRED!)
- **Label:** "Neue Anmeldung"
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:** Form with fields:
  - Teilnehmer (select from Teilnehmer app records — show vorname + nachname)
  - Kurs (select from Kurse app records — show titel)
  - Anmeldedatum (date input, default: today)
  - Bezahlt (checkbox, default: false)
- **Mobile position:** bottom_fixed (floating action button, primary color, "+" icon, positioned above bottom nav)
- **Desktop position:** header (top-right of page, next to title)
- **Why this action:** Registering participants to courses is the most frequent daily operation for a course administrator.

### CRUD Operations Per App (REQUIRED!)

**Kurse CRUD Operations**

- **Create:**
  - Trigger: "Neuer Kurs" button at top of Kurse page
  - Form fields: titel (text, required), beschreibung (textarea), startdatum (date), enddatum (date), maximale_teilnehmer (number), preis (number, EUR), dozent (select from Dozenten, show vorname + nachname), raum (select from Räume, show raumname + gebäude)
  - Form style: Dialog/Modal
  - Required fields: titel
  - Default values: startdatum = today

- **Read:**
  - List view: Table on desktop, card list on mobile. Columns: Kurstitel, Startdatum, Enddatum, Dozent (resolved name), Plätze (enrolled/max), Preis
  - Detail view: Click row → Dialog showing all fields including beschreibung
  - Sort: By startdatum descending (upcoming first)
  - Filter: None (simple list)

- **Update:**
  - Trigger: Pencil icon button in each row/card
  - Edit style: Same dialog as Create, pre-filled with current values
  - Editable fields: All fields

- **Delete:**
  - Trigger: Trash icon button in each row/card
  - Confirmation: AlertDialog — "Möchtest du den Kurs '{titel}' wirklich löschen?"

**Dozenten CRUD Operations**

- **Create:**
  - Trigger: "Neuer Dozent" button at top of Dozenten page
  - Form fields: vorname (text, required), nachname (text, required), email (email), telefon (tel), fachgebiet (text)
  - Form style: Dialog/Modal
  - Required fields: vorname, nachname

- **Read:**
  - List view: Table on desktop (Vorname, Nachname, E-Mail, Fachgebiet), card list on mobile
  - Detail view: Click row → Dialog showing all fields
  - Sort: By nachname ascending (alphabetical)

- **Update:**
  - Trigger: Pencil icon in row
  - Edit style: Same dialog as Create, pre-filled

- **Delete:**
  - Trigger: Trash icon in row
  - Confirmation: "Möchtest du den Dozenten '{vorname} {nachname}' wirklich löschen?"

**Teilnehmer CRUD Operations**

- **Create:**
  - Trigger: "Neuer Teilnehmer" button at top
  - Form fields: vorname (text, required), nachname (text, required), email (email), telefon (tel), geburtsdatum (date)
  - Form style: Dialog/Modal
  - Required fields: vorname, nachname

- **Read:**
  - List view: Table on desktop (Vorname, Nachname, E-Mail, Telefon), card list on mobile
  - Detail view: Click row → Dialog showing all fields including geburtsdatum
  - Sort: By nachname ascending

- **Update:**
  - Trigger: Pencil icon in row
  - Edit style: Same dialog as Create, pre-filled

- **Delete:**
  - Trigger: Trash icon in row
  - Confirmation: "Möchtest du den Teilnehmer '{vorname} {nachname}' wirklich löschen?"

**Anmeldungen CRUD Operations**

- **Create:**
  - Trigger: "Neue Anmeldung" button (also the primary action on Dashboard)
  - Form fields: teilnehmer (select from Teilnehmer, show name), kurs (select from Kurse, show titel), anmeldedatum (date, default today), bezahlt (checkbox, default false)
  - Form style: Dialog/Modal
  - Required fields: teilnehmer, kurs

- **Read:**
  - List view: Table on desktop (Teilnehmer name, Kurs titel, Anmeldedatum, Bezahlt badge), card list on mobile
  - Detail view: Click row → Dialog showing all resolved fields
  - Sort: By anmeldedatum descending (newest first)

- **Update:**
  - Trigger: Pencil icon in row
  - Edit style: Same dialog as Create, pre-filled. Most common edit: toggling bezahlt
  - Editable fields: All fields

- **Delete:**
  - Trigger: Trash icon in row
  - Confirmation: "Möchtest du diese Anmeldung wirklich löschen?"

**Räume CRUD Operations**

- **Create:**
  - Trigger: "Neuer Raum" button at top
  - Form fields: raumname (text, required), gebaeude (text), kapazitaet (number)
  - Form style: Dialog/Modal
  - Required fields: raumname

- **Read:**
  - List view: Table on desktop (Raumname, Gebäude, Kapazität), card list on mobile
  - Detail view: Click row → Dialog showing all fields
  - Sort: By raumname ascending

- **Update:**
  - Trigger: Pencil icon in row
  - Edit style: Same dialog as Create, pre-filled

- **Delete:**
  - Trigger: Trash icon in row
  - Confirmation: "Möchtest du den Raum '{raumname}' wirklich löschen?"

---

## 7. Navigation (React Router)

### Navigation Structure
- **Navigation style:** Sidebar (desktop, 256px fixed) + Bottom tabs (mobile, fixed bottom)
- **Dashboard/Home route:** Overview with KPIs, enrollment chart, recent registrations

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard Übersicht | Hero KPIs, enrollment chart, recent registrations, quick actions |
| `/kurse` | Kurse | Full CRUD for courses — table/cards with enrollment info |
| `/dozenten` | Dozenten | Full CRUD for instructors — table/cards |
| `/teilnehmer` | Teilnehmer | Full CRUD for participants — table/cards |
| `/anmeldungen` | Anmeldungen | Full CRUD for registrations — table/cards with resolved names |
| `/raeume` | Räume | Full CRUD for rooms — table/cards |

### Navigation Design

**Desktop:**
Fixed left sidebar (256px width) with white background and right border. At the top: app title "Kursverwaltung" in 18px, 700 weight, primary color, with a GraduationCap icon. Below: nav items as vertical list. Each item has an icon (20px) and label (14px, 500 weight). Active item: primary background with white text, rounded-lg. Inactive: muted-foreground text, hover shows accent background.

**Mobile:**
Fixed bottom tab bar (56px height) with white background and top border. 6 tabs evenly spaced. Each tab: icon (20px) + label (10px) stacked vertically. Active tab: primary color icon + text. Inactive: muted-foreground. No labels if space is tight — icons only with active label.

### Active Route Indicator
- **Desktop sidebar:** Active item has `bg-primary text-primary-foreground` with `rounded-lg` and `px-3 py-2.5`
- **Mobile tabs:** Active tab icon and text use `text-primary`, with a 2px thick line above the icon in primary color

### Dashboard Overview Page (/)
The landing page shows:
1. Hero: Active course count + overall enrollment rate
2. Quick stats: Teilnehmer count, Anmeldungen count, estimated revenue, payment rate
3. Course enrollment bars (sorted by fill rate)
4. Recent registrations list (last 5)
5. Primary action "Neue Anmeldung" button in header

---

## 8. Visual Details

### Border Radius
Rounded (8px) — `--radius: 0.5rem`. Soft and modern without being too playful.

### Shadows
Subtle — Cards have no shadow by default. On hover: `0 2px 8px hsl(230 25% 18% / 0.06)`. This keeps the design clean while providing interactive feedback. The warm background already creates natural card separation.

### Spacing
Spacious — 24px gap between cards, 32px padding on desktop container, 16px on mobile. Generous whitespace creates a calm, uncluttered feel. Section gaps of 32px on desktop, 24px on mobile.

### Animations
- **Page load:** Fade in (opacity 0→1, 300ms ease)
- **Page transitions:** Fade (200ms, opacity transition between routes)
- **Hover effects:** Cards scale(1.01) with shadow transition (150ms)
- **Tap feedback:** Active state with scale(0.98) for 100ms

---

## 9. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(40 30% 97%);
  --foreground: hsl(230 25% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(230 25% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(230 25% 18%);
  --primary: hsl(234 56% 46%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(230 15% 95%);
  --secondary-foreground: hsl(230 25% 18%);
  --muted: hsl(230 15% 95%);
  --muted-foreground: hsl(230 10% 50%);
  --accent: hsl(234 56% 95%);
  --accent-foreground: hsl(234 56% 46%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(230 15% 90%);
  --input: hsl(230 15% 90%);
  --ring: hsl(234 56% 46%);
  --chart-1: hsl(234 56% 46%);
  --chart-2: hsl(152 55% 42%);
  --chart-3: hsl(38 92% 50%);
  --chart-4: hsl(0 72% 51%);
  --chart-5: hsl(280 60% 50%);
  --sidebar: hsl(0 0% 100%);
  --sidebar-foreground: hsl(230 25% 18%);
  --sidebar-primary: hsl(234 56% 46%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(234 56% 95%);
  --sidebar-accent-foreground: hsl(234 56% 46%);
  --sidebar-border: hsl(230 15% 90%);
  --sidebar-ring: hsl(234 56% 46%);
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
- [ ] Toast notifications for success/error on all CRUD operations
- [ ] Loading skeletons for all data fetches
- [ ] Empty states with helpful messages
- [ ] Error states with retry options
