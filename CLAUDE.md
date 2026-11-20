# CLAUDE.md: Work Calendar (skinnable website)

This file tells the Claude agent what we are building and how to work in this repo.
Read it fully before making changes. Update the "Status" section at the bottom when a milestone is done.

---

## 1. What we are building

A personal work calendar that runs as a website in the browser. The user can:

- Create **projects** with a name, details/notes, colour, start date and deadline.
- Break each project into a **checklist** of items, each with an optional due date, and tick them off.
- See everything in three views: **Calendar** (month grid), **Timeline** (Gantt-style bars), and **Projects** (cards with checklists).
- **Change the whole look with skins**, like the old Winamp media player: pick a built-in skin, edit one in a skin editor, save their own, and export/import skins as files to share.

It's a single-user app. There's no login and no server for v1. Data is saved in the browser.

---

## 2. Tech stack (don't change without asking)

- **Vite + React 18 + TypeScript** (strict mode)
- **Plain CSS with CSS custom properties** for all styling. This is what makes skins work. No Tailwind, no CSS-in-JS, no UI component library.
- **date-fns** for date maths
- **Vitest** for unit tests
- Storage: `localStorage`, accessed only through `src/storage/` so it can be swapped for a backend later
- Package manager: npm

Ask before adding any other dependency.

---

## 3. Commands

```bash
npm install        # first time
npm run dev        # start local dev server
npm run build      # type-check + production build (must pass before you say a task is done)
npm run test       # run unit tests
npm run lint       # if configured
```

---

## 4. Folder structure

```
src/
  main.tsx
  App.tsx
  types.ts                 # Project, Task, Skin types
  storage/
    storage.ts             # load/save projects + skins (localStorage), versioned
  state/
    useProjects.ts         # project CRUD hook
    useSkin.ts             # active skin, apply to :root
  lib/
    dates.ts               # date helpers (pure, tested)
    status.ts              # project status logic (pure, tested)
    skinSchema.ts          # skin validation + defaults (pure, tested)
  skins/
    presets.ts             # built-in skins
  components/
    Header.tsx
    SummaryBar.tsx
    ComingUp.tsx
    CalendarView.tsx
    TimelineView.tsx
    ProjectsView.tsx
    ProjectCard.tsx
    ProjectDialog.tsx
    DayDialog.tsx
    SkinPicker.tsx
    SkinEditor.tsx
  styles/
    base.css               # layout + components, uses ONLY var(--token) values
    reset.css
tests/
```

---

## 5. Data model

```ts
type ISODate = string; // "YYYY-MM-DD", local date, no time

interface Task {
  id: string;
  text: string;
  due: ISODate | "";
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  details: string;
  color: string;        // hex, e.g. "#1F8A8A"
  start: ISODate | "";
  deadline: ISODate;    // required
  done: boolean;        // manual "project finished"
  tasks: Task[];
  createdAt: string;    // ISO timestamp
}
```

Storage keys: `wc.projects.v1`, `wc.skins.v1`, `wc.activeSkin.v1`. Every load must survive missing or corrupt data: validate, fall back to empty, never crash.

---

## 6. Features

### 6.1 Projects & checklists
- Create, edit and delete projects (delete needs a confirm step inside the app, not `window.confirm`).
- Add a checklist item, with an optional due date, from the project card (press Enter to add).
- Tick items done/undone, change an item's due date inline, delete an item.
- Progress bar shows items done out of total.
- **Status label** on each project:
  - Done: manually finished, or every task is done
  - Overdue by N days: deadline has passed
  - Due today / Due in N days: within 7 days
  - N days left: otherwise
- Validation: name and deadline required, start must not be after deadline.

### 6.2 Calendar view
- Month grid, weeks start Monday. Previous / Today / Next buttons.
- Each day shows project deadlines (diamond marker, project colour) and checklist items due that day (dot; struck through if done). Show at most 3, then "+N more".
- Clicking a day opens a dialog: list of that day's items (can tick them), a form to add a new item to a chosen project, and a "New project due this day" button.
- On phones, show only coloured dots in each cell.

### 6.3 Timeline view
- Horizontal, scrollable. Sticky project names on the left.
- One bar per project from start to deadline, with checklist progress shown as a darker fill.
- Task dots at their due dates; overdue undone tasks get a red ring.
- Weekend columns shaded, a vertical "today" line, and it scrolls to today when opened.
- Clicking a bar opens that project in the Projects view.

### 6.4 Summary + Coming up
- Summary bar: overdue count, due in the next 7 days, checklist items done (x/y).
- "Coming up" side panel: deadlines and undone items in the next 14 days (and overdue ones), sorted by date, with checkboxes.

### 6.5 Backup
- Export all data as a `.json` file and import it again (with validation and a choice to replace or merge).

---

## 7. Skin system (the Winamp-style part)

### 7.1 Rule: every visual value is a token
All colours, fonts, radii, borders, shadows and backgrounds in `base.css` must come from CSS variables. **No hard-coded colours anywhere in components or CSS** (except inside skin preset data). Then a skin is just a set of token values applied to `:root`.

### 7.2 Skin format (JSON)
```ts
interface Skin {
  id: string;
  name: string;
  author?: string;
  version: 1;
  tokens: {
    // colours
    bg: string; surface: string; surfaceAlt: string;
    text: string; textMuted: string; border: string;
    accent: string; accentText: string;
    danger: string; warning: string; success: string;
    // type
    fontBody: string; fontDisplay: string; fontMono: string;
    fontSize: string;              // base, e.g. "15px"
    // shape
    radius: string;                // e.g. "10px", "0px" for square retro look
    borderWidth: string;           // e.g. "1px", "2px"
    borderStyle: "solid" | "dashed" | "double" | "outset" | "inset" | "ridge" | "groove";
    shadow: string;                // e.g. "none" or "0 2px 6px rgba(0,0,0,.2)"
    // extras
    bgImage?: string;              // data: URL only, max ~500 KB
    bgPattern?: "none" | "grid" | "dots" | "scanlines";
    density?: "compact" | "comfortable";
  };
}
```

### 7.3 Built-in presets (at least 5)
1. **Clean Light**: calm default, light grey and white with a deep green accent
2. **Clean Dark**: dark version of the same
3. **Retro Player**: inspired by 90s media-player skins: dark gunmetal panels, bevelled `outset` borders, square corners, green-on-black LCD-style mono text for dates and numbers, scanline pattern
4. **Paper Notebook**: off-white, ruled-line pattern, handwriting-style display font
5. **Neon Night**: near-black with bright pink/cyan accents and glow shadows

Don't copy any real product's logo, graphics or name into a skin. "Inspired by" a style is fine.

### 7.4 Skin picker
- Opened from a palette button in the header.
- Shows each skin as a small live preview card (mini calendar using that skin's tokens).
- Click to apply instantly. The choice is remembered.
- Also offers "Follow system light/dark" (switches between two chosen skins).

### 7.5 Skin editor
- "Duplicate & edit" on any skin. Built-ins can't be changed directly.
- Grouped controls: Colours (colour pickers + hex input), Fonts (pick from a list of Google Fonts + system stacks), Shape (radius slider, border width, border style), Effects (shadow presets, background pattern, upload background image).
- **Live preview**: the whole app updates as you edit; Cancel reverts.
- **Contrast check**: warn when text/background contrast is below WCAG AA (4.5:1) for `text` on `bg`, `text` on `surface` and `accentText` on `accent`.
- Save under a new name; rename and delete your own skins.

### 7.6 Share skins
- Export a skin as `<name>.skin.json`.
- Import a `.skin.json` file: validate against the schema, fill missing tokens from defaults, reject anything invalid with a clear message.
- **Security: skins are data only.** Never accept raw CSS or JS from a skin file. Validate every token: colours must parse as colours, lengths must match `^\d+(\.\d+)?(px|rem|em)$`, fonts come from the allowed list, images must be `data:image/(png|jpeg|webp|gif)` URLs. Set tokens with `style.setProperty`, never by building a `<style>` string from user input.

---

## 8. Design & quality rules

- Responsive: works from 360px phone width up to desktop. The side panel stacks under the main view below ~960px.
- Accessible: real buttons and labels, visible focus outline, keyboard works (Esc closes dialogs, Enter on a day opens it), respects `prefers-reduced-motion`.
- Dates: always use local dates (`YYYY-MM-DD`), never `new Date("2026-11-19")` (that's UTC). Use the helpers in `lib/dates.ts`.
- Keep components small; put logic in `lib/` as pure functions with tests.
- Plain, friendly UI text written for the user ("Add a checklist item…", not "Create task entity").

---

## 9. How to work in this repo (agent rules)

1. Work **one milestone at a time** (section 10). Don't start the next one until the current one builds and its tests pass.
2. Before you say a milestone is done: run `npm run build` and `npm run test`, then fix any errors.
3. Make a git commit after each milestone with a clear message, e.g. `feat: calendar month view`.
4. If something in this file is unclear or conflicts, ask me before guessing on anything big.
5. Don't delete or overwrite user data formats without adding a migration in `storage.ts`.
6. Keep this file up to date: tick off milestones in "Status" and note any decisions.

---

## 10. Milestones

- [x] **M1 Setup**: Vite + React + TS project, folder structure, reset/base CSS using tokens, Clean Light skin applied, empty app shell with header + tabs.
- [x] **M2 Data**: types, storage with validation, `useProjects`, date + status helpers with tests, two clearly labelled example projects on first run.
- [x] **M3 Projects view**: project cards, checklist, project create/edit/delete dialog.
- [x] **M4 Calendar view**: month grid, day dialog.
- [x] **M5 Timeline view**
- [x] **M6 Summary + Coming up**
- [x] **M7 Skins (basic)**: token system complete, 5 presets, skin picker, remember choice.
- [x] **M8 Skin editor**: live editing, contrast check, save own skins.
- [x] **M9 Share & backup**: skin export/import, data export/import, validation tests.
- [x] **M10 Polish & deploy**: mobile check, accessibility pass, deploy to GitHub Pages (or Netlify/Vercel). *(Polish done and deployment is set up and tested, but not published yet: it needs a GitHub repository to push to. See the Status notes.)*

---

## Status

- **M1 Setup: done.** Vite + React 18 + TS (strict) project, `reset.css` + token-only `base.css`, Clean Light skin applied to `:root` via `applySkin` (`state/useSkin.ts`), app shell with header and Calendar / Timeline / Projects tabs (placeholders) plus a "Coming up" side panel placeholder. `npm run build` and `npm run test` pass.
  - Decisions: one `tsconfig.json` (build script is `tsc --noEmit && vite build`); no ESLint configured, so there is no `npm run lint` yet; `npm run test` runs `vitest run` (one-shot); `base.css` sets only layout constants (`--space`, `--page-max`, etc.) itself and everything visual comes from skin tokens; a test fails if a hard-coded colour appears in `base.css` or `reset.css`; `Project`/`Task` types come in M2.
- **M2 Data: done.** `Project`/`Task` types; `lib/dates.ts` (local-date helpers, throw on invalid input), `lib/status.ts` (status label + progress), `storage/storage.ts` (projects, user skins, active skin id; validated on load), `state/useProjects.ts` (pure `projectsReducer` + hook that saves on every change), two example projects on first run. 68 tests; `npm run build` passes. Also checked in headless Edge: first-run seeding, reload keeps data, empty list stays empty, corrupt data doesn't crash, 360px has no sideways scroll, no console errors.
  - Decisions:
    - `daysBetween`, `addDaysISO` etc. throw `RangeError` on a bad date. Boundaries (`storage.ts`, and forms in M3) must check with `isISODate` first.
    - A project with no checklist items is **not** "Done" automatically. Only the manual flag or "has items and all ticked" counts.
    - Storage: version lives in the key (`wc.projects.v1`). Missing data gives `null` (first run, seeds the examples); an empty saved list stays empty. Corrupt data, or entries that had to be dropped, copies the original text to `<key>.corrupt` before anything overwrites it. Fixable problems (bad colour, bad task date, duplicate or missing id) are repaired instead of dropped. Only a project with no valid deadline is dropped.
    - `useProjects` shows a warning banner if saving fails (storage full or blocked).
    - IDs use `crypto.randomUUID()` with a fallback, because it doesn't exist on plain `http://` over the local network (e.g. testing on a phone).
    - Small additions to the folder list: `lib/id.ts`, `lib/projectColors.ts` (palette + `isHexColor`), `lib/sampleProjects.ts`.
    - `lib/skinSchema.ts` exists but only does **structural** validation (shape, types, allowed words, size caps, defaults from Clean Light). The strict checks from section 7.6 (colours parse, length pattern, allowed fonts, image data URLs) are still to do in M7-M9. `applySkin` already guards `bgImage` in the meantime.
    - The Projects tab shows a temporary plain list so the saved data is visible. M3 replaces it.
  - Known follow-ups: "today" is read when a component renders, so a tab left open past midnight won't update until something re-renders (handle with a small `useToday` hook when the Calendar/Coming up need it). Two browser tabs open at once each save their own copy (last save wins); fine for single-user v1.
  - (Follow-up resolved in M3: `useToday` refreshes "today" at midnight and when the tab regains focus.)
- **M3 Projects view: done.** `ProjectsView` + `ProjectCard` (status badge, progress bar, checklist with Enter-to-add, inline due-date edit, delete item), `ProjectDialog` (create/edit, validation per 6.1, colour swatches), in-app `ConfirmDialog` for deleting. Dialogs use the native `<dialog>` element (`components/Dialog.tsx`) so Esc, focus trap and inert background come for free. Checked in headless Edge (39 checks: create/edit/delete, validation messages, Esc and backdrop close, nested confirm, persistence, 360px). Found and fixed a real bug that way: React bubbles a nested dialog's `cancel` event to the outer dialog, so Esc on the delete confirmation closed both; `Dialog` now only reacts to its own cancel.
  - Decisions: finished projects sort last; "Mark finished" is hidden when every item is already ticked (it would do nothing); a test fails if a hex/rgb colour appears in any `components/*.tsx`; `ProjectDialog` is opened from `App` (so the Calendar can reuse it in M4).
- **M4 Calendar view: done.** Month grid as a real `<table>` (weeks start Monday), Previous / Today / Next, deadlines as diamonds and dated checklist items as dots in the project colour (struck through when done), at most 3 per day then "+N more", phone shows dots only. Clicking a day (or Enter on it) opens `DayDialog`: items you can tick (a deadline's checkbox finishes the project), an add-item form with a project picker, and "New project due this day" (opens the normal project dialog with the deadline pre-filled). Pure logic is in `lib/calendar.ts` (tested). Calendar is now the default view. Checked in headless Edge (39 checks). Browser check also found that focus wasn't returned to the opener after a dialog closed (React removes the `<dialog>` before the browser can restore it); `Dialog` now restores focus itself.
- **M5 Timeline view: done.** Horizontal scrolling timeline with sticky project names (and sticky month labels), one bar per project from start to deadline (pale track + solid fill for checklist progress, both from the project colour mixed with skin tokens), dots at checklist due dates (red ring = overdue and undone, faded = done), shaded weekends, a "today" line, opens scrolled to today, "Jump to today" button, clicking a bar opens that project in the Projects view and highlights it. Positioning maths is in `lib/timeline.ts` (tested). Checked in headless Edge (29 checks incl. 360px).
  - Decisions: a project with no start date gets its bar from its earliest dated checklist item (else just the deadline day); the range always covers 14 days back and 45 days ahead of today plus every date in the data, with a week of padding; one day column is 28px.
- **M6 Summary + Coming up: done.** `SummaryBar` (overdue / due in the next 7 days / checklist items done x/y) and a `ComingUp` panel (overdue + next 14 days, sorted by date with deadlines before items, checkboxes that tick the item or finish the project). Logic is in `lib/agenda.ts` (tested). Checked in headless Edge (23 checks incl. 360px).
  - Decisions: "overdue" and "due soon" count *things to do* (an unfinished project's deadline plus each unticked dated item), not projects; finished projects and their leftover items are excluded; "due in the next 7 days" is today through today+7; items leave Coming up as soon as they're ticked. A `.readout` class (mono font, accent colour on a recessed panel) is the "LCD numbers" style that skins can lean on.
- **M7 Skins (basic): done.** Five presets (Clean Light, Clean Dark, Retro Player, Paper Notebook, Neon Night) in `skins/presets.ts`; the token system is complete (colours, fonts, radius, border width/style, shadow, density, background pattern and image) and applied via `style.setProperty` (`applySkin` / `skinCssVars` in `state/useSkin.ts`). `SkinPicker` (palette button in the header) shows each skin as a live mini-calendar preview, applies on click and remembers the choice (`wc.activeSkin.v1`), with "Follow system light/dark" (one skin for each mode, switches live). `lib/color.ts` (colour parsing + WCAG contrast) and `lib/fonts.ts` (allowed font list + Google Fonts loader) are new and tested. Checked in headless Edge (44 checks, plus every earlier milestone re-run).
  - Decisions to review:
    - **Added a fifth background pattern, `lines`** (ruled paper), because the spec asks for a "ruled-line pattern" on Paper Notebook but section 7.2 only lists `none | grid | dots | scanlines`. Older files simply fall back to `none`. Easy to undo: use `grid` instead and drop `lines`.
    - Skin choice is stored as `{mode:"fixed",id}` or `{mode:"system",lightId,darkId}` under the same key (a plain id string is still understood). Clicking a skin while following the system sets the skin for the current light/dark mode; unticking "follow" keeps what you're seeing.
    - Fonts: choosing a skin with Google Fonts loads them from fonts.googleapis.com (the picker loads all of them so previews look right). The stylesheet URL is built only from the allowed list in `lib/fonts.ts`, never from skin data. System fonts are always the fallback.
    - "Green-on-black LCD" numbers come from a `.readout` class (mono font, `accent` colour on `surfaceAlt`), so it works in every skin using only the existing tokens. Retro Player gets its look from `surfaceAlt` = near-black and `accent` = LCD green.
    - Bevelled skins (`borderStyle: outset`) draw text fields, readouts and progress bars as `inset` so they look sunken, not raised.
    - `color-scheme` is set from the skin's `bg` so native date pickers and scrollbars match dark skins.
    - Presets are tested for WCAG AA on the three pairs the editor checks, plus muted/danger/warning/success text on both panel colours (Paper Notebook's green was darkened because of this).
- **M8 Skin editor: done.** "Duplicate & edit" on any skin (built-ins can't be changed directly), and Edit / Delete on your own. The editor (`SkinEditor.tsx`) is a docked side panel (a bottom sheet under 960px) so the whole app updates live as you edit; Cancel or Esc puts everything back. Groups: Colours (picker + hex/rgb/hsl box, invalid input is flagged and never applied), Fonts (allowed list, grouped System / Google Fonts, plus text size), Shape (corner roundness, border thickness and style, spacing), Effects (shadow presets incl. an accent-colour glow, background pattern, background picture upload). Contrast check for text/bg, text/panels, accentText/accent against WCAG AA 4.5:1 (warns, doesn't block). Save under a name; renaming = edit + save; delete asks first in-app and falls back to Clean Light. Checked in headless Edge (58 checks); earlier milestones re-run clean.
  - Decisions: the preview works through `useSkin().setPreview`, so nothing is saved until you press Save; background pictures must be PNG/JPEG/WebP/GIF under 500 KB and are re-checked as inline `data:image` URLs (SVG is refused because it can carry script); `lib/files.ts` has the file helpers M9 reuses; Esc is handled at document level while the editor is open (skipped when a dialog is on top) because focus can end up outside the panel; the "Remove picture" button hands focus to the file field before it disappears.
  - Bugs found by the browser check and fixed: Esc stopped working after "Remove it" removed the focused button.
- **M9 Share & backup: done.** Skins: every skin has **Export** (`<name>.skin.json`, plain data only) and the picker has **Import a skin…**. `lib/skinSchema.ts` is now the strict validator from section 7.6 (`checkSkin`): colours must parse (hex/rgb()/hsl()), sizes must match `^\d+(\.\d+)?(px|rem|em)$`, fonts must be exactly an allowed stack, shadows must be well-formed (offsets, blur, colour; up to 4 layers), images must be inline PNG/JPEG/WebP/GIF data URLs, enums must be listed words; unknown fields are ignored; missing tokens come from Clean Light. An import with any invalid value is rejected with a bulleted list of reasons. Data: a **Backup** dialog (header) downloads `work-calendar-backup-<date>.json` (projects + your skins) and restores one with validation and a choice of **Merge** (default) or **Replace** (asks first, in-app, naming what will be lost). Pure logic in `lib/skinFile.ts` and `lib/backup.ts`. 223 unit tests, including attempts to smuggle CSS/script through a skin or backup; 51 browser checks (real file uploads of good and malicious files, downloads, merge/replace, 360px). All earlier browser suites re-run clean.
  - Decisions:
    - An imported skin always gets a fresh id and, if its name is taken, "(imported)" is added, so importing can never overwrite a skin you already have. It's added to the list, not applied; you click it to use it.
    - Merge keeps anything already here untouched (matched by id) and only adds what's new; it never overwrites. Replace swaps everything for the file's contents.
    - A backup entry that can't be read is left out and counted ("3 entries in the file couldn't be read and will be left out") instead of failing the whole restore; a skin in a backup with a built-in skin's id gets a new id. A backup from a newer format version is refused.
    - Skin files are for sharing so they're strict (reject on any invalid value); data we saved ourselves (`storage.ts`) uses the forgiving `sanitizeSkin` (bad values become defaults, never a crash).
    - Header buttons (Skins, Backup) show just their icon on very narrow phones (accessible names kept) so the header stays on one row.
  - Next up: M10 Polish & deploy.
- **M10 Polish & deploy: done, except actually publishing.** An audit script drives the real app in headless Edge across all 5 skins x 3 views at desktop, 360px and 320px and now reports nothing: every control has an accessible name; one `<h1>`, correct landmarks and heading order, no skipped levels; real Tab-key walk shows a visible focus ring at every stop; no sideways scroll at 320px; dialogs fit 320px; `prefers-reduced-motion` stops transitions; every rendered piece of text meets WCAG AA contrast in every skin (the sweep was proven able to catch a planted bad colour). Fixes it led to: a **skip-to-content link** (first Tab stop), a focus ring on **date fields** (the browser only highlights an inner part), **checkbox/radio and timeline-bar tap targets** raised to at least 24px (WCAG 2.2) even in the compact Retro skin, slightly taller controls on touch screens (`pointer: coarse`), a favicon and page description, and a unit test that the accent has 3:1 against page and panels in every preset (focus ring visibility). Deployment: `vite.config.ts` uses `base: "./"` so the site works at a domain root or in a sub-folder; `.github/workflows/deploy.yml` runs the tests, builds and publishes to GitHub Pages on push to `main`/`master`; `README.md` explains running, using and deploying. The production build was served from a strict `/work-calendar/` sub-path server (404 for anything else) and all browser suites plus the audit passed with zero failed requests.
  - To publish (needs you): create a GitHub repository, push this project, then in **Settings > Pages** set **Source: GitHub Actions**. I did not push anything or create a repository.
  - Not done / known limits: no ESLint (would be a new dependency, so left for you to decide); the unit tests don't exercise the React components (the browser audit scripts used for each milestone live outside the repo); web fonts come from Google Fonts only when a skin uses them; two browser tabs open at once each save their own copy (last save wins); there is no per-project export (backup is all-or-nothing).
- **Visual review after M10 (fixes).** The milestone checks were assertion-based and I had only eyeballed a few screenshots, so I reviewed every view, skin, dialog and width (1440, 1280, 1024, 768, 360) by eye and fixed what looked wrong: the **header now lines up with the page content** on wide screens (inner row uses the same max width), page width raised to 88rem, **timeline project names wrap onto two lines** instead of being cut off (wider name column, taller rows and bars; narrower name column on phones), **summary tiles** are one compact row (number + label) on wide screens and stay stacked on phones, and the **file chooser buttons** (backup restore, skin picture) are styled like the other buttons instead of the browser's grey default. All seven browser suites and the accessibility audit re-run clean.
- **Design pass: "Portable Silver" (Apple Calendar layout + 90s player and cassette details).** After a visual review the app felt plain, so it now has a designed look, shown in `design/concepts/` (the idea mock-ups) and `design/built/` (the real thing). Spec changes to review:
  - **New skin settings (data-only, shareable):** `chrome: "plain" | "player"` turns the player look on; optional `lcdBg` / `lcdText` colour the LCD display (they fall back to `surfaceAlt` / `accent`, so every skin gets a sensible display and the old `.readout` look is unchanged). All validated in `lib/skinSchema.ts` (chrome must be a listed word, LCD colours must parse). The skin editor has a **Look** selector, LCD colour fields and an extra LCD contrast check; the picker previews show a mini deck for player skins.
  - **Two new built-in skins:** **Portable Silver** (light) and **Boombox** (dark, amber display). Portable Silver is what someone who has never picked a skin sees; Clean Light is still the fallback for an unknown saved skin. A skin choice is now only saved once the person actually picks one (so the default can change for people who never chose). Anyone who already has Clean Light saved keeps it until they pick another.
  - **For every skin (Apple Calendar style):** bold month + light year, day numbers top right, today as a filled circle, events as tinted pills with a coloured edge (deadlines are a stronger pill with a diamond), a left **sidebar on wide screens (>= 1181px)** listing projects with "N left" and a **mini calendar** (click a day to open it), round tick boxes, thin skin-coloured scrollbars. The calendar's month and open day now live in `App`, so the sidebar and deck can drive them.
  - **Player look (`chrome: "player"`):** the header becomes a silver **deck**: an **LCD** with today's date and a scrolling "now playing" ticker of what's due next; **transport keys** (previous month / today / next month; from another view they switch to the Calendar first); the view tabs as a **segmented control**; an LCD **equaliser** showing how many things are due on each of the next 14 days (overdue is piled onto today); Skins and Backup as round metal knobs; screws and an engraved model name. "Coming up" becomes a **playlist** with a now-playing LCD and numbered tracks. Each project is a **cassette**: the reels show progress (tape winds from the left reel to the right), the 3-digit counter is percent done, the LED is the status (green / amber / red from the skin's own colours), the label is in the skin's display font and the checklist is the track list (A1, A2...). With room, the cassette sits left and its track list right; on phones they stack. The ticker stops under `prefers-reduced-motion`.
  - Implementation notes: new `styles/design.css` (token-only, covered by the no-hard-coded-colours test), `components/Deck.tsx`, `Cassette.tsx`, `ProjectSidebar.tsx`, `lib/cassetteArt.ts`. The physical colours of the tape drawing (paper, tape, plastic) live in `lib/cassetteArt.ts` as data, like project colours. Text never sits on an arbitrary project colour (that failed contrast for mid-tones): deadline pills use the normal text colour, the cassette label stripe is the project colour darkened to 45% (white text passes 4.5:1 for any colour, tested), and the LED label sits on a dark plate.
  - Checked: 256 unit tests; browser suites M3-M11 (the older ones run against Clean Light; M10/M11 are new and cover the deck, keys, ticker, equaliser, sidebar, playlist, cassettes, Boombox, plain-skin fallback, tablet and phone layouts, reduced motion, editing/saving/sharing player skins); the accessibility audit now covers all 7 skins and reports nothing. The audit also caught the mid-tone contrast problem above before it shipped.
  - Not done: optional click sounds, more skins (boombox-style variants, a translucent blue plastic one, a Winamp-style stack of windows), hiding projects from the calendar via the sidebar dots.
- **Everything on one screen (no page scrolling on laptops and desktops).** On windows at least 961px wide and 600px tall the app is exactly one window tall: the deck, summary, sidebar, the calendar and the "Coming up" panel are all visible at once, and `html`/`body` don't scroll. The calendar is now a CSS grid (with `role="table"` / `row` / `columnheader` / `cell`, so it's still a proper table for screen readers) whose week rows share the available height; each day measures its real room and shows as many events as fit (never more than 3, per 6.2) then "+N more" (a very tight day shows only "+N more"). On windows shorter than 820px the deck and day cells get slimmer. Long lists scroll **inside their own panel** (playlist, sidebar, project list, timeline), never the page. The **Projects view shows one project at a time** in this mode, with a row of chips (name + done/total) to switch; clicking a timeline bar or creating a project selects that project. Phones, tablets under 961px and very short windows (< 600px tall) keep the normal scrolling page and the full list of project cards. The same breakpoint lives in two places that must stay in step: `FIT_QUERY` in `state/useMediaQuery.ts` and the media query at the end of `styles/design.css`.
  - Verified with a script that tries 7 window sizes (1920x1080 down to 1024x600) x 3 skins x 3 views = 63 combinations: the page never scrolls. A 37-check browser suite (`m12`) covers: equal week rows, no event clipped in a day cell at four window sizes, the switcher (incl. 17 projects), the other skins, phone/short-window fallbacks, dialogs and the editor. All other suites and the accessibility audit re-run clean (the project-list checks in M3/M6/M10 were adjusted for the switcher).
  - Bugs found while doing it: a visually hidden heading inside a scrolling list still stretched the page (absolutely positioned elements aren't clipped by an ancestor that isn't positioned: the scrolling containers are now `position: relative`); a grid column grew to the widest unbreakable text and pushed the playlist's dates out of view (`grid-template-columns: minmax(0, 1fr)`).
