# Work Calendar

A personal work calendar that runs in your browser, drawn as a **cork board**: a wall calendar, project
index cards, "coming up" pegged on a line and a drawer for new projects. You can change its colours and
fonts, and save your own versions.

There's no server yet. Everything is saved in your browser; the log in pages are a front end waiting for
one (see [Logging in](#logging-in)).

> This is the `cork-board` branch. The `master` branch has a different design, a 90s tape deck.

## Try it

You need [Node.js](https://nodejs.org) (version 20.19 or newer).

```bash
npm install      # first time only
npm run dev      # then open http://localhost:5173/
```

Other commands:

```bash
npm run test     # unit tests
npm run build    # type-check and make the production site in dist/
npm run preview  # serve the production build locally
```

## Logging in

You start at the log in page (`/login`, or `/signup` to create an account). **Try the demo** opens the
board with sample projects and no account; the demo keeps its own copy in your browser and throws it away
when you leave. **Log out** is in the **⋯** menu.

> **Accounts aren't connected yet.** This is the front end only: any email and password gets in, and the
> password is never checked, saved or sent. It protects nothing. Your projects are shown to whoever logs in
> on this browser. A real back end (planned: Supabase) replaces the stand-in in
> [src/auth/accounts.ts](src/auth/accounts.ts).

## Pages

| Address | Page |
| --- | --- |
| `/login`, `/signup` | Log in and create account (only while signed out) |
| `/calendar` | The wall calendar beside the cards (also what `/` shows when signed in) |
| `/timeline` | The timeline beside the cards |
| `/projects` | All the project cards |

Back, Forward, bookmarks and "open in new tab" work as on any website. Pop-ups (a day, a new project,
skins, backup) don't have addresses of their own.

### Adding a page

1. Add a line to `PAGES` in [src/lib/pages.ts](src/lib/pages.ts). The `id` is the address:
   `{ id: "notes", label: "Notes" }` gives `/notes`.
2. Say what it shows in [src/pages.tsx](src/pages.tsx): `sheet` is drawn on the paper, and `cards` says
   whether the project cards appear beside it (`false` gives the paper the whole width).

   ```tsx
   notes: { cards: false, sheet: () => <NotesView /> },
   ```

The tab, the address, the browser title, the number key and Back/Forward then work by themselves.
`npm run build` fails if a page has no entry in step 2.

## Using it

- **Calendar**: each running project is a highlighter stroke across the weeks, and its deadline is a
  pushpin. Click (or press Enter on) a day to see what's due, tick things off, add a checklist item, or
  start a project due that day. A red yarn ties a card to its pin; point at another card to move it.
- **Small plans**: a project can be split into parts, each with the date you expect to finish it and its
  own checklist. Press **＋ Small plan** on a card (or add them while creating or editing a project). Tick
  the little flag when a part is finished; it also ticks itself once all its items are done. Finish dates
  show as flags on the calendar and the timeline, and hang on the "coming up" line.
- **Cards**: each project's due date, status, small plans and checklist. Tick the round bullets, write a new item on
  the empty line (press Enter), click a date to change it. Point at a card for **Edit**, **Mark finished**
  and the delete crosses (on touch screens they're always there).
- **Finished folder**: finished projects leave the board for a folder. Click a name to open its card in
  the Projects view, where you can reopen it.
- **Coming up**: overdue things and the next two weeks, as tags on the line. Tick one and it comes off.
  When they don't all fit, the brown "more" tag moves along the line.
- **New project**: open the drawer, write on the card, pick a highlighter colour and the dates.
- **Timeline**: bars from start to deadline, dots for checklist items. Click a bar to open the project.
- **⋯** (top right): backup, keyboard shortcuts and sound effects.
- **Colours and fonts** (the **Skin** label): pick **Cork Board** or **Night Cork**, or press **Change colours
  and fonts**. You can change the board, frame and drawer, paper, ink and marker colours, the four fonts,
  text size, corners, borders, spacing, shadow and board texture, or use your own picture. The page updates
  as you edit, with a readability check. "Follow system light/dark" switches boards with your device.
- **Everything on one screen**: on a laptop or desktop window the page never scrolls. Phones scroll normally.
- **Backup**: download everything (projects and your own boards) as one `.json` file, and restore it later by
  merging or replacing. This is also how your own boards move to another browser. A restored board goes
  through the same strict checks as everything else, so a backup can't carry code.

## Your data

Projects and boards live in this browser's `localStorage`, so they stay on this device and are not sent
anywhere. Clearing site data removes them, so use **Backup** now and then, and to move to another browser
or computer.

The only network request the app makes is to Google Fonts, when a board uses one of its fonts (the built-in
boards do). The system fonts need no request.

## Putting it online (GitHub Pages)

The repo includes a workflow that tests, builds and publishes the site whenever you push to the main branch
(`master`), so it publishes the design on that branch.

1. Create a repository on GitHub and push this project to it.
2. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Push (or run the workflow from the **Actions** tab). When it finishes, the site is at
   `https://<your-username>.github.io/<repository-name>/`.

Netlify, Vercel and similar hosts also work: build command `npm run build`, publish folder `dist`. The site
expects to be at the root of a domain; for a sub-folder, build with `npm run build -- --base=/folder/`
(the GitHub Pages workflow does this for you). The build includes a `404.html` copy of the app, so that
refreshing `/timeline` works on hosts that show that file for addresses they don't know.

## How it's built

Vite, React 18 and TypeScript (strict), plain CSS with custom properties (that's what makes the colours and
fonts changeable), date-fns, and Vitest. See [CLAUDE.md](CLAUDE.md) for the full spec, the decisions made
along the way, and the status.

```
src/
  pages.tsx     what each page shows
  components/   the screens and dialogs
  lib/          pure, tested logic (dates, status, calendar, timeline, skins, backup...)
  state/        hooks: projects, skins, today
  storage/      the only code that touches localStorage
  skins/        the built-in boards
  styles/       the stylesheets (every colour and font is a skin value)
tests/          unit tests
```
