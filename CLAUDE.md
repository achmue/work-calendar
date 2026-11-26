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
- **Hardware behaviour for the player look (the "gimmicks").** Because the player look was mostly paint, it now behaves like the hardware it imitates. All of it is skin-gated (`chrome: "player"`), respects `prefers-reduced-motion`, and uses only skin tokens for colour:
  - **Reels spin** on every cassette: 6s a turn when on track, 3s when due soon, **1.2s when overdue**, stopped when finished, and fast on hover.
  - **Insert and eject:** a cassette slides in when it's shown (including when you switch project); **"⏏ Mark finished" ejects it** (slides out), and only then is the project marked finished.
  - **Analogue VU meter** in the "due in the next 7 days" summary tile: the needle springs from rest to the count (0 to 10, straight up at 5, pegged at 10).
  - **Mechanical counters:** the three summary numbers are digit wheels that roll to their value (plain text is kept for screen readers).
  - **The LCD** powers on with a sweep, blinks `▶ PLAY`, and **flashes short messages** for what you just did (TRACK DONE ✓, TRACK ADDED, NEW TAPE LOADED, EJECT · TAPE FINISHED...) with `REC` shown; the message is also announced to screen readers (`role="status"`). `lib/lcdMessage.ts` is the small channel; `App` wraps the project actions to send the messages.
  - **Optional sound effects**, **off by default**, behind a speaker switch among the knobs (remembered in the new key `wc.sound.v1`). They are synthesised with the browser's audio engine (no sound files): a heavier click for the deck keys, a light click for buttons, a tick for tick boxes, a clunk for eject. Sounds only ever play after a click, and the switch is lit when on.
  - **Stickers:** "HI-FI STEREO / AUTO REVERSE / NOISE REDUCTION" badges on the deck, "STEREO · NOISE REDUCTION" on every cassette label. (Generic wording: no real brand names or logos.)
  - Bugs found by the browser suite: the tick sound was silent for items that vanish when ticked, because React removes the item during the click so the later `change` event never reached the listener; checkboxes are now handled on `click`. The summary digits also sat too low until the wheel height was matched to the readout's line height.
  - Checked: 267 unit tests (needle maths, LCD message timing and replacement, sound engine never throws without audio); a 35-check browser suite (`m13`, with a stand-in audio engine to see whether sounds are made) covering the animations and their speeds per status, eject, LCD messages and their timeout, needle angles, counters, the sound switch (off by default, remembered, silent when off), plain skins getting none of it, and **no endless animation running under reduced motion**. Every other suite, the accessibility audit and the 63-combination "page never scrolls" matrix still pass.
- **Rewind, keyboard shortcuts and a day-progress bar (player look and plain).**
  - **Rewind:** reopening a finished cassette no longer just flips a flag: the reels spin backwards fast (0.3s a turn) for about 0.9s, the LCD shows `◀◀ REWIND`, there's a whirring sound if sound is on, and only then is the project reopened (no wait under reduced motion).
  - **Keyboard shortcuts** (`lib/shortcuts.ts`, `state/useShortcuts.ts`): `←` `→` previous/next month, `T` today, `1` `2` `3` Calendar/Timeline/Projects, `N` new project, `?` the shortcut list. Month keys switch to the Calendar first. They never fire while typing in a field, in a dialog, the timeline scroller or the skin editor, and never with Ctrl/Alt/Cmd held (browser shortcuts stay theirs). A deck key used this way looks pressed for a moment; the keys' tooltips name their shortcut; a keyboard button among the knobs opens the list.
  - **Day progress:** the LCD shows a clock (`WEEK 47 · 13:00`) and a thin bar along its bottom edge that fills across the working day, 9:00 to 17:00 (`lib/dayProgress.ts`; fixed hours, easy to make a setting later).
  - Bug found: finishing the project on show made the Projects view jump to another project (the finished one sinks to the bottom of the sort order); the selection is now remembered. Layout: with a fourth knob the deck wrapped on 1440px windows, so the LCD and knobs are slightly smaller and the equaliser hides on windows up to 1400px wide.
  - Checked: 277 unit tests; browser suites M3-M14 (M14 has 36 checks: shortcuts incl. the cases that must NOT fire, help, sound with shortcuts, plain skins, rewind and its reduced-motion path, the bar at 07:15 / 11:00 / 13:00 / 17:30 using a faked clock, laptop and phone); accessibility audit clean; the page-never-scrolls matrix still passes.
- **Simplified skins (decided by the owner): two skins, one menu per card, no skin files.** After seeing the designed look, the owner asked for exactly this, which **changes the original spec**:
  - **7.3 (at least 5 presets):** only **Portable Silver** (light, the first-run default and the fallback) and **Boombox** (dark) are offered. Clean Light, Clean Dark, Retro Player, Paper Notebook and Neon Night were removed. Their options live on in the skin editor (patterns, bevelled borders, fonts...) so someone can still make that kind of skin. `cleanLight` stays in `skins/presets.ts` only as the plain base that fills in any value a skin leaves out; it is not a choice. "Follow system light/dark" now defaults to Portable Silver (light) and Boombox (dark).
  - **7.4 / 7.5:** each skin card has a single **⋯ menu** (`components/SkinMenu.tsx`): a built-in offers "Duplicate & edit"; one of your own offers Edit, Duplicate & edit and Delete (delete still confirms in the app). Esc closes just the menu.
  - **7.6 (share skins as `.skin.json` files) and the skin half of 9 "Share & backup": removed.** No import or export of skin files. Your own skins still travel inside **Backup** (projects + your skins), and a skin restored from a backup is still validated by the same strict `checkSkin` (colours parse, lengths match, fonts from the list, images inline raster, no CSS or script). `lib/skinFile.ts` was deleted; `formatProblems` moved to `lib/problems.ts`.
  - Anyone with an old saved choice that names a removed skin (or a follow-system pair that uses one) simply gets Portable Silver. Skins people made themselves are untouched.
  - Checked: 244 unit tests; a new 39-check browser suite for the picker, menus (including that Esc closes only the menu), follow-system, editing / cancelling / saving / renaming / deleting your own skin, old and corrupt saved data, and a phone; the older suites (calendar, projects, timeline, summary, backup, player look, fit-to-window, gimmicks, shortcuts) still pass with the plain skin supplied as a user-made skin; accessibility audit and the page-never-scrolls matrix re-run.
- **Removed the duplicate (mini) calendar.** The sidebar's mini calendar showed the same month as the big one beside it, so it was redundant (I'd added it for the Apple Calendar look). Gone: its component code, styles, and the tests that covered it. The sidebar is now just the project list (colour, name, "N left") and "New project", on a narrower column so the calendar gets the width. The sidebar itself is optional: it is a colour key for the calendar and a shortcut to make a project; say if you'd rather remove it too. The Previous / Today / Next buttons are still not duplicated: on wide screens the deck's keys do that job and the calendar's own buttons are hidden; on narrow screens the calendar's buttons show instead. (The small calendars in the *skin preview* cards are previews of a skin, not part of the app's layout, and stay.) Also: on short windows the day number and event pills are slightly smaller so a day with two events shows both instead of only "+2 more".
- **New layout: the tape deck (owner picked concepts A and B; A is built).** The dashboard look is gone, which **changes the original spec**:
  - **A skin now chooses a layout** (`layout: "tape" | "cork"`, validated like any other skin value; it replaces `chrome`). Portable Silver and Boombox are the light and dark Tape Deck. **Cork Board (concept B) is not built yet**; until it is, a skin that asks for `cork` shows the tape deck.
  - **Removed:** the header bar, summary tiles, project sidebar and "Coming up" playlist.
  - **Tape deck:** the timeline is a strip of tape winding past a fixed play head (`TapeTimeline`, overlapping projects get their own row via `lib/lanes.ts`); the transport keys wind it by a week or a month (or change the calendar's month); "Coming up" is **the queue**, a rack of cassettes you eject to tick off; **adding a project loads a blank tape** (`NewTapeDialog`; editing still uses `ProjectDialog`); Calendar and Projects show inside the deck's dark window. Material colours (glass, tape, metal, cork) are data in `lib/materials.ts`; styles are in `styles/tape.css`.
  - **Fits the window** from 720x480 upwards (was 961x600) and fills it, with no maximum width. It steps down in stages: under 821px tall the queue cassettes lie flat; under 641px keys and display slim down; under 1200px wide the title and meter go. The size is written in `FIT_QUERY`, `design.css` and `tape.css`: keep them in step. Smaller windows and phones scroll normally.
  - Checked: 252 unit tests; a 58-check browser suite for the tape layout (`m16`); a size check of 15 windows from 640x800 to 2560x1300 on all three views (no page scroll and nothing cut off from 800x600 up).
  - Still to do: build Cork Board; re-run the accessibility and contrast audit on the new layout; the older browser suites (M3-M15) still look for the old controls; unused styles from the old layout remain in `base.css` and `design.css`; README.
- **Branch `cork-board`: the Cork Board layout (concept B).** The owner likes it more than the tape deck for now and wants the tape deck kept. `master` has the tape deck only; this branch has both, with **Cork Board the first-run, fallback and "follow system: light" skin** (Boombox stays the dark one).
  - `CorkLayout`: label-maker summary, wall calendar or paper timeline on the left, index cards on a board, "coming up" on a `Clothesline`, a drawer for new projects; the Projects view gives the board the whole wall. `NewCardDialog` adds a project (highlighter pens, date stamps); the form logic is shared with the blank tape in `state/useProjectForm.ts`.
  - The calendar can draw each project's run as highlighter strokes (`CalendarView showSpans`, `lib/weekSpans.ts`, two rows at most).
  - "Special Elite" (typewriter) was added to the allowed fonts. Styles are in `styles/cork.css`.
  - Not as in the concept picture: no dragging pins onto the calendar while adding (date fields instead), no red yarn, no folder of finished projects (they sort last on the board).
  - Checked: 268 unit tests; browser suites for the cork board (`m17`, 28 checks) and the tape deck (`m16`, 58 checks); no page scroll from 800x600 to 2560x1300 on all three views. Not yet done: accessibility and contrast audit.
- **`cork-board` is now cork only (owner's request).** This **changes the original spec** on this branch; the tape deck stays on `master`.
  - Removed here: the tape deck layout, its components, styles and tests, Portable Silver and Boombox, the `layout`, `lcdBg` and `lcdText` skin values, and unused styles from the old dashboard. The notes above about those apply to `master` only. Old saved skins and choices still load: removed values are ignored, and an unknown choice falls back to Cork Board.
  - Skins are now colour-and-font versions of the board. Built in: **Cork Board** (default) and **Night Cork** (dark). `bg` is the board colour, the new optional `frame` is the frame and drawer, `bgPattern` gained `cork`. The skin picker has a "Change colours and fonts" button; the editor offers only settings that change the board. The contrast check covers ink on both papers, faded ink, and text on the marker.
  - Extra fonts allowed: Courier Prime, Kalam, Indie Flower, Bebas Neue.
  - The window size at which everything fits (720x480) is in `design.css` and `cork.css`: keep them in step.
  - Checked: 232 unit tests; browser suite `m18` (41 checks, including that each colour and font setting changes the board); no page scroll from 800x600 to 2560x1300. Not yet done: full accessibility and contrast audit.
- **One style for everything (`styles/kit.css`, on `cork-board`).** The owner found some elements didn't match the board. Rule for anything new: it is made of the board's stationery. Buttons are paper labels (red marker for the main action, rubber stamp for delete); fields are lines you write on (handwriting for words, typewriter for dates and choices); tick boxes are hand-drawn with a marker tick; status badges are stamps; progress and timeline bars are highlighter strokes; timeline items are pins; pop-ups are cards taped over the board; the skin editor is a notepad with label-tape section names; focus inside pop-ups is a dashed pencil outline; the top-right buttons are brass like the nameplate. The timeline rows fill their sheet.
  - Checked: 233 unit tests, `m18` (41 checks), window sizes, every screen and pop-up viewed on both built-in boards at 1440x820, pop-ups fit a 360px phone. Not yet done: full accessibility and contrast audit.
- **Matched to the concept picture (`cork-board`).** The owner asked for the app to look like
  `design/gemini/idea-cork-board.png`; `design/built/cork-board-with-mockup-data.png` is the app showing that
  picture's data. Built: screwed brass plate, uppercase paper tabs, label tape, a "Skin" label with colour
  chips, wire rings, page curl, tall month lettering with a handwritten year and week note, pushpin deadlines,
  compact two-column index cards, the red yarn (follows the card you point at), the finished-projects folder, a
  sagging clothesline with a "more" tag, and index cards peeking from the drawer. Decisions to review:
  - **New optional skin value `fontHeading`** (allowed fonts only; "Headings" in the editor; Bebas Neue if left
    out). The built-in boards also use Inter for small labels now, and slightly different colours.
  - The whole board **scales with the window** (the mock-up is 1440x900 at 15px; see "Fitting the window" in
    `cork.css`). The skin's text size shifts it up or down.
  - Cards are ordered **coming up first, then overdue** (`boardOrder`), dealt into columns by `useMasonry`.
    Finished projects are in the folder except in the Projects view.
  - **Edit, Mark finished and delete crosses show on hover or keyboard focus** (always on touch screens).
  - Backup, keyboard shortcuts and sound moved into a **"⋯" menu**. Month buttons are arrows.
  - A calendar deadline is a pushpin; it's written out only if its project has no stroke that week.
  - Kept from the spec, so unlike the picture: status wording ("Overdue by 8 days"), an "add item" line on
    every card, and a small done count by each progress bar.
  - Still not built: dragging pins onto the calendar while adding a project.
  - Checked: 249 unit tests; browser suite `m18` (54 checks); no page scroll from 800x600 to 2560x1300;
    pop-ups fit a 360px phone. Not done: full accessibility and contrast audit.
