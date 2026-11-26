import { useEffect, useMemo, type ReactNode } from "react";
import { summarize } from "../lib/agenda";
import { DUE_SOON_DAYS, sortProjects } from "../lib/status";
import type { ViewId } from "../types";
import CalendarView from "./CalendarView";
import Clothesline from "./Clothesline";
import { DownloadIcon, KeyboardIcon, PaletteIcon, SpeakerIcon } from "./icons";
import ProjectCard from "./ProjectCard";
import TimelineView from "./TimelineView";
import type { WorkspaceProps } from "./workspace";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "projects", label: "Projects" },
];

/**
 * The cork board layout: a wall calendar (or a paper timeline) beside a board of pinned index cards,
 * with "coming up" pegged on a line and a drawer for new cards. The Projects view gives the board the whole wall.
 */
export default function CorkLayout(props: WorkspaceProps): ReactNode {
  const { projects, today, api, view, month, openDay, sound, highlightId, onHighlightDone } = props;
  const { overdue, dueSoon, tasksDone, tasksTotal } = summarize(projects, today);
  const cards = useMemo(() => sortProjects(projects), [projects]);

  // A project clicked on the timeline: bring its card into view and mark it for a moment.
  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`project-${highlightId}`)?.scrollIntoView({ block: "nearest" });
    const timer = window.setTimeout(onHighlightDone, 2500);
    return () => window.clearTimeout(timer);
  }, [highlightId, onHighlightDone]);

  const wide = view === "projects";
  const Board = wide ? "main" : "section";

  return (
    <div className="app ck-app" data-editing={props.editing ? true : undefined}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="ck-bar">
        <h1 className="ck-plate">Work·Cal</h1>
        <nav className="ck-tabs" aria-label="Views">
          {VIEWS.map(({ id, label }) => (
            <button key={id} type="button" className="ck-tab" aria-current={view === id ? "page" : undefined} onClick={() => props.onViewChange(id)}>
              {label}
            </button>
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
            <dt>Items done</dt>
            <dd>
              {tasksDone}/{tasksTotal}
            </dd>
          </div>
        </dl>
        <div className="ck-tools">
          <button type="button" className="ck-tool" title="Skins" data-skins-button onClick={props.onOpenSkins}>
            <PaletteIcon />
            <span className="sr-only">Skins</span>
          </button>
          <button type="button" className="ck-tool" title="Backup" data-backup-button onClick={props.onOpenBackup}>
            <DownloadIcon />
            <span className="sr-only">Backup</span>
          </button>
          <button type="button" className="ck-tool" title="Keyboard shortcuts (?)" data-help-button onClick={props.onOpenHelp}>
            <KeyboardIcon />
            <span className="sr-only">Keyboard shortcuts</span>
          </button>
          <button type="button" className="ck-tool" title="Sound effects" aria-pressed={sound.on} data-sound-button onClick={sound.onToggle}>
            <SpeakerIcon on={sound.on} />
            <span className="sr-only">Sound effects</span>
          </button>
        </div>
      </header>

      {props.saveFailed && (
        <p className="alert" role="alert">
          Your changes couldn't be saved in this browser. Storage may be full or turned off, so they will be lost when you
          close this page.
        </p>
      )}

      <div className="ck-body" data-view={view}>
        {!wide && (
          <main id="main-content" className="ck-sheet" tabIndex={-1}>
            {view === "calendar" ? (
              <CalendarView
                projects={projects}
                today={today}
                api={api}
                month={month}
                onMonthChange={props.onMonthChange}
                openDay={openDay}
                onOpenDayChange={props.onOpenDayChange}
                onNewProject={(deadline) => props.onNewProject({ deadline })}
                showSpans
              />
            ) : (
              <TimelineView projects={projects} today={today} onOpenProject={props.onOpenProject} />
            )}
          </main>
        )}

        <Board className="ck-board" {...(wide ? { id: "main-content", tabIndex: -1 } : { "aria-label": "Project cards" })}>
          <div className="ck-cards">
            {cards.length === 0 && <p className="ck-blank">The board is empty. Open the drawer below to pin up your first project.</p>}
            {cards.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                today={today}
                api={api}
                highlighted={project.id === highlightId}
                onEdit={() => props.onEditProject(project.id)}
              />
            ))}
          </div>

          <Clothesline projects={projects} today={today} api={api} />

          <button type="button" className="ck-drawer" onClick={() => props.onNewProject()}>
            <span className="ck-drawer-plate">＋ New project</span>
            <span className="ck-drawer-pull" aria-hidden="true" />
          </button>
        </Board>
      </div>
    </div>
  );
}
