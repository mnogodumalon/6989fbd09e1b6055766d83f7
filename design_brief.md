# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for an educational institution (Volkshochschule, training center, or similar). It manages courses (Kurse), rooms (Räume), instructors (Dozenten), participants (Teilnehmer), and registrations (Anmeldungen). The system tracks which participants are enrolled in which courses, which instructors teach them, where courses take place, pricing, and payment status.

### Who Uses This
An administrator or coordinator at an educational institution. They manage the daily operations: creating courses, assigning rooms and instructors, tracking registrations, and monitoring payment status. They need a quick overview of what's happening and the ability to manage all data efficiently.

### The ONE Thing Users Care About Most
**How are my courses doing?** — specifically: How many registrations do I have, which courses are filling up, and which payments are outstanding? The registration count relative to capacity and the payment status are the most operationally critical metrics.

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** → Primary Action Button (register a participant for a course — the most frequent daily action)
2. Neuen Kurs erstellen (create a new course)
3. Neuen Teilnehmer anlegen (add a new participant)

---

## 2. What Makes This Design Distinctive

### Visual Identity
The design uses a cool slate-blue base with a distinctive deep indigo accent, evoking the structured, trustworthy feel of an academic institution. The warm off-white background has a subtle cool undertone that feels clean but not sterile. The indigo accent is used sparingly — only for primary actions and the hero metric — creating a sense of authority and focus. This feels like a purpose-built tool for a professional coordinator, not a generic admin panel.

### Layout Strategy
The layout uses an **asymmetric approach** because there's a clear hero: the total registrations and fill-rate overview. On desktop, a wide left column (65%) contains the hero KPI banner and the course overview chart, while a narrower right column (35%) holds secondary KPIs and the recent registrations list. This creates natural visual flow from the big picture (left) to the details (right). Size variation is achieved through a large hero number (56px) contrasted with compact secondary KPI cards. The course list table below spans full width, providing density where it's needed.

### Unique Element
The hero section features an **inline registration progress summary** — a horizontal bar showing total registrations vs. total capacity across all active courses, with a large percentage fill-rate number. This immediately communicates the most critical business metric: "Are our courses filling up?" The bar uses a gradient from the indigo accent to a lighter tint, with the percentage displayed in large, bold typography overlaid.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans has a professional, geometric quality with slightly rounded terminals that feels modern and approachable — perfect for an educational administration tool. It's distinctive without being distracting, and its weight range allows strong typographic hierarchy.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(220 20% 97%)` | `--background` |
| Main text | `hsl(220 25% 12%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 25% 12%)` | `--card-foreground` |
| Borders | `hsl(220 15% 90%)` | `--border` |
| Primary action | `hsl(234 62% 46%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(234 62% 95%)` | `--accent` |
| Muted background | `hsl(220 15% 95%)` | `--muted` |
| Muted text | `hsl(220 10% 46%)` | `--muted-foreground` |
| Success/positive | `hsl(152 55% 42%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The cool slate-blue background creates a calm, institutional feel. The deep indigo primary (`hsl(234 62% 46%)`) is authoritative and distinctive — not the overused generic blue of Bootstrap. The muted tones keep the interface professional, while the indigo accent draws attention exactly where needed. Green for positive/paid status and red for unpaid/destructive actions follow universal conventions.

### Background Treatment
The page background is a subtle cool off-white (`hsl(220 20% 97%)`) — not pure white, giving cards a gentle lift without requiring heavy shadows. This creates natural depth through color contrast alone.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile uses a single-column vertical flow. The hero KPI dominates the first viewport with a large fill-rate percentage and progress bar. Secondary KPIs are arranged as a compact 2x2 grid of small cards. The course list becomes swipeable cards instead of a table. Visual hierarchy is maintained through size: the hero number is 40px, secondary KPIs are 24px, and list items use 14px body text.

### What Users See (Top to Bottom)

**Header:**
A compact header with "Kursverwaltung" as the title (20px, weight 700) on the left, and the primary action button "Neue Anmeldung" as a compact button with a "+" icon on the right.

**Hero Section (The FIRST thing users see):**
A full-width card spanning the viewport width (with 16px horizontal padding). Contains:
- Label "Auslastung" in muted text (12px, weight 500, uppercase tracking)
- The fill-rate percentage in large bold text (40px, weight 800, indigo color)
- A horizontal progress bar (8px tall, rounded-full, indigo fill on muted background) showing total registrations / total capacity
- Below the bar: "X von Y Plätzen belegt" in muted text (13px)

This is the hero because it instantly answers "Are our courses filling up?" — the #1 question every morning.

**Section 2: Quick Stats (2x2 Grid)**
Four compact stat cards in a 2-column grid:
1. **Aktive Kurse** — count of courses with enddate >= today (icon: BookOpen)
2. **Teilnehmer** — total participant count (icon: Users)
3. **Offene Zahlungen** — count of registrations where bezahlt=false (icon: AlertCircle, uses destructive color)
4. **Umsatz** — sum of preis for all registrations where bezahlt=true (icon: Euro, formatted as EUR currency)

Each card: white background, 12px padding, rounded-lg. Label in muted text (11px), value in bold (24px), icon top-right in muted color.

**Section 3: Anmeldungen pro Kurs (Bar Chart)**
A horizontal bar chart showing each course name on the Y-axis and registration count on the X-axis, with a max-capacity marker line. Uses the indigo primary color for bars. Chart height adapts to number of courses (min 200px). Title "Anmeldungen pro Kurs" (16px, weight 600). Simplified on mobile: shorter course name labels (truncated at 15 chars), no axis labels.

**Section 4: Letzte Anmeldungen**
A scrollable list of the 5 most recent registrations. Each item shows:
- Participant name (resolved from applookup) — bold 14px
- Course name (resolved from applookup) — muted 13px
- Date — muted 12px, right-aligned
- Payment badge: green "Bezahlt" or red "Offen"

Each item has a divider line. Tapping opens an edit/detail dialog.

**Section 5: Data Management Tabs**
A tab bar with 5 tabs: Kurse, Räume, Dozenten, Teilnehmer, Anmeldungen. Each tab shows a list of records for that app with edit/delete actions. A "+" button at the top-right of each tab creates a new record.

**Bottom Navigation / Action:**
No fixed bottom nav. The primary "Neue Anmeldung" button is in the header for constant access.

### Mobile-Specific Adaptations
- Course table becomes card list
- Chart simplified with shorter labels
- Tabs for data management are horizontally scrollable
- All dialogs use full-width on mobile (sm:max-w-md on desktop)

### Touch Targets
- All buttons minimum 44px tap target
- List items have 48px minimum height
- Tab buttons have generous padding (12px vertical, 16px horizontal)

### Interactive Elements
- Tapping a registration item opens edit dialog
- Tapping a course card opens course detail/edit dialog
- All list items in data management tabs are tappable for edit

---

## 5. Desktop Layout

### Overall Structure
Two-column layout with a max-width container (1280px, centered). The header spans full width. Below it:
- **Left column (65%):** Hero KPI banner, then the bar chart
- **Right column (35%):** Secondary KPIs stacked vertically (2x2 grid), then recent registrations list

Below the two columns: a full-width data management section with tabs for all 5 apps (Kurse, Räume, Dozenten, Teilnehmer, Anmeldungen), each showing a proper table with inline edit/delete actions.

The eye goes: Hero percentage (top-left, largest) → Secondary KPIs (top-right) → Chart (left, mid) → Recent list (right, mid) → Full data tables (bottom).

### Section Layout
- **Top area:** Full-width header with title and primary action button
- **Main content (two columns):**
  - Left (65%): Hero card (fill-rate with progress bar), then bar chart card
  - Right (35%): 2x2 grid of stat cards, then recent registrations card
- **Bottom area:** Full-width tabbed data management section with tables

### What Appears on Hover
- Table rows: subtle background highlight (`hsl(220 15% 95%)`)
- Cards: gentle shadow elevation transition (`transition-shadow hover:shadow-md`)
- Edit/delete icon buttons: background highlight on hover
- Chart bars: tooltip showing exact count and capacity

### Clickable/Interactive Areas
- Each table row in data management is clickable to open edit dialog
- Edit (pencil) and Delete (trash) icons on each row
- "+" button per tab for creating new records
- Recent registration items open edit dialog on click
- Chart bars show tooltip on hover

---

## 6. Components

### Hero KPI
- **Title:** Auslastung (Gesamtauslastung)
- **Data source:** Kurse (for capacity) + Anmeldungen (for registration count)
- **Calculation:** (Total Anmeldungen count / Sum of maximale_teilnehmer across all active Kurse) × 100
- **Display:** Large percentage number (56px desktop / 40px mobile, weight 800, indigo color). Below: a horizontal progress bar (10px tall desktop, 8px mobile, rounded-full). Below that: "X von Y Plätzen belegt" text.
- **Context shown:** Absolute numbers below the bar (e.g., "47 von 120 Plätzen belegt")
- **Why this is the hero:** Fill rate is the single most important operational metric — it tells the coordinator whether courses are viable, which ones need marketing, and overall business health.

### Secondary KPIs

**Aktive Kurse**
- Source: Kurse (filter: enddatum >= today or enddatum is null)
- Calculation: count
- Format: number
- Display: Card with icon (BookOpen), muted label, bold number (28px desktop)

**Teilnehmer gesamt**
- Source: Teilnehmer
- Calculation: count
- Format: number
- Display: Card with icon (Users), muted label, bold number

**Offene Zahlungen**
- Source: Anmeldungen (filter: bezahlt === false or bezahlt is null)
- Calculation: count
- Format: number with destructive color if > 0
- Display: Card with icon (AlertCircle), muted label, bold number. Number in destructive color when > 0.

**Umsatz (bezahlt)**
- Source: Anmeldungen (filter: bezahlt === true) joined with Kurse (for preis)
- Calculation: Sum of preis for each paid registration's course
- Format: EUR currency (de-DE locale)
- Display: Card with icon (Euro), muted label, bold number

### Chart
- **Type:** Horizontal Bar chart — because we're comparing courses by registration count, and course names read better horizontally on the Y-axis
- **Title:** Anmeldungen pro Kurs
- **What question it answers:** Which courses are popular and which ones need attention?
- **Data source:** Kurse + Anmeldungen (count registrations per course)
- **X-axis:** Registration count (number)
- **Y-axis:** Course title (string, truncated to 20 chars on desktop, 15 on mobile)
- **Colors:** Indigo primary for bars, muted background reference line for max capacity
- **Mobile simplification:** Shorter labels, no axis title, compact height

### Lists/Tables

**Letzte Anmeldungen (Recent Registrations)**
- Purpose: Quick overview of latest activity
- Source: Anmeldungen, joined with Teilnehmer (name) and Kurse (title)
- Fields shown: Participant name, Course name, Date, Payment status badge
- Mobile style: Simple list with dividers
- Desktop style: Compact card list
- Sort: By anmeldedatum descending (newest first)
- Limit: 5 items

### Primary Action Button (REQUIRED!)
- **Label:** "Neue Anmeldung"
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:**
  - Teilnehmer (Select from Teilnehmer records — applookup)
  - Kurs (Select from Kurse records — applookup)
  - Anmeldedatum (date, default: today)
  - Bezahlt (checkbox, default: false)
- **Mobile position:** header (compact button with Plus icon)
- **Desktop position:** header (full button "Neue Anmeldung" with Plus icon)
- **Why this action:** Registering participants for courses is the single most frequent daily task. It must be one click away at all times.

### CRUD Operations Per App (REQUIRED!)

**Kurse CRUD Operations**
- **Create:** "+" button in Kurse tab header opens Dialog with fields: Kurstitel (text, required), Beschreibung (textarea), Startdatum (date), Enddatum (date), Maximale Teilnehmerzahl (number), Preis EUR (number), Dozent (select from Dozenten records), Raum (select from Räume records)
- **Read:** Table with columns: Kurstitel, Startdatum, Enddatum, Max. Teilnehmer, Preis, Dozent (resolved name), Raum (resolved name). Click row to see full details in dialog.
- **Update:** Pencil icon on row → same dialog as Create, pre-filled with current values
- **Delete:** Trash icon on row → Confirmation dialog "Möchtest du den Kurs '{titel}' wirklich löschen?"

**Räume CRUD Operations**
- **Create:** "+" button opens Dialog with fields: Raumname (text, required), Gebäude (text), Kapazität (number)
- **Read:** Table with columns: Raumname, Gebäude, Kapazität
- **Update:** Pencil icon → same dialog, pre-filled
- **Delete:** Trash icon → Confirmation "Möchtest du den Raum '{raumname}' wirklich löschen?"

**Dozenten CRUD Operations**
- **Create:** "+" button opens Dialog with fields: Vorname (text, required), Nachname (text, required), E-Mail (email), Telefon (tel), Fachgebiet (text)
- **Read:** Table with columns: Vorname, Nachname, E-Mail, Fachgebiet
- **Update:** Pencil icon → same dialog, pre-filled
- **Delete:** Trash icon → Confirmation "Möchtest du den Dozenten '{vorname} {nachname}' wirklich löschen?"

**Teilnehmer CRUD Operations**
- **Create:** "+" button opens Dialog with fields: Vorname (text, required), Nachname (text, required), E-Mail (email), Telefon (tel), Geburtsdatum (date)
- **Read:** Table with columns: Vorname, Nachname, E-Mail, Telefon
- **Update:** Pencil icon → same dialog, pre-filled
- **Delete:** Trash icon → Confirmation "Möchtest du den Teilnehmer '{vorname} {nachname}' wirklich löschen?"

**Anmeldungen CRUD Operations**
- **Create:** Primary action button "Neue Anmeldung" opens Dialog with fields: Teilnehmer (select from Teilnehmer records, required), Kurs (select from Kurse records, required), Anmeldedatum (date, default today), Bezahlt (checkbox)
- **Read:** Table with columns: Teilnehmer (resolved name), Kurs (resolved title), Anmeldedatum, Bezahlt (badge)
- **Update:** Pencil icon → same dialog, pre-filled. Particularly useful for toggling Bezahlt status.
- **Delete:** Trash icon → Confirmation "Möchtest du diese Anmeldung wirklich löschen?"

---

## 7. Visual Details

### Border Radius
Rounded (8px) — `--radius: 0.5rem`. Professional but not sharp, not overly playful.

### Shadows
Subtle — cards use `shadow-sm` by default, `shadow-md` on hover. No heavy elevation. The cool background color provides natural separation.

### Spacing
Normal to spacious — 24px gap between major sections, 16px gap within card grids, 12px internal card padding on mobile, 16-20px on desktop. Generous whitespace around the hero section.

### Animations
- **Page load:** Fade in with slight upward translate (200ms ease-out)
- **Hover effects:** Cards gain shadow elevation (transition-shadow 150ms). Table rows gain muted background. Buttons darken slightly.
- **Tap feedback:** Active state scale(0.98) on buttons (transition 100ms)

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(220 20% 97%);
  --foreground: hsl(220 25% 12%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 25% 12%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 25% 12%);
  --primary: hsl(234 62% 46%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(220 15% 95%);
  --secondary-foreground: hsl(220 25% 12%);
  --muted: hsl(220 15% 95%);
  --muted-foreground: hsl(220 10% 46%);
  --accent: hsl(234 62% 95%);
  --accent-foreground: hsl(234 62% 46%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(220 15% 90%);
  --input: hsl(220 15% 90%);
  --ring: hsl(234 62% 46%);
  --chart-1: hsl(234 62% 46%);
  --chart-2: hsl(152 55% 42%);
  --chart-3: hsl(220 10% 46%);
  --chart-4: hsl(34 90% 55%);
  --chart-5: hsl(280 60% 55%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from URL above (Plus Jakarta Sans, weights 300-800)
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element (Auslastung with progress bar) is prominent as described
- [ ] Colors create the cool, institutional mood described in Section 2
- [ ] CRUD patterns are consistent across all 5 apps
- [ ] Delete confirmations are in place for all apps
- [ ] All applookup fields resolved (Dozent name, Raum name, Teilnehmer name, Kurs title)
- [ ] Dates formatted with de-DE locale
- [ ] Currency formatted as EUR with de-DE locale
