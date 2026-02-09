# Memory Notes

## Project: Kursverwaltung Dashboard
- App group: Course Management (Kurse, Raeume, Dozenten, Anmeldungen, Teilnehmer)
- 5 apps with full CRUD, React Router navigation
- Uses Living Apps REST API with session cookies

## Key Learnings

### Build Issues
- `react-router-dom` was listed in package.json but not installed - needed `npm install`
- sonner.tsx component had `next-themes` import that doesn't exist in this project - replaced with hardcoded "light" theme
- Vite build uses path aliases (`@/`) that tsc CLI doesn't resolve; use `npm run build` for validation

### API Rules (Critical)
- Dates: `date/date` = `YYYY-MM-DD`, `date/datetimeminute` = `YYYY-MM-DDTHH:MM` (NO seconds)
- applookup fields: ALWAYS use `extractRecordId()`, never manual URL parsing
- API returns objects not arrays: use `Object.entries()` to get record_id from keys
- SelectItem value="" causes runtime errors - use "none" sentinel value

### Design Skill
- Font must NOT be Inter, Roboto, Open Sans, Lato, Arial, Helvetica, system-ui
- Colors must be complete `hsl()` functions, not raw values
- CSS uses Tailwind v4 with `@theme inline` block mapping CSS vars to Tailwind tokens
- Light mode only (no .dark class on html)

### Patterns
- CRUD dialogs: single component for create+edit (null record = create, record = edit)
- Delete always needs AlertDialog confirmation
- Toast via `sonner` directly (`import { toast } from 'sonner'`)
- Data refresh: call refreshData() after any mutation
- Type imports: must use `import type { ... }` for TypeScript verbatimModuleSyntax
