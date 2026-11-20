# Work Calendar

A personal work calendar that runs in your browser. Make projects with deadlines, break them into
checklists, and see everything as a month **Calendar**, a **Timeline**, or **Project** cards. Then change the
whole look with **skins**, like the old Winamp media player: pick one, edit it, save your own, and share
skins as files.

There's no login and no server. Everything is saved in your browser.

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

- **Projects**: name, notes, colour, optional start date and a deadline. Add checklist items (press Enter),
  tick them off, change their dates inline.
- **Everything on one screen**: on a laptop or desktop window the page never scrolls; the calendar stretches to fit, and the Projects view shows one project at a time with buttons to switch. (Phones scroll normally.)
- **Calendar**: click (or press Enter on) a day to see what's due, tick things off, add a checklist item,
  or start a project due that day.
- **Timeline**: bars from start to deadline, dots for checklist items, a line for today. Click a bar to open
  the project.
- **Summary and Coming up**: what's overdue, what's due this week, and the next two weeks at a glance.
- **Skins** (palette knob): two built-in looks, each shown as a live preview. **Portable Silver** (the default) and **Boombox** wear the "player" look: an LCD display with a scrolling "now playing" line, transport keys that move the calendar, an equaliser of how busy the next two weeks are, a playlist for what's coming up, and every project drawn as a cassette whose reels show your progress (and really spin: faster when it's overdue). The LCD flashes what you just did, a needle meter swings with how much is due soon, and finishing a project ejects its cassette. There are optional sound effects too (a speaker switch among the knobs, off by default). Everything stops moving if your device is set to reduce motion. "Duplicate & edit" opens the
  skin editor, where the whole app updates as you change colours, fonts, shape, shadow, pattern and
  background picture, with a contrast check. "Follow system light/dark" switches skins with your device.
- **Backup**: download everything (projects and your own skins) as one `.json` file, and restore it later
  by merging or replacing. This is also how your own skins move to another browser. A restored skin goes through the
  same strict checks as everything else, so a backup can't carry code.

## Your data

Projects and skins live in this browser's `localStorage`, so they stay on this device and are not sent
anywhere. Clearing site data removes them, so use **Backup** now and then, and to move to another browser
or computer.

The only network request the app makes is to Google Fonts, when a skin uses one of its fonts (for example
Portable Silver). The system fonts need no request.

## Putting it online (GitHub Pages)

The repo includes a workflow that tests, builds and publishes the site whenever you push to the main branch.

1. Create a repository on GitHub and push this project to it.
2. In the repository, open **Settings > Pages** and set **Source** to **GitHub Actions**.
3. Push (or run the workflow from the **Actions** tab). When it finishes, the site is at
   `https://<your-username>.github.io/<repository-name>/`.

Netlify, Vercel and similar hosts also work: build command `npm run build`, publish folder `dist`. The site
uses relative paths, so it works at the root of a domain or inside a sub-folder.

## How it's built

Vite, React 18 and TypeScript (strict), plain CSS with custom properties (that's what makes skins work),
date-fns, and Vitest. See [CLAUDE.md](CLAUDE.md) for the full spec, the decisions made along the way, and
the milestone status.

```
src/
  components/   the screens and dialogs
  lib/          pure, tested logic (dates, status, calendar, timeline, skins, backup...)
  state/        hooks: projects, skins, today
  storage/      the only code that touches localStorage
  skins/        the built-in skins
  styles/       reset.css and base.css (every visual value is a skin token)
tests/          unit tests
```
