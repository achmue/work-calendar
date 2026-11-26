import type { ReactNode } from "react";
import { summarize } from "../lib/agenda";
import { DUE_SOON_DAYS } from "../lib/status";
import type { ViewId } from "../types";
import CalendarView from "./CalendarView";
import { DeckLcd } from "./Deck";
import { DownloadIcon, KeyboardIcon, PaletteIcon, SpeakerIcon, TRANSPORT, TransportIcon } from "./icons";
import Odometer from "./Odometer";
import ProjectsView from "./ProjectsView";
import TapeQueue from "./TapeQueue";
import TapeTimeline from "./TapeTimeline";
import VuMeter from "./VuMeter";
import type { WorkspaceProps } from "./workspace";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "calendar", label: "Calendar" },
  { id: "projects", label: "Projects" },
];

interface KeyProps {
  label: string;
  caption: string;
  path: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  tone?: "play" | "rec";
  title?: string;
}

/** One key of the transport: a chunky cap with its name engraved underneath. */
function Key({ label, caption, path, onClick, disabled, pressed, tone, title }: KeyProps) {
  return (
    <div className="tp-key">
      <button
        type="button"
        className="tp-cap"
        data-tone={tone}
        data-pressed={pressed || undefined}
        aria-label={label}
        title={title ?? label}
        disabled={disabled}
        onClick={onClick}
      >
        <TransportIcon path={path} />
      </button>
      <small aria-hidden="true">{caption}</small>
    </div>
  );
}

/** The tape deck layout: your schedule on a strip of tape, with the controls of a cassette deck. */
export default function TapeLayout(props: WorkspaceProps): ReactNode {
  const {
    projects,
    today,
    api,
    view,
    month,
    openDay,
    sound,
    pressed,
    onNavigate,
    timelineRef,
  } = props;
  const { overdue, dueSoon, tasksDone, tasksTotal } = summarize(projects, today);
  const weeks = view === "timeline";

  return (
    <div className="app tp-app" data-editing={props.editing ? true : undefined}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="tp-deck">
        <span className="tp-screw" data-at="tl" aria-hidden="true" />
        <span className="tp-screw" data-at="tr" aria-hidden="true" />
        <span className="tp-screw" data-at="bl" aria-hidden="true" />
        <span className="tp-screw" data-at="br" aria-hidden="true" />

        {props.saveFailed && (
          <p className="alert" role="alert">
            Your changes couldn't be saved in this browser. Storage may be full or turned off, so they will be lost when
            you close this page.
          </p>
        )}

        <header className="tp-top">
          <DeckLcd projects={projects} today={today} />
          <h1 className="tp-title">
            <b>Work·Cal</b>
            <span>Tape deck · model TD-90</span>
          </h1>
          <nav className="tp-tabs" aria-label="Views">
            {VIEWS.map(({ id, label }) => (
              <button key={id} type="button" className="tp-tab" aria-current={view === id ? "page" : undefined} onClick={() => props.onViewChange(id)}>
                {label}
              </button>
            ))}
          </nav>
          <div className="tp-tools">
            <button type="button" className="tp-tool" title="Skins" data-skins-button onClick={props.onOpenSkins}>
              <PaletteIcon />
              <span className="sr-only">Skins</span>
            </button>
            <button type="button" className="tp-tool" title="Backup" data-backup-button onClick={props.onOpenBackup}>
              <DownloadIcon />
              <span className="sr-only">Backup</span>
            </button>
            <button type="button" className="tp-tool" title="Keyboard shortcuts (?)" data-help-button onClick={props.onOpenHelp}>
              <KeyboardIcon />
              <span className="sr-only">Keyboard shortcuts</span>
            </button>
            <button type="button" className="tp-tool" title="Sound effects" aria-pressed={sound.on} data-sound-button onClick={sound.onToggle}>
              <SpeakerIcon on={sound.on} />
              <span className="sr-only">Sound effects</span>
            </button>
          </div>
        </header>

        <main id="main-content" className="tp-stage" tabIndex={-1}>
          {view === "timeline" && <TapeTimeline ref={timelineRef} projects={projects} today={today} onOpenProject={props.onOpenProject} />}
          {view === "calendar" && (
            <CalendarView
              projects={projects}
              today={today}
              api={api}
              month={month}
              onMonthChange={props.onMonthChange}
              openDay={openDay}
              onOpenDayChange={props.onOpenDayChange}
              onNewProject={(deadline) => props.onNewProject({ deadline })}
            />
          )}
          {view === "projects" && (
            <ProjectsView
              projects={projects}
              today={today}
              api={api}
              player
              highlightId={props.highlightId}
              onHighlightDone={props.onHighlightDone}
              onNewProject={() => props.onNewProject()}
              onEditProject={props.onEditProject}
            />
          )}
        </main>

        <div className="tp-controls">
          <div className="tp-keys" role="group" aria-label="Tape transport">
            <Key label="Previous month" caption="PREV MONTH" path={TRANSPORT.prevMonth} title="Previous month (←)" pressed={pressed === "prev-month"} onClick={() => onNavigate("prev-month")} />
            <Key label="Back one week" caption="REWIND" path={TRANSPORT.rewind} disabled={!weeks} onClick={() => onNavigate("week-back")} />
            <Key label="Go to today" caption="TODAY" path={TRANSPORT.play} tone="play" title="Today (T)" pressed={pressed === "today"} onClick={() => onNavigate("today")} />
            <Key label="Forward one week" caption="FAST FWD" path={TRANSPORT.forward} disabled={!weeks} onClick={() => onNavigate("week-forward")} />
            <Key label="Next month" caption="NEXT MONTH" path={TRANSPORT.nextMonth} title="Next month (→)" pressed={pressed === "next-month"} onClick={() => onNavigate("next-month")} />
            <Key label="New project" caption="NEW PROJECT" path={TRANSPORT.record} tone="rec" title="New project (N)" onClick={() => props.onNewProject()} />
          </div>

          <section className="tp-meters" aria-label="Summary">
            <div className="tp-vu" aria-hidden="true">
              <VuMeter value={dueSoon} />
              <small>DUE SOON</small>
            </div>
            <dl className="tp-counters">
              <div data-tone={overdue > 0 ? "danger" : undefined}>
                <dt>Overdue</dt>
                <dd>
                  <Odometer value={String(overdue)} />
                </dd>
              </div>
              <div>
                <dt>Next {DUE_SOON_DAYS} days</dt>
                <dd>
                  <Odometer value={String(dueSoon)} />
                </dd>
              </div>
              <div>
                <dt>Items done</dt>
                <dd>
                  <Odometer value={`${tasksDone}/${tasksTotal}`} />
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <TapeQueue projects={projects} today={today} api={api} />
      </div>
    </div>
  );
}
