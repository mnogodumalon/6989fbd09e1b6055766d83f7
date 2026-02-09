# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung (Course Management) is a comprehensive system for managing educational courses, instructors, rooms, participants, and registrations. It handles the full lifecycle from course creation through participant enrollment and payment tracking.

### Who Uses This
A course administrator or educational coordinator who manages multiple courses, needs to see enrollment status at a glance, track payments, and manage the relationships between courses, instructors, rooms, and participants.

### The ONE Thing Users Care About Most
**How are my courses doing?** Specifically: How many registrations do I have, are they paid, and which courses need attention? The total registration count and payment status is the immediate pulse of the business.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** (New Registration) - Primary Action Button. This is the most frequent action - enrolling a participant in a course.
2. Add a new course
3. Add a new participant
4. Mark a registration as paid

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a refined academic aesthetic with a warm ivory background and a deep teal accent that evokes trust and professionalism. The typography uses Plus Jakarta Sans - a geometric sans-serif with slightly rounded terminals that feels approachable yet authoritative. The overall feel is "well-organized university administration" rather than corporate sterility.

### Layout Strategy
The dashboard overview uses an asymmetric layout with a prominent hero section spanning the full width showing the key registration/revenue metrics. Below, the layout splits into a 2/3 main area (registration trend chart + upcoming courses) and 1/3 supporting column (payment status + quick stats). This creates a natural reading flow from top-level KPIs down to actionable details.

On mobile, everything stacks vertically with the hero KPI dominating the first viewport. The chart simplifies to show fewer data points, and tables become card lists.

### Unique Element
The hero section uses a large registration count with a subtle circular progress indicator showing the payment completion rate (bezahlt vs. unbezahlt). The progress ring uses the teal accent color with a 6px stroke, creating a visual "health meter" for the course business that is immediately scannable.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans has geometric proportions with soft, rounded details that make data-heavy interfaces feel approachable. The wide weight range (300-800) enables strong visual hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 30% 97%)` | `--background` |
| Main text | `hsl(220 20% 14%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 20% 14%)` | `--card-foreground` |
| Borders | `hsl(40 15% 90%)` | `--border` |
| Primary action (teal) | `hsl(174 62% 32%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(174 40% 94%)` | `--accent` |
| Accent foreground | `hsl(174 62% 22%)` | `--accent-foreground` |
| Muted background | `hsl(40 20% 95%)` | `--muted` |
| Muted text | `hsl(220 10% 46%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |
| Secondary | `hsl(40 20% 95%)` | `--secondary` |
| Secondary foreground | `hsl(220 20% 14%)` | `--secondary-foreground` |

### Why These Colors
The warm ivory background (hsl 40 30% 97%) avoids the clinical feel of pure white, giving a subtle warmth reminiscent of paper. The deep teal primary (hsl 174 62% 32%) is a refined, non-generic accent that conveys trust and knowledge - fitting for an educational context. The muted foreground (hsl 220 10% 46%) provides comfortable reading contrast without the harshness of pure black.

### Background Treatment
Subtle warm ivory base (not pure white). Cards sit on pure white, creating gentle depth through contrast alone without needing heavy shadows.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Single column vertical flow. The hero KPI dominates the first viewport with large typography (48px bold for the number). Secondary KPIs use a compact 2-column grid. Below the fold: a simplified chart, then course list as swipeable cards. The bottom navigation provides access to all app pages.

### What Users See (Top to Bottom)

**Header:**
App title "Kursverwaltung" left-aligned in 700 weight, 20px. A "+" button for quick registration on the right.

**Hero Section (The FIRST thing users see):**
Full-width card with teal-tinted background (accent color at 10% opacity). Shows:
- "Anmeldungen gesamt" label in 13px muted text
- The total registration count in 48px, 800 weight
- Below: a horizontal bar split into teal (bezahlt/paid) and muted gray (unbezahlt/unpaid) segments, showing payment completion visually
- Below the bar: "X von Y bezahlt" in 14px muted text

Why hero: Registration count is the #1 indicator of business health.

**Section 2: Quick Stats (2-column grid)**
Four compact stat cards in a 2x2 grid:
- Aktive Kurse (active courses count)
- Dozenten (instructor count)
- Teilnehmer (participant count)
- Umsatz (total revenue from paid registrations)

Each card: title in 12px muted, value in 24px 700 weight. No icons needed - the numbers speak.

**Section 3: Anmeldungen Trend (Chart)**
Bar chart showing registrations per month (last 6 months). Simplified: no Y-axis labels on mobile, just bars with hover tooltips. Teal colored bars. Title "Anmeldungen pro Monat" in 16px 600 weight.

**Section 4: Kommende Kurse (Upcoming Courses)**
List of courses sorted by startdatum (soonest first), filtered to future dates. Each item shows:
- Kurstitel in 15px 600 weight
- Date range "DD.MM.YYYY - DD.MM.YYYY" in 13px muted
- Registration count / max participants as badge on right
- Dozent name below title in 13px muted

Max 5 items shown, with "Alle Kurse anzeigen" link to /kurse page.

**Bottom Navigation:**
Fixed bottom tab bar with 5 items. Padding bottom on main content: pb-20.

### Mobile-Specific Adaptations
- Chart shows only 4-6 months of data
- Tables become card lists with stacked fields
- Dialogs take full screen on small devices (sm:max-w-md on desktop)
- Touch targets minimum 44px height

### Touch Targets
All buttons and interactive elements minimum 44px touch target. Card items in lists have full-width tap area.

---

## 5. Desktop Layout

### Overall Structure
Fixed left sidebar (256px wide) for navigation. Main content area uses max-width 1200px with generous padding (32px).

**Top area:** Page title + primary action button in a flex row.

**Hero row:** Full-width card spanning entire content area with the registration KPI + payment progress bar. Same content as mobile but laid out horizontally: the large number on the left, the progress bar in the center, and the revenue figure on the right.

**Second row (2/3 + 1/3 split):**
- Left (2/3): Bar chart "Anmeldungen pro Monat" showing last 12 months
- Right (1/3): Stack of 4 stat cards (Aktive Kurse, Dozenten, Teilnehmer, Freie Plätze)

**Third row (full width):**
Upcoming courses table with columns: Kurstitel, Dozent, Raum, Startdatum, Enddatum, Anmeldungen/Max, Preis. With edit/view actions on hover.

### Section Layout
- Sidebar: 256px fixed left, always visible
- Content: margin-left 256px, max-width 1200px, padding 32px
- Hero: full content width, 120px height
- Chart + Stats: grid grid-cols-3, chart spans 2 cols, stats 1 col
- Courses table: full content width

### What Appears on Hover
- Table rows: subtle background highlight + edit/delete action buttons appear on far right
- Stat cards: slight shadow elevation
- Chart bars: tooltip with exact count and month name

### Clickable/Interactive Areas
- Course rows in table: click to navigate to /kurse page (or open detail)
- Stat cards: click navigates to corresponding app page (Kurse, Dozenten, Teilnehmer)
- "Alle anzeigen" links on each section navigate to full app page

---

## 6. Components

### Hero KPI
- **Title:** Anmeldungen gesamt
- **Data source:** Anmeldungen app - count all records
- **Calculation:** Total count of all Anmeldungen records
- **Display:** Large 48px/800-weight number on mobile, 56px on desktop. Teal-tinted card background.
- **Context shown:** Payment completion bar below (count of bezahlt=true vs total). Revenue sum on desktop.
- **Why this is the hero:** The registration count is the immediate pulse of the course business - it tells the admin if things are going well.

### Secondary KPIs

**Aktive Kurse**
- Source: Kurse app
- Calculation: Count of courses where enddatum >= today (or enddatum is null)
- Format: number
- Display: Compact card, 24px bold value

**Dozenten**
- Source: Dozenten app
- Calculation: Total count
- Format: number
- Display: Compact card, 24px bold value

**Teilnehmer**
- Source: Teilnehmer app
- Calculation: Total count
- Format: number
- Display: Compact card, 24px bold value

**Gesamtumsatz**
- Source: Anmeldungen (bezahlt=true) joined with Kurse (preis)
- Calculation: Sum of preis for all paid registrations (lookup kurs -> kurse.preis, sum where bezahlt=true)
- Format: currency EUR
- Display: Compact card, 24px bold value

### Chart
- **Type:** Bar chart - bar charts are best for comparing discrete time periods (months), making it easy to spot registration trends
- **Title:** Anmeldungen pro Monat
- **What question it answers:** Is registration volume growing, stable, or declining over time?
- **Data source:** Anmeldungen app, grouped by anmeldedatum month
- **X-axis:** Month (format: "MMM yyyy" e.g. "Jan 2025")
- **Y-axis:** Count of registrations
- **Colors:** Teal (primary) for bars
- **Mobile simplification:** Show only last 6 months, hide Y-axis labels, smaller bar width

### Lists/Tables

**Kommende Kurse (Upcoming Courses)**
- Purpose: Shows which courses are coming up and their enrollment status
- Source: Kurse app (filtered to future startdatum) + Anmeldungen (count per course) + Dozenten (name lookup) + Raeume (name lookup)
- Fields shown (mobile): Kurstitel, date range, enrollment count/max, dozent name
- Fields shown (desktop table): Kurstitel, Dozent (full name), Raum, Startdatum, Enddatum, Anmeldungen/Max, Preis
- Mobile style: card list
- Desktop style: table with hover actions
- Sort: By startdatum ascending (soonest first)
- Limit: 5 on dashboard overview, full list on /kurse page

### Primary Action Button (REQUIRED!)
- **Label:** Neue Anmeldung
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:** kurs (select from Kurse), teilnehmer (select from Teilnehmer), anmeldedatum (date, default today), bezahlt (checkbox, default false)
- **Mobile position:** header (top right "+" icon button)
- **Desktop position:** header (top right full button "Neue Anmeldung")
- **Why this action:** Registration is the most frequent daily task - every new participant needs to be enrolled.

### CRUD Operations Per App (REQUIRED!)

**Kurse CRUD Operations**
- **Create:** "Neuen Kurs erstellen" button on /kurse page header. Dialog with fields: titel (text, required), beschreibung (textarea), startdatum (date), enddatum (date), maximale_teilnehmer (number), preis (number), dozent (select from Dozenten app - show "Vorname Nachname"), raum (select from Raeume app - show "Raumname (Gebaeude)")
- **Read:** Table on /kurse page. Columns: Titel, Dozent, Raum, Start, Ende, Teilnehmer/Max, Preis. Mobile: card list with titel, dates, enrollment badge.
- **Update:** Pencil icon on each row -> same dialog as Create, pre-filled with current values
- **Delete:** Trash icon on each row -> Confirmation: "Kurs '{titel}' wirklich loschen?"

**Raeume CRUD Operations**
- **Create:** "Neuen Raum erstellen" button on /raeume page header. Dialog with fields: raumname (text, required), gebaeude (text), kapazitaet (number)
- **Read:** Table on /raeume page. Columns: Raumname, Gebaude, Kapazitat. Mobile: simple card list.
- **Update:** Pencil icon -> same dialog pre-filled
- **Delete:** Trash icon -> Confirmation: "Raum '{raumname}' wirklich loschen?"

**Dozenten CRUD Operations**
- **Create:** "Neuen Dozenten erstellen" button on /dozenten page. Dialog with fields: vorname (text, required), nachname (text, required), email (email), telefon (tel), fachgebiet (text)
- **Read:** Table on /dozenten page. Columns: Name (vorname + nachname), E-Mail, Telefon, Fachgebiet. Mobile: card list with name and fachgebiet.
- **Update:** Pencil icon -> same dialog pre-filled
- **Delete:** Trash icon -> Confirmation: "Dozent '{vorname} {nachname}' wirklich loschen?"

**Anmeldungen CRUD Operations**
- **Create:** "Neue Anmeldung" button (also primary action from dashboard). Dialog with: kurs (select from Kurse - show titel), teilnehmer (select from Teilnehmer - show "vorname nachname"), anmeldedatum (date, default today), bezahlt (checkbox, default false)
- **Read:** Table on /anmeldungen page. Columns: Teilnehmer (name), Kurs (titel), Anmeldedatum, Bezahlt (badge). Mobile: card list.
- **Update:** Pencil icon -> same dialog pre-filled. Especially useful for toggling bezahlt status.
- **Delete:** Trash icon -> Confirmation: "Anmeldung von '{teilnehmer name}' fur '{kurs titel}' wirklich loschen?"

**Teilnehmer CRUD Operations**
- **Create:** "Neuen Teilnehmer erstellen" button on /teilnehmer page. Dialog with: vorname (text, required), nachname (text, required), email (email), telefon (tel), geburtsdatum (date)
- **Read:** Table on /teilnehmer page. Columns: Name (vorname + nachname), E-Mail, Telefon, Geburtsdatum. Mobile: card list with name and email.
- **Update:** Pencil icon -> same dialog pre-filled
- **Delete:** Trash icon -> Confirmation: "Teilnehmer '{vorname} {nachname}' wirklich loschen?"

---

## 7. Navigation (React Router)

### Navigation Structure
- **Navigation style:** Sidebar (desktop) + Bottom tabs (mobile)
- **Dashboard/Home route:** Overview with KPIs, registration chart, upcoming courses summary

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard Overview | Summary KPIs, hero registration count, chart, upcoming courses |
| `/kurse` | Kurse | Full CRUD table for courses |
| `/anmeldungen` | Anmeldungen | Full CRUD table for registrations |
| `/teilnehmer` | Teilnehmer | Full CRUD table for participants |
| `/dozenten` | Dozenten | Full CRUD table for instructors |
| `/raeume` | Raeume | Full CRUD table for rooms |

### Navigation Design

**Desktop:**
Fixed sidebar on the left (256px width). Background: white (card color). Border-right. Top: app title "Kursverwaltung" in 18px 700 weight with a small graduation cap icon (GraduationCap from lucide). Below: nav items with icon + label. Each item 44px height, 12px horizontal padding. Active item: teal background (primary at 10% opacity) with teal text (primary color). Inactive: muted-foreground text, hover shows muted background.

**Mobile:**
Fixed bottom tab bar, 5 tabs. Icons only on tabs (labels below in 10px). Tabs: Home (LayoutDashboard), Kurse (BookOpen), Anmeldungen (ClipboardList), Teilnehmer (Users), Mehr (Menu) - "Mehr" opens a sheet/drawer with Dozenten and Raeume links.

Icons for navigation:
- Dashboard: LayoutDashboard
- Kurse: BookOpen
- Anmeldungen: ClipboardList
- Teilnehmer: Users
- Dozenten: GraduationCap
- Raeume: DoorOpen

### Active Route Indicator
Desktop sidebar: Active nav item has `bg-primary/10 text-primary font-semibold` styling with a 3px left border in primary color. Inactive items are `text-muted-foreground hover:bg-muted`.

Mobile bottom tabs: Active tab icon and label are primary color. Inactive are muted-foreground.

### Dashboard Overview Page (/)
Shows:
- Hero KPI (total registrations + payment progress)
- 4 secondary stat cards (active courses, instructors, participants, revenue)
- Registration trend bar chart
- Upcoming courses list (5 items) with link to /kurse
- Quick action: "Neue Anmeldung" button in header

---

## 8. Visual Details

### Border Radius
Rounded (8px) - the `--radius: 0.625rem` is already set. Cards use `rounded-xl` (12px) for a slightly softer feel. Buttons use `rounded-lg` (8px). Badges use `rounded-full`.

### Shadows
Subtle - Cards use `shadow-sm` (a very light shadow) to create gentle depth on the warm ivory background. Hover on interactive cards elevates to `shadow-md`. No heavy drop shadows anywhere.

### Spacing
Normal to spacious - 16px gap between cards, 24px between sections, 32px page padding on desktop, 16px on mobile. Content breathes.

### Animations
- **Page load:** Fade in with slight upward motion (200ms ease-out)
- **Page transitions:** Simple fade (150ms)
- **Hover effects:** Cards: shadow elevation transition 200ms. Table rows: background color transition 150ms.
- **Tap feedback:** Active state scales to 0.98 on buttons (transform transition 100ms)

---

## 9. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.625rem;
  --background: hsl(40 30% 97%);
  --foreground: hsl(220 20% 14%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 20% 14%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 20% 14%);
  --primary: hsl(174 62% 32%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(40 20% 95%);
  --secondary-foreground: hsl(220 20% 14%);
  --muted: hsl(40 20% 95%);
  --muted-foreground: hsl(220 10% 46%);
  --accent: hsl(174 40% 94%);
  --accent-foreground: hsl(174 62% 22%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(40 15% 90%);
  --input: hsl(40 15% 90%);
  --ring: hsl(174 62% 32%);
  --chart-1: hsl(174 62% 32%);
  --chart-2: hsl(152 55% 40%);
  --chart-3: hsl(40 80% 56%);
  --chart-4: hsl(220 60% 55%);
  --chart-5: hsl(280 55% 55%);
  --sidebar: hsl(0 0% 100%);
  --sidebar-foreground: hsl(220 20% 14%);
  --sidebar-primary: hsl(174 62% 32%);
  --sidebar-primary-foreground: hsl(0 0% 100%);
  --sidebar-accent: hsl(174 40% 94%);
  --sidebar-accent-foreground: hsl(174 62% 22%);
  --sidebar-border: hsl(40 15% 90%);
  --sidebar-ring: hsl(174 62% 32%);
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
- [ ] Colors create warm, academic mood described in Section 2
- [ ] React Router navigation implemented with all routes from Section 7
- [ ] Each app has its own page/route with full CRUD
- [ ] Navigation works on both mobile (bottom tabs) and desktop (sidebar)
- [ ] CRUD patterns are consistent across all apps
- [ ] Delete confirmations are in place
- [ ] Toast notifications for all CRUD operations
- [ ] Loading skeletons for data fetching
- [ ] Empty states with guidance
- [ ] Error states with retry
