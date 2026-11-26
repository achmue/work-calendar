# Design brief: Work·Cal, a work calendar that feels like 90s hardware

You are a bold, detail-obsessed product designer. I have attached screenshots of my app. **Redesign it and take it much further than it is now.** I like the direction, but I think it can go beyond.

## 1. The app in one paragraph
Work·Cal is a personal work calendar that runs in the browser. One person uses it to plan projects: each project has a deadline and a checklist, and everything shows on a timeline, a month calendar and project pages. The whole look can be changed with "skins", like an old media player.

## 2. My taste
**I like**
- 90s hardware: cassette tapes, tape decks, mp3 mini players, boomboxes, LCD displays, chunky keys.
- The clean, calm readability of Apple Calendar.
- Think out of the box. The structure of the screen should be different, not only the colours.
- Playful details that actually do something (turning reels, a play head, ejecting a tape).
- Seeing everything on one screen.

**I do not like**
- A plain design.
- A typical dashboard (header, stat tiles, sidebar, cards).
- The same calendar shown twice.
- Page scrolling on a laptop or desktop.
- Too many buttons.
- "Coming up" as an ordinary list, or "Add project" as an ordinary button and form.

## 3. What the app does (all of this must stay)
- **Projects:** name, notes, colour, optional start date, required deadline. Add, edit, delete (delete asks to confirm).
- **Checklist:** items with an optional due date. Add (press Enter), tick, change the date, delete. Progress shown as done / total.
- **Status of each project:** Done, Overdue by N days, Due today, Due in N days (within 7), or N days left. A project can also be marked finished and reopened.
- **Timeline view:** a bar from start to deadline for each project, progress on the bar, checklist items as dots on their dates (overdue ones stand out), weekends shaded, a "today" marker. Opens on today. Clicking a project opens it.
- **Calendar view:** month grid, weeks start on Monday, previous / today / next. Each day shows deadlines (diamond) and items due (dot, struck through if done), at most 3, then "+N more". Clicking a day opens it to tick items, add an item, or start a project due that day.
- **Projects view:** one project at a time with its full checklist, and a way to switch between projects.
- **Coming up:** overdue things plus the next 14 days, in date order, each tickable.
- **Summary numbers:** overdue, due in the next 7 days, checklist items done (x/y).
- **Tools:** skin picker and skin editor, backup export/import, keyboard shortcuts, optional sound effects (off by default).

## 4. How it looks now (screenshots)
- `now-1-timeline.png`: a silver tape deck. LCD at the top left (date, clock, scrolling "next up"). In the middle, a dark glass window where the timeline is a strip of recording tape between two reels, passing a fixed "Today" play head. Below: transport keys (previous month, rewind, today, fast forward, next month, record = new project), a VU meter and three LCD counters. At the bottom, "the queue": coming-up items as a rack of standing cassettes you eject to tick off.
- `now-2-calendar.png`: the month calendar inside the same window.
- `now-3-projects.png`: a project as a cassette with its checklist as the track list.
- `now-4-add-project.png`: adding a project = "load a blank tape".
- `now-5-timeline-dark.png`: the dark "Boombox" skin.
- `now-6-phone.png`: the phone layout.
- `idea-tape-deck.png` and `idea-cork-board.png`: two early concepts I chose. Cork Board is not built yet.

## 5. Weak spots to solve
1. **Calendar** is a plain dark grid dropped into the deck. Nothing about it feels like tape or hardware, and most of it is empty.
2. **Projects** looks like an ordinary form list: standard date fields and buttons that do not belong to the deck. The "add item" row is pushed out of view.
3. **Timeline** has a lot of empty tape when there are few projects. Project strips are plain white boxes, and you must hover a dot to learn which task it is.
4. **Materials** are flat compared with the concept images: the silver body could feel much more like a real object.
5. **Composition** feels like stacked rows. There are large gaps in the top bar, the controls row and the queue.
6. **Add project** is half hardware (the cassette) and half ordinary form.
7. **Queue** titles written vertically are hard to read.

## 6. The second look: Cork Board
A skin can switch the whole layout. The second layout should be a different world from the tape deck:
- a tear-off wall calendar with highlighter strips for projects, pushpins on deadlines and today circled in marker;
- projects as pinned index cards with handwritten checklists;
- "coming up" as paper tags on a clothesline;
- add project = pull a blank card from a drawer, pick a highlighter pen for the colour, and pin the dates onto the calendar.

## 7. Rules the design must follow
- **Screen:** main target is a 1920 × 945 browser window. No page scrolling from 800 × 600 up to 2560 × 1300; long lists may scroll inside their own panel. Phones (360 px and wider) may scroll down, never sideways.
- **Buildable in plain HTML, CSS and inline SVG.** No UI libraries, no CSS frameworks, no bitmap images.
- **Every colour comes from a CSS variable**, so a skin can change it. Light and dark versions must both work.
- **Fonts** only from: system fonts, Inter, Nunito, Rajdhani, Space Grotesk, Merriweather, Playfair Display, Orbitron, Share Tech Mono, IBM Plex Mono, VT323, Caveat, Patrick Hand.
- **Accessible:** text contrast at least 4.5:1, visible keyboard focus, click targets at least 24 px, everything usable by keyboard, animations stop when "reduce motion" is on. Do not rely on colour alone. Do not put text directly on a project colour.
- **Original artwork only:** no real brand names, logos or copies of real products.

## 8. Current colours and fonts
| Role | Portable Silver (light) | Boombox (dark) |
|---|---|---|
| Page background | #E3E5E9 | #16171A |
| Panel / body | #FBFAF7 | #202226 |
| Second panel | #E6E9EE | #2B2E33 |
| Text / muted text | #1D1F24 / #5F646C | #EDEDED / #AEB1B8 |
| Border | #C5CAD2 | #3C4047 |
| Accent (record, today) | #B8321F, white text | #FF6A3D, dark text #1A0D08 |
| Danger | #B3261E | #FF7B72 |
| LCD background / text | #B5C79A / #1C2A14 | #241A0A / #FFB84A |

Shared materials: dark glass #0B0C0F to #20242B, ink on glass #ECE7DC, amber #FFB84A, tape brown #4A3A30 to #2C2119, paper #FFFEFA.
Project colours: #1F8A8A, #C2410C, #7C3AED, #2563EB, #BE185D, #15803D, #B45309, #475569.
Fonts now: system sans for text, Caveat for handwritten labels, Share Tech Mono for LCDs and numbers.

## 9. Example data (use it in your mock-ups; today is Thursday 26 November 2026)
- **Website launch** (teal #1F8A8A), 12 Nov to 1 Dec: Draft the page outline (16 Nov, done), Write the copy (22 Nov, done), Get feedback from the team (25 Nov, overdue), Final checks (29 Nov), Publish (1 Dec).
- **Plan the team offsite** (blue #2563EB), 23 Nov to 21 Dec: Pick a date (28 Nov), Book a venue (3 Dec), Send invitations (10 Dec), Plan the agenda (no date).

## 10. What to give me
1. First, **three bolder directions**, each in a few sentences: the big idea, the screen structure, and its best interaction. At least one should be something I have not imagined. Then recommend one and wait for my choice.
2. For the chosen direction, **one self-contained HTML file** (inline CSS and SVG, a little vanilla JavaScript only to switch screens) showing: Timeline, Calendar, Projects, Add project, Coming up, in both a light and a dark skin, at 1920 × 945, plus a phone version.
3. A **list of the CSS variables** you used and what each is for.
4. Short notes on **motion and interactions**: what moves, when, and how long.

Make it surprising, tactile and still easy to read at a glance.
