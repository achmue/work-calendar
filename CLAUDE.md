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
- [ ] **M5 Timeline view**
- [ ] **M6 Summary + Coming up**
- [ ] **M7 Skins (basic)**: token system complete, 5 presets, skin picker, remember choice.
- [ ] **M8 Skin editor**: live editing, contrast check, save own skins.
- [ ] **M9 Share & backup**: skin export/import, data export/import, validation tests.
- [ ] **M10 Polish & deploy**: mobile check, accessibility pass, deploy to GitHub Pages (or Netlify/Vercel).

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
  - Next up: M5 Timeline view.
