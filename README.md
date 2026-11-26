# Work Calendar

A personal work calendar that runs in your browser, drawn as a **cork board**: a wall calendar, project
index cards, "coming up" pegged on a line and a drawer for new projects. You can change its colours and
fonts, and save your own versions.

There's no login and no server. Everything is saved in your browser.

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

## Using it

- **Calendar**: each running project is a highlighter stroke across the weeks, and its deadline is a
  pushpin. Click (or press Enter on) a day to see what's due, tick things off, add a checklist item, or
  start a project due that day. A red yarn ties a card to its pin; point at another card to move it.
- **Cards**: each project's due date, status and checklist. Tick the round bullets, write a new item on
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
uses relative paths, so it works at the root of a domain or inside a sub-folder.

## How it's built

Vite, React 18 and TypeScript (strict), plain CSS with custom properties (that's what makes the colours and
fonts changeable), date-fns, and Vitest. See [CLAUDE.md](CLAUDE.md) for the full spec, the decisions made
along the way, and the status.

```
src/
  components/   the screens and dialogs
  lib/          pure, tested logic (dates, status, calendar, timeline, skins, backup...)
  state/        hooks: projects, skins, today
  storage/      the only code that touches localStorage
  skins/        the built-in boards
  styles/       the stylesheets (every colour and font is a skin value)
tests/          unit tests
```
