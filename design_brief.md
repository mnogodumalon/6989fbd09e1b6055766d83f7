# Design Brief: Kursverwaltung

## 1. App Analysis

### What This App Does
Kursverwaltung is a course management system for an educational organization. It tracks instructors (Dozenten), rooms (Räume), participants (Teilnehmer), courses (Kurse), and registrations (Anmeldungen). The system manages the full lifecycle from course creation through participant registration and payment tracking.

### Who Uses This
A course administrator or education coordinator who needs a quick overview of their course offerings, enrollment status, and revenue. They manage dozens of courses per semester, need to spot underbooked or overbooked courses, and track outstanding payments.

### The ONE Thing Users Care About Most
**Registration status across all courses** — how many seats are filled vs. available, and whether people have paid. This is the daily pulse check: "Are my courses filling up? Is money coming in?"

### Primary Actions (IMPORTANT!)
1. **Neue Anmeldung** → Primary Action Button — register a participant for a course (most frequent daily action)
2. View course details and enrollment counts
3. Check payment status

---

## 2. What Makes This Design Distinctive

### Visual Identity
The dashboard uses a warm, academic palette — a soft ivory background paired with a deep indigo primary accent that feels scholarly and trustworthy. The warmth comes from subtle amber highlights on revenue figures and payment badges, creating an "organized desk" aesthetic. This is a tool for someone who runs a well-managed Volkshochschule, not a Silicon Valley startup.

### Layout Strategy
The layout is **asymmetric on desktop** with a dominant left column (2/3 width) holding the hero KPI and course enrollment chart, and a narrower right column (1/3 width) for recent registrations and quick stats. The hero — a large "Auslastung" (utilization) percentage — anchors the top-left, rendered large and bold with a subtle circular progress indicator. Below the hero row, secondary KPIs sit in a compact 4-column strip using different visual weights. The chart spans the full left column beneath, while the right column stacks a "Letzte Anmeldungen" list and a "Unbezahlt" alert section.

### Unique Element
The hero utilization metric uses a **semicircular gauge** rendered in indigo, showing the aggregate fill rate across all courses. The gauge has a thick 6px stroke with rounded endpoints, and the percentage sits centered below the arc in a large 48px bold numeral. This makes the abstract concept of "how full are my courses" immediately visceral and glanceable.

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap`
- **Why this font:** Plus Jakarta Sans has a professional warmth — geometric enough for data display but with soft terminals that avoid coldness. Its wide weight range (300–800) enables strong typographic hierarchy. It suits an educational/administrative context perfectly.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(40 33% 97%)` | `--background` |
| Main text | `hsl(230 25% 18%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(230 25% 18%)` | `--card-foreground` |
| Borders | `hsl(40 18% 88%)` | `--border` |
| Primary action (indigo) | `hsl(234 62% 46%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight (amber) | `hsl(38 92% 50%)` | `--accent` |
| Muted background | `hsl(40 20% 94%)` | `--muted` |
| Muted text | `hsl(230 10% 48%)` | `--muted-foreground` |
| Success/positive | `hsl(152 60% 40%)` | (component use) |
| Error/negative | `hsl(0 72% 51%)` | `--destructive` |

### Why These Colors
The warm ivory background (`hsl(40 33% 97%)`) avoids sterile white and creates a paper-like feel suited to an academic environment. The deep indigo primary (`hsl(234 62% 46%)`) provides gravitas and trust — think classic university branding. The amber accent (`hsl(38 92% 50%)`) adds warmth for revenue/payment highlights and creates visual pop against the indigo. The green success and red destructive are functional only, used sparingly for payment badges.

### Background Treatment
The page background is a warm off-white (`hsl(40 33% 97%)`). Cards use pure white to lift off the background. No gradients — the warmth comes from the base tone itself. The subtle contrast between background and cards creates natural depth without shadows on every element.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Mobile uses a single-column vertical flow. The hero utilization gauge dominates the first viewport fold, taking about 40% of screen height. Below it, four compact stat pills sit in a 2x2 grid. Then a full-width chart, followed by the recent registrations list. The primary action button is fixed at the bottom of the screen.

### What Users See (Top to Bottom)

**Header:**
A compact header with the title "Kursverwaltung" in 20px/700 weight on the left. No navigation — this is a single-page dashboard.

**Hero Section (The FIRST thing users see):**
- A semicircular gauge showing aggregate course utilization percentage
- The gauge is rendered as an SVG semicircle arc, 200px wide, using a 6px stroke in `--primary` color with rounded caps
- The background arc uses `--muted` color
- Below the arc, the percentage number in 48px/800 weight
- Below that, the label "Gesamtauslastung" in 13px/400 `--muted-foreground`
- Below that, a subtitle line: "X von Y Plätzen belegt" in 14px/500
- This hero sits inside a card with generous 24px padding
- Why hero: The administrator's #1 question every morning is "how full are my courses?"

**Section 2: Quick Stats (2x2 grid)**
Four compact stat cards in a 2-column grid with 12px gap:
1. **Aktive Kurse** — count of courses where today is between startdatum and enddatum. Icon: `BookOpen`. Display: large number 28px/700, label 12px/500 muted.
2. **Anmeldungen** — total count of all registrations. Icon: `Users`. Same styling.
3. **Umsatz** — sum of preis for all registrations where bezahlt=true, formatted as EUR currency. Icon: `Euro`. Number in `--accent` color (amber).
4. **Offen** — count of registrations where bezahlt=false. Icon: `AlertCircle`. Number in `--destructive` color if > 0.

**Section 3: Anmeldungen pro Kurs (Bar Chart)**
- Horizontal bar chart showing each course's registration count vs. max capacity
- Each bar has two segments: filled (primary color) and remaining (muted)
- Course title as Y-axis label, truncated to 20 chars on mobile
- Chart height adapts to number of courses (min 200px, ~40px per course)
- Title: "Belegung pro Kurs" in 16px/600
- Wrapped in a card

**Section 4: Letzte Anmeldungen (Recent Registrations)**
- A list of the 5 most recent registrations, sorted by anmeldedatum descending
- Each row shows: Participant name (resolved via lookup), course title (resolved via lookup), date formatted as "dd.MM.yyyy", and a bezahlt badge (green "Bezahlt" / red "Offen")
- Rows separated by subtle borders
- Title: "Letzte Anmeldungen" in 16px/600
- Wrapped in a card

**Bottom Fixed Action:**
A full-width button fixed to the bottom of the viewport with 16px margin from edges and 12px from bottom. Background: `--primary`. Text: "Neue Anmeldung" with a Plus icon. Height: 48px. Border-radius: 12px. Shadow: `0 4px 12px hsl(234 62% 46% / 0.3)`.

### Mobile-Specific Adaptations
- The bar chart uses horizontal bars (easier to read on narrow screens)
- Course names truncated with ellipsis at 20 chars
- Stats grid uses 2 columns instead of 4
- Recent registrations show compact rows (name + course on one line, date + badge on second line)
- Bottom padding of 80px on the page to account for the fixed action button

### Touch Targets
- All interactive elements minimum 44px height
- The fixed action button is 48px tall with generous horizontal padding
- List items have 12px vertical padding for comfortable tapping

### Interactive Elements
- Tapping a course bar in the chart could show a tooltip with exact numbers (handled by recharts)
- Tapping a registration row in the list is not interactive (all info already visible)

---

## 5. Desktop Layout

### Overall Structure
A max-width container (1200px) centered on screen. The layout uses a **2-column asymmetric grid**: left column 2fr, right column 1fr, with a 24px gap.

**Row 1: Header bar (full width)**
- Left: "Kursverwaltung" in 28px/700
- Right: "Neue Anmeldung" primary button (not fixed, inline in header)

**Row 2: Hero + Secondary KPIs (full width)**
- Left (2fr): Hero card with the semicircular gauge — same as mobile but gauge is 240px wide, percentage in 56px/800, with more whitespace (32px padding)
- Right (1fr): A vertical stack of 4 stat cards, each compact (icon + number + label in a single row layout). Each card has 16px padding, the number in 24px/700, the label in 13px/500 muted.

**Row 3: Chart + Recent Activity**
- Left (2fr): "Belegung pro Kurs" horizontal bar chart in a card. Bars show filled vs. capacity. Course names on Y-axis, counts on X-axis. Chart height adapts.
- Right (1fr): "Letzte Anmeldungen" card with the 8 most recent registrations. Each entry: participant name, course title, date, payment badge. Clean list with dividers.

**Row 4: Dozenten & Räume overview (full width, 2 equal columns)**
- Left: "Dozenten" card showing a compact list of instructors with their Fachgebiet badge and number of assigned courses
- Right: "Räume" card showing rooms with Gebäude, Kapazität, and number of courses assigned

### Section Layout
- Top area: Header with title + primary action button
- Main content (left): Hero gauge + bar chart (the analytical core)
- Supporting content (right): Stats column + activity feed (contextual info)
- Bottom: Reference data (instructors, rooms) — less urgent but still useful

### What Appears on Hover
- Bar chart bars show a tooltip with exact enrolled/capacity numbers
- Stat cards get a subtle shadow lift (`0 2px 8px hsl(0 0% 0% / 0.06)`)
- Recent registration rows get a light background highlight (`--muted`)
- Dozenten/Räume list items get a light background highlight

### Clickable/Interactive Areas
- No drill-down needed — the dashboard shows all relevant data inline
- The bar chart has native recharts hover tooltips

---

## 6. Components

### Hero KPI
- **Title:** Gesamtauslastung
- **Data source:** Kurse (for max capacity) + Anmeldungen (for actual registrations)
- **Calculation:** (total registrations / sum of all maximale_teilnehmer) * 100, rounded to nearest integer. Count registrations per course, sum up. Sum all maximale_teilnehmer across courses. Divide.
- **Display:** Semicircular SVG gauge (180-degree arc). Foreground arc in `--primary`, background arc in `--muted`. Percentage number centered below arc in 48px/800 (mobile) or 56px/800 (desktop). Label "Gesamtauslastung" below in muted text. Subtitle "X von Y Plätzen belegt" below label.
- **Context shown:** Absolute numbers (X von Y) provide context beyond the percentage
- **Why this is the hero:** The fill rate determines whether courses are viable, whether marketing is needed, or whether new courses should be opened. It's the single most actionable metric.

### Secondary KPIs

**Aktive Kurse**
- Source: Kurse
- Calculation: Count where `startdatum <= today <= enddatum`. If startdatum or enddatum is null, exclude from count.
- Format: integer
- Display: Compact card with `BookOpen` icon (16px, muted), number in 28px/700 (mobile) or 24px/700 (desktop), label "Aktive Kurse" in 12px/500 muted

**Gesamtanmeldungen**
- Source: Anmeldungen
- Calculation: Total count of all registration records
- Format: integer
- Display: Compact card with `Users` icon, same styling as above, label "Anmeldungen"

**Umsatz (bezahlt)**
- Source: Anmeldungen + Kurse
- Calculation: For each Anmeldung where bezahlt=true, resolve the kurs lookup to get preis, then sum all preis values. Format as EUR currency.
- Format: currency EUR (e.g., "12.450 €")
- Display: Compact card with `Euro` icon. Number displayed in `--accent` color (amber) to draw attention to revenue. Label "Umsatz (bezahlt)"

**Offene Zahlungen**
- Source: Anmeldungen
- Calculation: Count of registrations where bezahlt=false or bezahlt is null
- Format: integer
- Display: Compact card with `AlertCircle` icon. Number in `--destructive` color if count > 0, otherwise in default foreground. Label "Offen"

### Chart
- **Type:** Horizontal BarChart — horizontal bars are ideal for comparing course names (text labels) against numeric enrollment. Vertical bars would clip long course names.
- **Title:** "Belegung pro Kurs"
- **What question it answers:** "Which courses are full, which need more students?" — helps the admin prioritize marketing or close registrations.
- **Data source:** Kurse (for titel, maximale_teilnehmer) + Anmeldungen (count per course)
- **X-axis:** Count (number of registrations and capacity)
- **Y-axis:** Course title (kurse.titel, truncated to 20 chars on mobile, 35 on desktop)
- **Bars:** Each course has a stacked bar: filled portion (count of Anmeldungen for this course) in `--primary`, remaining capacity in `--muted`. If a course has no maximale_teilnehmer set, show only the filled bar.
- **Mobile simplification:** Shorter Y-axis labels (20 chars), smaller font (11px). Remove X-axis tick labels, show values at end of bars instead.

### Lists/Tables

**Letzte Anmeldungen**
- Purpose: Shows recent activity so the admin knows what happened today/this week
- Source: Anmeldungen + Teilnehmer (for name) + Kurse (for title)
- Fields shown: Participant full name (vorname + nachname), Course title, Anmeldedatum formatted as "dd.MM.yyyy", Bezahlt status badge
- Mobile style: Compact list — line 1: name + course; line 2: date + badge. 5 items max.
- Desktop style: Clean list with subtle row dividers. Each row: name, course, date, badge inline. 8 items max.
- Sort: By anmeldedatum descending (newest first)
- Limit: 5 on mobile, 8 on desktop

**Dozenten (Desktop only — also shown on mobile)**
- Purpose: Quick reference for instructor assignments
- Source: Dozenten + Kurse (count courses per dozent via applookup)
- Fields shown: Full name (vorname + nachname), Fachgebiet as a muted badge, count of assigned courses
- Style: Compact list rows with name, fachgebiet badge, course count
- Sort: By nachname alphabetically
- Limit: Show all

**Räume (Desktop only — also shown on mobile)**
- Purpose: Room utilization overview
- Source: Räume + Kurse (count courses per raum via applookup)
- Fields shown: Raumname, Gebäude, Kapazität, count of assigned courses
- Style: Compact list rows
- Sort: By raumname alphabetically
- Limit: Show all

### Primary Action Button (REQUIRED!)

- **Label:** "Neue Anmeldung"
- **Action:** add_record
- **Target app:** Anmeldungen
- **What data:** A dialog/modal form with:
  - **Teilnehmer** — Select dropdown populated from Teilnehmer records (show "Vorname Nachname"). Required.
  - **Kurs** — Select dropdown populated from Kurse records (show titel). Required.
  - **Anmeldedatum** — Date input, defaults to today. Required.
  - **Bezahlt** — Checkbox, defaults to false.
  - Submit button: "Anmeldung speichern"
  - On success: close dialog, refresh all data, show success toast
  - On error: show error message in dialog
- **Mobile position:** bottom_fixed — a full-width button pinned to the bottom of the viewport
- **Desktop position:** header — inline in the top header bar, right-aligned
- **Why this action:** Registering participants is the daily bread-and-butter task. Every phone call or email results in creating a registration. One-tap access is essential.

---

## 7. Visual Details

### Border Radius
Rounded (8px) — `--radius: 0.5rem`. Feels approachable without being childish. Cards use `rounded-xl` (12px) for a slightly softer look.

### Shadows
Subtle — cards use `shadow-sm` (`0 1px 2px hsl(0 0% 0% / 0.05)`). On hover, cards lift to `shadow-md` (`0 4px 6px hsl(0 0% 0% / 0.07)`). The fixed mobile action button has a stronger shadow: `0 4px 12px hsl(234 62% 46% / 0.3)`.

### Spacing
Spacious — 24px gap between major sections, 16px padding inside cards, 12px gap between grid items. The hero card gets 32px padding on desktop to breathe. Page has 16px horizontal padding on mobile, 32px on desktop (within the max-width container).

### Animations
- **Page load:** Stagger fade-in. Cards appear with a 50ms stagger delay, fading in from opacity 0 to 1 and translating up 8px over 300ms with ease-out.
- **Hover effects:** Cards lift with shadow transition (200ms ease). Stat numbers can have a brief countUp animation on load (optional, only if simple to implement).
- **Tap feedback:** Buttons use `active:scale-[0.98]` for tactile feel.

---

## 8. CSS Variables (Copy Exactly!)

```css
:root {
  --radius: 0.5rem;
  --background: hsl(40 33% 97%);
  --foreground: hsl(230 25% 18%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(230 25% 18%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(230 25% 18%);
  --primary: hsl(234 62% 46%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(40 20% 94%);
  --secondary-foreground: hsl(230 25% 18%);
  --muted: hsl(40 20% 94%);
  --muted-foreground: hsl(230 10% 48%);
  --accent: hsl(38 92% 50%);
  --accent-foreground: hsl(230 25% 18%);
  --destructive: hsl(0 72% 51%);
  --border: hsl(40 18% 88%);
  --input: hsl(40 18% 88%);
  --ring: hsl(234 62% 46%);
  --chart-1: hsl(234 62% 46%);
  --chart-2: hsl(152 60% 40%);
  --chart-3: hsl(38 92% 50%);
  --chart-4: hsl(280 60% 50%);
  --chart-5: hsl(0 72% 51%);
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded: Plus Jakarta Sans from Google Fonts URL above
- [ ] All CSS variables copied exactly from Section 8
- [ ] Mobile layout matches Section 4 (single column, hero gauge, 2x2 stats, chart, list, fixed button)
- [ ] Desktop layout matches Section 5 (2-column asymmetric, header with action, hero+stats row, chart+activity row, dozenten+räume row)
- [ ] Hero semicircular gauge is prominent and rendered as SVG
- [ ] Colors create the warm academic mood described in Section 2
- [ ] Primary action "Neue Anmeldung" works with dialog form
- [ ] All 5 apps (Dozenten, Räume, Teilnehmer, Kurse, Anmeldungen) are used
- [ ] Payment status badges use green/red coloring
- [ ] Bar chart shows enrollment vs. capacity per course
- [ ] Loading states use Skeleton components
- [ ] Error states show friendly message with retry
- [ ] Empty states show helpful guidance
