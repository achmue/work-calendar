import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { summarize } from "../lib/agenda";
import { PAGES, isPlainClick, pagePath } from "../lib/pages";
import { DUE_SOON_DAYS, boardOrder, isProjectDone } from "../lib/status";
import { PAGE_CONTENT } from "../pages";
import { useMasonry } from "../state/useMasonry";
import { BASE } from "../state/useRoute";
import Clothesline from "./Clothesline";
import FinishedFolder from "./FinishedFolder";
import ProjectCard from "./ProjectCard";
import RedYarn from "./RedYarn";
import ToolMenu from "./ToolMenu";
import type { WorkspaceProps } from "./workspace";

/** The wire rings along the top of the paper, and the index cards peeking out of the drawer. */
const RINGS = 20;
const DRAWER_TABS = 6;

/**
 * The cork board layout: a sheet of paper (the wall calendar, the timeline...) beside a board of pinned
 * index cards, with "coming up" pegged on a line and a drawer for new cards. What each page shows is set
 * in src/pages.tsx; a page without a sheet (Projects) gives the cards the whole wall.
 */
export default function CorkLayout(props: WorkspaceProps): ReactNode {
  const { projects, today, api, view, month, sound, highlightId, onHighlightDone } = props;
  const { overdue, dueSoon, tasksDone, tasksTotal } = summarize(projects, today);
  const sorted = useMemo(() => boardOrder(projects, today), [projects, today]);
  const areaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  useMasonry(cardsRef);

  // A project clicked on the timeline: bring its card into view and mark it for a moment.
  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`project-${highlightId}`)?.scrollIntoView({ block: "nearest" });
    const timer = window.setTimeout(onHighlightDone, 2500);
    return () => window.clearTimeout(timer);
  }, [highlightId, onHighlightDone]);

  const page = PAGE_CONTENT[view];
  // With no sheet of paper the cards take the whole wall, and are the main part of the page.
  const wide = !page.sheet;
  const layout = wide ? "cards" : page.cards ? "split" : "paper";
  const Board = wide ? "main" : "section";
  // Beside the calendar, finished projects wait in a folder. The Projects view shows every card.
  const cards = wide ? sorted : sorted.filter((p) => !isProjectDone(p));
  const finished = wide ? [] : sorted.filter((p) => isProjectDone(p));

  return (
    <div className="app ck-app" data-editing={props.editing ? true : undefined}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="ck-bar">
        <h1 className="ck-plate">Work·Cal</h1>
        {/* real links, so a page can be bookmarked or opened in a new tab */}
        <nav className="ck-tabs" aria-label="Pages">
          {PAGES.map(({ id, label }) => (
            <a
              key={id}
              className="ck-tab"
              href={pagePath(id, BASE)}
              aria-current={view === id ? "page" : undefined}
              onClick={(event) => {
                if (!isPlainClick(event)) return;
                event.preventDefault();
                props.onViewChange(id);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <dl className="ck-labels" aria-label="Summary">
          <div data-tone={overdue > 0 ? "danger" : undefined}>
            <dt>Overdue</dt>
            <dd>{overdue}</dd>
          </div>
          <div>
            <dt>Next {DUE_SOON_DAYS} days</dt>
            <dd>{dueSoon}</dd>
          </div>
          <div>
            <dt>Done</dt>
            <dd>
              {tasksDone}/{tasksTotal}
            </dd>
          </div>
        </dl>
        <div className="ck-tools">
          <button type="button" className="ck-sticker ck-skin" title="Change the board's colours and fonts" data-skins-button onClick={props.onOpenSkins}>
            Skin
            <span className="ck-chips" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </button>
          <ToolMenu onOpenBackup={props.onOpenBackup} onOpenHelp={props.onOpenHelp} sound={sound} />
        </div>
      </header>

      {props.saveFailed && (
        <p className="alert" role="alert">
          Your changes couldn't be saved in this browser. Storage may be full or turned off, so they will be lost when you
          close this page.
        </p>
      )}

      <div className="ck-body" data-layout={layout} ref={areaRef}>
        {page.sheet && (
          <main id="main-content" className="ck-sheet" tabIndex={-1}>
            <div className="ck-rings" aria-hidden="true">
              {Array.from({ length: RINGS }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            {page.sheet(props)}
            <span className="ck-curl" aria-hidden="true" />
          </main>
        )}

        {page.cards && (
          <Board className="ck-board" {...(wide ? { id: "main-content", tabIndex: -1 } : { "aria-label": "Project cards" })}>
            <div className="ck-cards" ref={cardsRef}>
              {projects.length === 0 && <p className="ck-blank">The board is empty. Open the drawer below to pin up your first project.</p>}
              {cards.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  today={today}
                  api={api}
                  showDetails={wide}
                  highlighted={project.id === highlightId}
                  onEdit={() => props.onEditProject(project.id)}
                />
              ))}
              {finished.length > 0 && (
                <FinishedFolder projects={finished} onOpen={props.onOpenProject} onShowAll={() => props.onViewChange("projects")} />
              )}
            </div>

            <Clothesline projects={projects} today={today} api={api} />

            <button type="button" className="ck-drawer" onClick={() => props.onNewProject()}>
              <span className="ck-drawer-cards" aria-hidden="true">
                {sorted.filter((p) => !isProjectDone(p)).slice(0, DRAWER_TABS).map((p) => (
                  <i key={p.id} style={{ "--project-color": p.color } as CSSProperties} />
                ))}
              </span>
              <span className="ck-drawer-plate">＋ New project</span>
              <span className="ck-drawer-pull" aria-hidden="true" />
            </button>
          </Board>
        )}

        {view === "calendar" && <RedYarn areaRef={areaRef} projects={projects} today={today} month={month} />}
      </div>
    </div>
  );
}
