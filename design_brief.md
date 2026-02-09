# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for an educational institution or training provider. It manages courses (Kurse), rooms (Raeume), instructors (Dozenten), registrations (Anmeldungen), and participants (Teilnehmer). The system tracks which courses are offered, who teaches them, where they take place, who has signed up, and whether they've paid.

### Who Uses This
An administrative coordinator or office manager at an educational institution. They juggle multiple courses, need to keep track of registrations, ensure rooms are booked, and follow up on payments. They think in terms of "which courses are running soon?" and "who hasn't paid yet?"

### The ONE Thing Users Care About Most
**Upcoming courses and their registration status** - "How full are my courses, and are participants paying?" This is the daily pulse of the operation. They open the dashboard to see at a glance which courses are coming up, how many spots are taken, and where there are payment issues.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** (New Registration) - Primary Action Button. This is the #1 daily task: registering new participants for courses.
2. Neuen Kurs anlegen (Create new Course)
3. Neuen Teilnehmer anlegen (Add new Participant)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The dashboard uses a refined, academic aesthetic with a cool slate-blue base that evokes professionalism and structured learning. A carefully chosen teal accent (#0d9488-ish in hsl) provides energetic highlights for action elements and key metrics, while the warm off-white background avoids the sterility of pure white. The result feels like a well-organized university admin tool - calm, authoritative, and purposeful.

### Layout Strategy
- The hero element is an asymmetric top section: a large "Aktuelle Kurse" (Current Courses) summary card that spans ~60% width on desktop, paired with a compact KPI column on the right (~40%).
- The layout is asymmetric on desktop to create visual flow: the eye moves from the large course overview (left) to the quick stats (right), then down to the registrations table and management sections.
- Visual interest is created through size variation (the hero course card is significantly larger than the KPI tiles), typography hierarchy (large 36px course count vs 14px labels), and a distinctive "Auslastung" (utilization) progress bar that uses the teal accent color.
- Secondary elements (room list, instructor list) are tucked into tabs to avoid overwhelming the main view.

### Unique Element
The course cards in the hero section feature a subtle left-border accent (4px solid teal) that indicates course status - active courses get the teal accent, past courses get a muted gray border. This creates a quick visual scan pattern where the eye can immediately distinguish between upcoming and completed courses.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans has a professional, geometric quality with slightly rounded terminals that softens the administrative nature of the app. It works beautifully at both large display sizes (KPI numbers) and small caption sizes (table cells). It's distinctive without being distracting.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(210 20% 98%)` | `--background` |
| Main text | `hsl(215 25% 15%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(215 25% 15%)` | `--card-foreground` |
| Borders | `hsl(214 20% 90%)` | `--border` |
| Primary action | `hsl(172 66% 30%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(172 50% 95%)` | `--accent` |
| Muted background | `hsl(210 15% 96%)` | `--muted` |
| Muted text | `hsl(215 15% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The cool slate-blue base (210deg hue for backgrounds) evokes structure and reliability. The teal primary (172deg) is energetic without being aggressive - it stands out from the blue-gray context while remaining professional. The high contrast between the off-white background and dark foreground ensures readability for long admin sessions. The subtle green for success and red for errors follow universal conventions for payment/status indicators.

### Background Treatment
The page background is a very light cool gray (`hsl(210 20% 98%)`) rather than pure white. Cards sit on top with pure white backgrounds, creating subtle depth through contrast alone. No gradients or patterns - the clean separation between background and cards provides all the visual structure needed for a data-heavy admin tool.

---

## 4. Mobile Layout (Phone)

### Layout Approach
On mobile, the hero element is a full-width summary banner showing the total active courses count and total registrations, taking the top 25% of the viewport. Below that, compact KPI chips scroll horizontally. The rest of the screen is a vertically scrolling list of upcoming courses with inline registration counts. The primary action button is fixed at the bottom.

### What Users See (Top to Bottom)

**Header:**
App title "Kursverwaltung" left-aligned in 600 weight, 20px. No subtitle. Right side has a small "+" icon button for quick actions.

**Hero Section (The FIRST thing users see):**
A full-width card with teal left border (4px), containing:
- "Aktive Kurse" label in 13px muted text
- The number of currently active courses in 42px, 700 weight, foreground color
- Below: a horizontal row of two compact stats: "X Anmeldungen" and "X offen" (unpaid) in 14px, using badges with muted background

Why this is the hero: The coordinator needs to instantly know the scale of their current workload - how many courses are running and how many registrations they're managing.

**Section 2: KPI Row**
A horizontally scrolling row of 3 compact stat chips (not full cards):
- Auslastung (Average utilization %) - teal text
- Unbezahlt (Unpaid count) - destructive/red text
- Dozenten (Active instructors count) - foreground text

Each chip: muted background, 13px label on top, 20px bold value below. ~100px wide each.

**Section 3: Nächste Kurse (Upcoming Courses)**
Vertical list of course cards, each showing:
- Course title (16px, 600 weight)
- Date range (14px, muted)
- Dozent name (14px, muted)
- Registration count badge: "X/Y Plätze" (e.g. "12/20 Plätze")
- Teal left border if course is upcoming, gray if past

Cards are tappable to open a detail sheet.

**Section 4: Tabs for Data Management**
A tab bar with: "Teilnehmer" | "Dozenten" | "Räume" | "Anmeldungen"
Each tab shows a simple list of records with edit/delete actions.

**Bottom Navigation / Action:**
Fixed bottom button: "Neue Anmeldung" in teal primary color, full-width with rounded corners (12px radius). 56px height for comfortable thumb tap.

### Mobile-Specific Adaptations
- KPIs become horizontal scroll chips instead of grid
- Course cards stack vertically, full width
- Data management tabs replace side-by-side columns
- Detail views open as bottom sheets, not modals

### Touch Targets
- All buttons minimum 44px height
- Course cards have generous padding (16px)
- Tab bar items are at least 48px wide
- Fixed bottom button is 56px tall

### Interactive Elements
- Course cards: tap to open detail bottom sheet showing full course info, registrations list, and edit/delete actions
- KPI chips: tap "Unbezahlt" to filter registrations by unpaid status

---

## 5. Desktop Layout

### Overall Structure
Two-row layout within a max-width container (1280px), centered.

**Row 1 (Hero row):** Two columns - 60% left / 40% right
- Left: Hero card with active course count, utilization bar, and mini course list (next 3 upcoming)
- Right: Stacked KPI cards (4 cards in 2x2 grid) - Total Anmeldungen, Unbezahlt, Durchschnitts-Preis, Dozenten aktiv

**Row 2 (Data row):** Full width with tabs
- Tab bar: "Kurse" | "Anmeldungen" | "Teilnehmer" | "Dozenten" | "Räume"
- Each tab shows a data table with full CRUD operations
- The "Kurse" tab is selected by default

### Section Layout
- **Top area (Row 1):** The hero overview + KPIs. The hero card has a subtle shadow (0 1px 3px rgba(0,0,0,0.08)) while KPI cards have border only, creating hierarchy.
- **Main content area (Row 2):** Full-width tabbed data management. Each tab has a header with title + "Neu erstellen" button, then a table with all records.
- **No sidebar** - the full width is used for data tables which benefit from horizontal space.

### What Appears on Hover
- Course items in hero list: background shifts to accent color, cursor pointer
- Table rows: subtle background highlight (muted), edit/delete icons become visible
- KPI cards: slight shadow increase
- "Neu erstellen" buttons: standard primary hover darkening

### Clickable/Interactive Areas
- Course items in hero card: click opens edit dialog pre-filled with course data
- Table rows: click to expand inline detail view
- Edit icon (pencil) on each table row: opens edit dialog
- Delete icon (trash) on each table row: opens delete confirmation
- KPI "Unbezahlt" card: click filters Anmeldungen tab to show only unpaid

---

## 6. Components

### Hero KPI
- **Title:** Aktive Kurse
- **Data source:** Kurse app, filtered by `startdatum <= today && enddatum >= today` (or `enddatum` is null/future)
- **Calculation:** Count of courses where the current date falls between startdatum and enddatum
- **Display:** Large number (42px mobile, 48px desktop) in 700 weight. Below: a thin progress bar showing average utilization (registrations / max_teilnehmer across all active courses) using teal accent color.
- **Context shown:** Below the utilization bar: "X von Y Plätzen belegt" (X of Y spots filled) in muted text
- **Why this is the hero:** The coordinator's primary concern is "how are my current courses doing?" - this answers it in one glance with both count and capacity utilization.

### Secondary KPIs

**Gesamte Anmeldungen (Total Registrations)**
- Source: Anmeldungen app
- Calculation: Count of all registration records
- Format: number
- Display: Card with border, 28px bold number, muted label above

**Unbezahlt (Unpaid)**
- Source: Anmeldungen app, filtered by bezahlt === false
- Calculation: Count of unpaid registrations
- Format: number, displayed in destructive red color
- Display: Card with border, 28px bold number in red, muted label above. Clickable to filter.

**Durchschnittspreis (Average Price)**
- Source: Kurse app
- Calculation: Average of preis field across all courses
- Format: currency (EUR)
- Display: Card with border, 28px bold number, muted label above

**Aktive Dozenten (Active Instructors)**
- Source: Dozenten app
- Calculation: Count of all instructor records
- Format: number
- Display: Card with border, 28px bold number, muted label above

### Chart
- **Type:** Bar chart - shows registrations per course, making it easy to compare popularity
- **Title:** Anmeldungen pro Kurs
- **What question it answers:** "Which courses are most popular?" - helps the coordinator identify high-demand courses
- **Data source:** Anmeldungen app joined with Kurse app
- **X-axis:** Course title (truncated to 15 chars if needed)
- **Y-axis:** Number of registrations
- **Bar color:** Primary teal
- **Mobile simplification:** Show only top 5 courses, horizontal layout with smaller bars. Label on left, bar on right.

### Lists/Tables

**Kurse (Courses) Table**
- Purpose: Full management of all courses
- Source: Kurse app joined with Dozenten and Raeume
- Fields shown in table: Kurstitel, Startdatum, Enddatum, Dozent (name), Raum (name), Preis, Anmeldungen (count)
- Mobile style: cards with title, date, and registration count
- Desktop style: full table with all columns
- Sort: By startdatum descending (upcoming first)
- Limit: All records, paginated if > 10

**Anmeldungen (Registrations) Table**
- Purpose: Track and manage all registrations
- Source: Anmeldungen app joined with Kurse and Teilnehmer
- Fields shown: Teilnehmer (name), Kurs (title), Anmeldedatum, Bezahlt (badge)
- Mobile style: cards
- Desktop style: table
- Sort: By anmeldedatum descending
- Filter: By bezahlt status

**Teilnehmer (Participants) Table**
- Purpose: Manage participant records
- Source: Teilnehmer app
- Fields shown: Vorname, Nachname, Email, Telefon
- Sort: By nachname ascending

**Dozenten (Instructors) Table**
- Purpose: Manage instructor records
- Source: Dozenten app
- Fields shown: Vorname, Nachname, Email, Telefon, Fachgebiet
- Sort: By nachname ascending

**Raeume (Rooms) Table**
- Purpose: Manage room records
- Source: Raeume app
- Fields shown: Raumname, Gebaeude, Kapazitaet
- Sort: By raumname ascending

### Primary Action Button (REQUIRED!)

- **Label:** Neue Anmeldung
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:** The form contains:
  - Teilnehmer (select from Teilnehmer app records - show "Vorname Nachname")
  - Kurs (select from Kurse app records - show "Kurstitel")
  - Anmeldedatum (date input, default: today)
  - Bezahlt (checkbox, default: false)
- **Mobile position:** bottom_fixed
- **Desktop position:** header (top right of the page)
- **Why this action:** Registering participants for courses is the most frequent daily task. Every phone call or email about a course often results in a new registration.

### CRUD Operations Per App (REQUIRED!)

**Kurse CRUD Operations**

- **Create:** "Neuen Kurs erstellen" button in Kurse tab header opens a Dialog with fields:
  - Kurstitel (text input, required)
  - Beschreibung (textarea)
  - Startdatum (date input)
  - Enddatum (date input)
  - Maximale Teilnehmerzahl (number input)
  - Preis EUR (number input)
  - Dozent (select from Dozenten records - show "Vorname Nachname")
  - Raum (select from Raeume records - show "Raumname")
- **Read:** Table view sorted by startdatum descending. Click row to see full details in dialog.
- **Update:** Pencil icon on each row opens same dialog as Create, pre-filled with current values.
- **Delete:** Trash icon on each row opens confirmation: "Kurs '{titel}' wirklich loschen?"

**Anmeldungen CRUD Operations**

- **Create:** Primary action button "Neue Anmeldung" opens Dialog with fields:
  - Teilnehmer (select from Teilnehmer records)
  - Kurs (select from Kurse records)
  - Anmeldedatum (date, default: today)
  - Bezahlt (checkbox, default: false)
- **Read:** Table view sorted by anmeldedatum descending. Bezahlt shown as green/red badge.
- **Update:** Pencil icon opens edit dialog. Most common edit: toggling bezahlt status.
- **Delete:** Trash icon with confirmation: "Anmeldung wirklich loschen?"

**Teilnehmer CRUD Operations**

- **Create:** "Neuen Teilnehmer erstellen" button opens Dialog with fields:
  - Vorname (text, required)
  - Nachname (text, required)
  - Email (email input)
  - Telefon (tel input)
  - Geburtsdatum (date input)
- **Read:** Table sorted by nachname ascending.
- **Update:** Pencil icon opens edit dialog pre-filled.
- **Delete:** Trash icon with confirmation: "Teilnehmer '{vorname} {nachname}' wirklich loschen?"

**Dozenten CRUD Operations**

- **Create:** "Neuen Dozenten erstellen" button opens Dialog with fields:
  - Vorname (text, required)
  - Nachname (text, required)
  - Email (email input)
  - Telefon (tel input)
  - Fachgebiet (text input)
- **Read:** Table sorted by nachname ascending.
- **Update:** Pencil icon opens edit dialog pre-filled.
- **Delete:** Trash icon with confirmation: "Dozent '{vorname} {nachname}' wirklich loschen?"

**Raeume CRUD Operations**

- **Create:** "Neuen Raum erstellen" button opens Dialog with fields:
  - Raumname (text, required)
  - Gebaeude (text input)
  - Kapazitaet (number input)
- **Read:** Table sorted by raumname ascending. Shows capacity prominently.
- **Update:** Pencil icon opens edit dialog pre-filled.
- **Delete:** Trash icon with confirmation: "Raum '{raumname}' wirklich loschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px) for cards and dialogs. Buttons use 8px as well. Badges use pill (16px). The fixed mobile action button uses 12px.

### Shadows
Subtle - only the hero card gets a shadow: `0 1px 3px rgba(0,0,0,0.08)`. All other cards use border only. Dialogs get a stronger shadow: `0 4px 24px rgba(0,0,0,0.12)`. On hover, interactive cards get `0 2px 8px rgba(0,0,0,0.08)`.

### Spacing
Normal to spacious. 24px gap between major sections. 16px padding inside cards. 12px gap between KPI cards. 8px gap between list items.

### Animations
- **Page load:** Fade in with slight upward motion (translate-y 8px to 0, opacity 0 to 1, 300ms ease-out)
- **Hover effects:** Background color transition (150ms), shadow transition (200ms)
- **Tap feedback:** Scale down to 0.98 on active state (100ms)
- **Dialog:** Fade + scale from 0.95 to 1 (200ms)

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --background: hsl(210 20% 98%);
  --foreground: hsl(215 25% 15%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(215 25% 15%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(215 25% 15%);
  --primary: hsl(172 66% 30%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(210 15% 96%);
  --secondary-foreground: hsl(215 25% 15%);
  --muted: hsl(210 15% 96%);
  --muted-foreground: hsl(215 15% 50%);
  --accent: hsl(172 50% 95%);
  --accent-foreground: hsl(172 66% 25%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(214 20% 90%);
  --input: hsl(214 20% 90%);
  --ring: hsl(172 66% 30%);
  --chart-1: hsl(172 66% 30%);
  --chart-2: hsl(152 60% 40%);
  --chart-3: hsl(215 25% 55%);
  --chart-4: hsl(30 80% 55%);
  --chart-5: hsl(280 45% 55%);
  --radius: 0.5rem;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans with weights 300-800)
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2
- [ ] Every app has full CRUD (Create, Read, Update, Delete) implemented
- [ ] CRUD patterns are consistent across all apps
- [ ] Delete confirmations are in place
- [ ] Bar chart showing registrations per course
- [ ] Tabs for data management on both mobile and desktop
- [ ] Fixed bottom action button on mobile
- [ ] Toast notifications for all CRUD operations
