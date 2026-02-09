# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for an educational institution or training provider. It manages courses (Kurse), rooms (Räume), instructors (Dozenten), registrations (Anmeldungen), and participants (Teilnehmer). The system tracks which courses are running, who teaches them, where they take place, and who has signed up.

### Who Uses This
A course administrator or program manager who needs an at-a-glance overview of their course operations. They manage dozens of courses, need to know enrollment numbers, track payments, and keep everything organized. They think in terms of "Which courses are running? How full are they? Who hasn't paid yet?"

### The ONE Thing Users Care About Most
**Current enrollment status** - How many registrations do they have, and how full are the courses? This is the heartbeat of a course management operation. Empty courses lose money; overfull courses need action.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** (New Registration) - The most frequent action. Someone calls or emails, and the admin needs to register them for a course immediately. This is the Primary Action Button.
2. **Neuen Kurs anlegen** (Create New Course) - Adding a new course to the schedule.
3. **Neuen Teilnehmer anlegen** (Add New Participant) - Registering a new person in the system.

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a cool slate-blue base with a warm amber accent that creates a professional yet approachable feel - like a well-run school office. The slight warmth of the amber against the cool background prevents the dashboard from feeling sterile or corporate. The combination signals competence and organization without being cold.

### Layout Strategy
The layout is **asymmetric on desktop** with a wide main column (2/3) and a narrower activity column (1/3). The hero element is a large enrollment summary that takes visual priority through size and whitespace. Below, course cards with progress bars showing fill rates create visual rhythm through varying fill levels. The asymmetry creates natural reading flow: overview first (left), then recent activity and quick actions (right).

On mobile, the layout becomes a focused vertical flow: hero enrollment number at top, then a horizontal scroll of secondary KPIs, followed by course list and activity stream.

### Unique Element
Each course card features a **capacity progress bar** with a color gradient from green (under 50%) through amber (50-80%) to red (over 80% full). This creates an instant visual heat map of enrollment pressure across all courses, making it immediately obvious which courses need attention - either marketing (empty) or capacity management (full).

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans has a professional, geometric quality with subtle rounded terminals that feel approachable and modern - ideal for an educational management context. It provides excellent weight variety for creating strong typographic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(216 25% 97%)` | `--background` |
| Main text | `hsl(220 20% 14%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 20% 14%)` | `--card-foreground` |
| Borders | `hsl(216 18% 90%)` | `--border` |
| Primary action | `hsl(32 95% 52%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(216 60% 52%)` | `--accent` |
| Muted background | `hsl(216 18% 93%)` | `--muted` |
| Muted text | `hsl(216 10% 52%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 42%)` | (component use) |
| Error/negative | `hsl(4 72% 52%)` | `--destructive` |

### Why These Colors
The cool slate-blue background (`hsl(216 25% 97%)`) creates a calm, organized base. The warm amber primary (`hsl(32 95% 52%)`) draws attention to actions and important highlights without being aggressive. The blue accent (`hsl(216 60% 52%)`) is used for data links and secondary interactive elements. Success green and destructive red are used sparingly for payment status and capacity warnings.

### Background Treatment
The page background is a subtle cool off-white (`hsl(216 25% 97%)`) - not pure white. Cards sit on top with pure white backgrounds, creating gentle depth through contrast alone. No gradients or textures - the depth comes from the card elevation pattern.

---

## 4. Mobile Layout (Phone)

### Layout Approach
The hero dominates the first viewport with a large enrollment count and payment summary. Below, secondary KPIs are in a compact horizontal scroll strip. The course list follows as stacked cards. Visual interest comes from the size contrast between the large hero number and the compact KPI chips below it.

### What Users See (Top to Bottom)

**Header:**
A simple top bar with the app title "Kursverwaltung" in 600 weight, left-aligned. Right side has a small "+" icon button as quick-add for new registrations.

**Hero Section (The FIRST thing users see):**
A large card spanning full width with:
- The label "Anmeldungen gesamt" in small (12px), muted text, uppercase tracking-wide
- The total count of registrations as a massive number (48px, 800 weight)
- Below: two inline stats - "X bezahlt" (with green dot) and "X offen" (with amber dot), both in 14px muted text
- This takes roughly 25% of viewport height
- Why: The admin's first question is always "how many registrations do we have?"

**Section 2: Quick KPIs (horizontal scroll)**
A horizontally scrollable row of compact stat chips (not cards - just inline rounded containers):
- "X Kurse aktiv" (total active courses)
- "X Dozenten" (total instructors)
- "X Räume" (total rooms)
- "X Teilnehmer" (total unique participants)
Each chip: muted background, small icon left, number in semibold, label in regular weight. Height ~40px.

**Section 3: Kurse (Course List)**
Section header "Kurse" with a small "Alle verwalten" text link on the right.
Stacked course cards, each showing:
- Course title (16px, 600 weight)
- Dozent name and date range in muted text (13px)
- Capacity progress bar (full width, 6px height, rounded)
- "X / Y Plätze" text below bar (13px, muted)
- Price badge on the right side in small text
Cards have 12px padding, subtle border, 8px radius.
Show first 5 courses, "Alle X Kurse anzeigen" link below.

**Section 4: Letzte Anmeldungen (Recent Registrations)**
Section header "Letzte Anmeldungen".
Simple list items (no cards) with:
- Participant name (left, medium weight)
- Course name (below, small, muted)
- Date (right-aligned, small, muted)
- Payment status badge (green "Bezahlt" or amber "Offen")
Show last 5, "Alle anzeigen" link below.

**Bottom Navigation / Action:**
Fixed bottom button: "Neue Anmeldung" in primary color (amber), full width minus margins, 48px height, centered text with Plus icon. This is always accessible for the #1 action.

### Mobile-Specific Adaptations
- Hero takes full width, no side margins on the hero card
- KPI chips are horizontally scrollable (no wrapping)
- Course cards stack vertically, one per row
- Recent registrations use a compact list style, not cards
- Tabs component at the bottom of course list to switch between "Kurse", "Dozenten", "Räume", "Teilnehmer" views

### Touch Targets
- All list items are at least 44px tall for comfortable tapping
- The fixed bottom CTA button is 48px tall
- Edit/delete actions are accessed via tapping on a list item to open a detail sheet

### Interactive Elements
- Tapping a course card opens a bottom sheet with full course details and edit/delete actions
- Tapping a registration opens a detail sheet with participant info and payment toggle
- Long list items use a slide-up bottom sheet pattern for detail views on mobile

---

## 5. Desktop Layout

### Overall Structure
A two-column asymmetric layout with a max-width container (1280px), centered:
- **Left column (65%)**: Hero stats row + Course management table + Tabs for other apps
- **Right column (35%)**: Quick actions panel + Recent registrations list + Quick stats sidebar

The eye goes: Hero stats (top-left) → Course table (center-left) → Recent activity (right).

### Section Layout

**Top Area (Full Width):**
Header bar with "Kursverwaltung" title (24px, 700 weight) on the left and the primary action button "Neue Anmeldung" (amber, with Plus icon) on the right.

**Left Column - Hero Stats Row:**
Three stat cards in a row (equal width within the left column):
1. "Anmeldungen" - Large number (36px, 700 weight), with "X bezahlt / Y offen" subtitle
2. "Kurse aktiv" - Large number, with date range context
3. "Auslastung" - Average capacity percentage across all courses, with a small inline bar

**Left Column - Main Content:**
Tabbed interface with tabs: **Kurse** | **Dozenten** | **Räume** | **Teilnehmer** | **Anmeldungen**

Each tab shows a table view of the respective app's data with:
- Column headers matching the app's fields
- Inline edit (pencil icon) and delete (trash icon) buttons per row
- "Neuen Eintrag erstellen" button above each table
- Search/filter input above the table
- Sortable column headers

The **Kurse** tab (default) shows: Titel, Dozent (resolved name), Raum (resolved name), Startdatum, Enddatum, Teilnehmer (count from Anmeldungen), Kapazität (progress bar), Preis, Actions.

**Right Column - Activity & Quick Stats:**
- **Letzte Anmeldungen**: List of recent 8 registrations with participant name, course, date, payment status badge
- **Zahlungsübersicht**: Small summary showing total revenue (sum of prices for paid registrations), outstanding amount, payment rate percentage
- **Quick Stats**: Compact list of stats - total Dozenten, total Räume, total Teilnehmer

### What Appears on Hover
- Table rows highlight with a subtle muted background on hover
- Course capacity bars show exact "X/Y" tooltip on hover
- Stat cards show a subtle lift shadow on hover
- Edit/Delete action buttons become more visible on row hover (slightly transparent by default)

### Clickable/Interactive Areas
- Clicking a course name in the table opens the edit dialog pre-filled
- Clicking a participant name in the registrations list opens their detail dialog
- All stat cards are not clickable (they show everything already)
- Table column headers are clickable for sorting

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Anmeldungen gesamt
- **Data source:** Anmeldungen app
- **Calculation:** Total count of all Anmeldungen records
- **Display:** Large number (48px on mobile, 36px on desktop), with two sub-stats: count where bezahlt=true ("bezahlt") and count where bezahlt=false/null ("offen")
- **Context shown:** Payment split with colored dots (green for paid, amber for open)
- **Why this is the hero:** Registration count is the #1 metric for a course admin - it directly represents business activity and revenue

### Secondary KPIs

**Aktive Kurse**
- Source: Kurse app
- Calculation: Total count of all Kurse records
- Format: number
- Display: Stat card with large number (desktop) / chip (mobile)

**Durchschnittliche Auslastung**
- Source: Cross-reference Anmeldungen (count per Kurs) vs Kurse (maximale_teilnehmer)
- Calculation: Average of (registrations per course / max capacity per course) across all courses, as percentage
- Format: percent
- Display: Stat card with number and small inline progress bar

**Umsatz (bezahlt)**
- Source: Cross-reference Anmeldungen (bezahlt=true) with Kurse (preis)
- Calculation: Sum of Kurs.preis for each Anmeldung where bezahlt=true
- Format: currency EUR
- Display: In right sidebar "Zahlungsübersicht" section

### Chart (if applicable)
No chart is included. The capacity progress bars on each course row serve as inline visualizations that are more actionable than a standalone chart for this use case. A chart would add visual noise without adding insight that the progress bars don't already provide.

### Lists/Tables

**Kurse Table (Desktop) / Card List (Mobile)**
- Purpose: Central management view for all courses
- Source: Kurse app, enriched with Dozenten names, Raum names, and Anmeldungen counts
- Fields shown: Titel, Dozent (resolved), Raum (resolved), Startdatum, Enddatum, Anmeldungen/Kapazität (progress bar), Preis
- Mobile style: Stacked cards with key info
- Desktop style: Full table with sortable columns
- Sort: By Startdatum (nearest first)
- Limit: All (paginated at 10 on mobile)

**Dozenten Table/List**
- Purpose: Manage instructor records
- Source: Dozenten app
- Fields shown: Vorname, Nachname, E-Mail, Telefon, Fachgebiet
- Mobile style: Simple list with name + fachgebiet
- Desktop style: Table
- Sort: By Nachname alphabetically

**Räume Table/List**
- Purpose: Manage room records
- Source: Räume app
- Fields shown: Raumname, Gebäude, Kapazität
- Mobile style: Simple list
- Desktop style: Table
- Sort: By Gebäude, then Raumname

**Teilnehmer Table/List**
- Purpose: Manage participant records
- Source: Teilnehmer app
- Fields shown: Vorname, Nachname, E-Mail, Telefon, Geburtsdatum
- Mobile style: Simple list with name + email
- Desktop style: Table
- Sort: By Nachname alphabetically

**Anmeldungen Table/List**
- Purpose: Manage all registrations
- Source: Anmeldungen app, enriched with Teilnehmer and Kurs names
- Fields shown: Teilnehmer (resolved name), Kurs (resolved title), Anmeldedatum, Bezahlt (toggle/badge)
- Mobile style: List with status badge
- Desktop style: Table
- Sort: By Anmeldedatum (newest first)

**Letzte Anmeldungen (Recent - Sidebar)**
- Purpose: Quick view of recent activity
- Source: Anmeldungen app (sorted by anmeldedatum, newest first)
- Fields shown: Teilnehmer name, Kurs title, Anmeldedatum, Bezahlt badge
- Style: Compact list items (both mobile and desktop)
- Limit: 8 items

### Primary Action Button (REQUIRED!)

- **Label:** Neue Anmeldung
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:** Teilnehmer (select from Teilnehmer app), Kurs (select from Kurse app), Anmeldedatum (date, default today), Bezahlt (checkbox, default false)
- **Mobile position:** bottom_fixed
- **Desktop position:** header (top-right)
- **Why this action:** Registering a participant for a course is the single most frequent action. When someone calls or emails, the admin needs to do this immediately.

### CRUD Operations Per App (REQUIRED!)

**Kurse CRUD Operations**

- **Create (Erstellen):**
  - **Trigger:** "Neuen Kurs erstellen" button above the Kurse table/list
  - **Form fields:** Titel (text input), Beschreibung (textarea), Startdatum (date input), Enddatum (date input), Maximale Teilnehmerzahl (number input), Preis EUR (number input), Dozent (select dropdown from Dozenten app - show "Vorname Nachname"), Raum (select dropdown from Räume app - show "Raumname - Gebäude")
  - **Form style:** Dialog/Modal
  - **Required fields:** Titel, Startdatum
  - **Default values:** Startdatum = today, Enddatum = today + 7 days

- **Read (Anzeigen):**
  - **List view:** Table on desktop, cards on mobile
  - **Detail view:** Click on course row → Edit dialog opens pre-filled
  - **Fields shown in list:** Titel, Dozent, Raum, Datum, Auslastung, Preis
  - **Fields shown in detail:** All fields
  - **Sort:** By Startdatum (upcoming first)
  - **Filter/Search:** Text filter on Titel

- **Update (Bearbeiten):**
  - **Trigger:** Pencil icon on table row (desktop) / tap card then edit button (mobile)
  - **Edit style:** Same dialog as Create but pre-filled with current values
  - **Editable fields:** All fields

- **Delete (Löschen):**
  - **Trigger:** Trash icon on table row (desktop) / delete button in detail sheet (mobile)
  - **Confirmation:** AlertDialog with warning
  - **Confirmation text:** "Möchtest du den Kurs '{titel}' wirklich löschen? Alle zugehörigen Anmeldungen bleiben bestehen."

**Räume CRUD Operations**

- **Create:** "Neuen Raum erstellen" button → Dialog with fields: Raumname (text), Gebäude (text), Kapazität (number)
- **Read:** Table on desktop, list on mobile. Fields: Raumname, Gebäude, Kapazität. Sort by Gebäude.
- **Update:** Pencil icon → Same dialog pre-filled
- **Delete:** Trash icon → Confirmation "Möchtest du den Raum '{raumname}' wirklich löschen?"

**Dozenten CRUD Operations**

- **Create:** "Neuen Dozenten erstellen" button → Dialog with fields: Vorname (text), Nachname (text), E-Mail (email input), Telefon (tel input), Fachgebiet (text)
- **Read:** Table on desktop, list on mobile. Fields: Name (Vorname + Nachname), E-Mail, Telefon, Fachgebiet. Sort by Nachname.
- **Update:** Pencil icon → Same dialog pre-filled
- **Delete:** Trash icon → Confirmation "Möchtest du den Dozenten '{vorname} {nachname}' wirklich löschen?"

**Teilnehmer CRUD Operations**

- **Create:** "Neuen Teilnehmer erstellen" button → Dialog with fields: Vorname (text), Nachname (text), E-Mail (email input), Telefon (tel input), Geburtsdatum (date input)
- **Read:** Table on desktop, list on mobile. Fields: Name, E-Mail, Telefon, Geburtsdatum. Sort by Nachname.
- **Update:** Pencil icon → Same dialog pre-filled
- **Delete:** Trash icon → Confirmation "Möchtest du den Teilnehmer '{vorname} {nachname}' wirklich löschen?"

**Anmeldungen CRUD Operations**

- **Create:** Primary action button "Neue Anmeldung" → Dialog with fields: Teilnehmer (select from Teilnehmer app), Kurs (select from Kurse app), Anmeldedatum (date, default today), Bezahlt (checkbox)
- **Read:** Table on desktop, list on mobile. Fields: Teilnehmer (resolved), Kurs (resolved), Anmeldedatum, Bezahlt. Sort by Anmeldedatum (newest first).
- **Update:** Pencil icon → Same dialog pre-filled. Bezahlt can also be toggled directly via a switch in the table.
- **Delete:** Trash icon → Confirmation "Möchtest du die Anmeldung von '{teilnehmer}' für '{kurs}' wirklich löschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px) - `--radius: 0.5rem` - professional and modern without being too playful

### Shadows
Subtle - Cards use `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)). On hover, cards elevate to `shadow-md`. No heavy drop shadows anywhere.

### Spacing
Normal - 16px gaps between cards, 24px between sections, 12px internal card padding. Desktop gets 24px gaps between major columns.

### Animations
- **Page load:** Subtle fade-in (opacity 0→1 over 300ms)
- **Hover effects:** Cards lift slightly with shadow transition (150ms ease). Table rows get muted background. Buttons darken slightly.
- **Tap feedback:** Buttons scale down slightly (scale 0.98) on active state

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(216 25% 97%);
  --foreground: hsl(220 20% 14%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 20% 14%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 20% 14%);
  --primary: hsl(32 95% 52%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(216 18% 93%);
  --secondary-foreground: hsl(220 20% 14%);
  --muted: hsl(216 18% 93%);
  --muted-foreground: hsl(216 10% 52%);
  --accent: hsl(216 60% 52%);
  --accent-foreground: hsl(0 0% 100%);
  --destructive: hsl(4 72% 52%);
  --border: hsl(216 18% 90%);
  --input: hsl(216 18% 90%);
  --ring: hsl(32 95% 52%);
  --chart-1: hsl(32 95% 52%);
  --chart-2: hsl(152 55% 42%);
  --chart-3: hsl(216 60% 52%);
  --chart-4: hsl(280 55% 52%);
  --chart-5: hsl(4 72% 52%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans with weights 300-800)
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4 (hero → KPI chips → course cards → registrations → fixed CTA)
- [ ] Desktop layout matches Section 5 (two-column asymmetric with tabs)
- [ ] Hero element is prominent as described (large enrollment count)
- [ ] Colors create the warm-amber-on-cool-slate mood described in Section 2
- [ ] Every app has full CRUD (Create, Read, Update, Delete) implemented
- [ ] CRUD patterns are consistent across all apps (dialog style, button placement)
- [ ] Delete confirmations are in place for all apps
- [ ] Capacity progress bars with color gradient on course items
- [ ] Applookup fields resolve to display names (Dozent → name, Raum → name, etc.)
- [ ] Date formatting uses dd.MM.yyyy for display, YYYY-MM-DD for API
- [ ] Toast feedback on all CRUD operations
