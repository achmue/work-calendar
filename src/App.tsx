import { useCallback, useState } from "react";
import BackupDialog from "./components/BackupDialog";
import CalendarView from "./components/CalendarView";
import ComingUp from "./components/ComingUp";
import Header from "./components/Header";
import ProjectDialog, { type ProjectFormResult } from "./components/ProjectDialog";
import ProjectSidebar from "./components/ProjectSidebar";
import ProjectsView from "./components/ProjectsView";
import SkinEditor from "./components/SkinEditor";
import SkinPicker from "./components/SkinPicker";
import SummaryBar from "./components/SummaryBar";
import TimelineView from "./components/TimelineView";
import { addMonthsISO, monthStartISO } from "./lib/dates";
import { flashLcd } from "./lib/lcdMessage";
import { PROJECT_COLORS } from "./lib/projectColors";
import { useProjects, type ProjectInput } from "./state/useProjects";
import { useSkin } from "./state/useSkin";
import { useSound } from "./state/useSound";
import { useToday } from "./state/useToday";
import type { ISODate, Skin, ViewId } from "./types";

/** Which project dialog is open: a new project (with optional starting values) or an existing one. */
type ProjectDialogState = { mode: "new"; defaults?: Partial<ProjectInput> } | { mode: "edit"; id: string };

export default function App() {
  const skinApi = useSkin();
  const today = useToday();
  const rawApi = useProjects();
  const { projects, saveFailed } = rawApi;
  const { soundOn, toggleSound } = useSound();
  // Every change also flashes a short message on the deck's LCD (shown with the player look).
  const api = {
    ...rawApi,
    addProject: (...args: Parameters<typeof rawApi.addProject>) => {
      flashLcd("NEW TAPE LOADED");
      return rawApi.addProject(...args);
    },
    deleteProject: (...args: Parameters<typeof rawApi.deleteProject>) => {
      flashLcd("TAPE ERASED");
      rawApi.deleteProject(...args);
    },
    updateProject: (...args: Parameters<typeof rawApi.updateProject>) => {
      const [, patch] = args;
      if (patch.done === true) flashLcd("EJECT · TAPE FINISHED");
      else if (patch.done === false) flashLcd("TAPE REOPENED");
      rawApi.updateProject(...args);
    },
    addTask: (...args: Parameters<typeof rawApi.addTask>) => {
      flashLcd("TRACK ADDED");
      return rawApi.addTask(...args);
    },
    updateTask: (...args: Parameters<typeof rawApi.updateTask>) => {
      const [, , patch] = args;
      if (patch.done === true) flashLcd("TRACK DONE ✓");
      else if (patch.done === false) flashLcd("TRACK REOPENED");
      else if (patch.due !== undefined) flashLcd("DATE SET");
      rawApi.updateTask(...args);
    },
    deleteTask: (...args: Parameters<typeof rawApi.deleteTask>) => {
      flashLcd("TRACK ERASED");
      rawApi.deleteTask(...args);
    },
  };
  // "player" skins wear the LCD deck, playlist and cassette project cards.
  const player = skinApi.shownSkin.tokens.chrome === "player";

  const [view, setView] = useState<ViewId>("calendar");
  const [month, setMonth] = useState<ISODate>(() => monthStartISO(today));
  const [openDay, setOpenDay] = useState<ISODate | null>(null);
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [pickingSkin, setPickingSkin] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [editor, setEditor] = useState<{ skin: Skin; isNew: boolean } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearHighlight = useCallback(() => setHighlightId(null), []);

  const editing = dialog?.mode === "edit" ? projects.find((p) => p.id === dialog.id) : undefined;
  const closeDialog = () => setDialog(null);

  function saveProject(result: ProjectFormResult) {
    if (dialog?.mode === "edit") api.updateProject(dialog.id, result);
    else {
      const created = api.addProject(result);
      if (view === "projects") setHighlightId(created.id); // so you see what you just made
    }
    closeDialog();
  }

  // The deck's keys and the mini calendar always act on the Calendar, so they switch to it first.
  const goToMonth = (next: ISODate) => {
    setView("calendar");
    setMonth(next);
  };

  return (
    <div className="app" data-editing={editor ? true : undefined}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header
        view={view}
        onViewChange={setView}
        onOpenSkins={() => setPickingSkin(true)}
        onOpenBackup={() => setBackingUp(true)}
        sound={player ? { on: soundOn, onToggle: toggleSound } : undefined}
        deck={
          player
            ? {
                projects,
                today,
                onPrev: () => goToMonth(addMonthsISO(month, -1)),
                onToday: () => goToMonth(monthStartISO(today)),
                onNext: () => goToMonth(addMonthsISO(month, 1)),
              }
            : undefined
        }
      />
      {saveFailed && (
        <p className="alert" role="alert">
          Your changes couldn't be saved in this browser. Storage may be full or turned off, so
          they will be lost when you close this page.
        </p>
      )}
      <div className="app-body">
        <SummaryBar projects={projects} today={today} player={player} />
        <ProjectSidebar
          projects={projects}
          today={today}
          month={month}
          onMonthChange={setMonth}
          onPickDay={(date) => {
            setView("calendar");
            setMonth(monthStartISO(date));
            setOpenDay(date);
          }}
          onNewProject={() => setDialog({ mode: "new" })}
        />
        <main id="main-content" className="panel main-panel" tabIndex={-1}>
          {view === "projects" && (
            <ProjectsView
              projects={projects}
              today={today}
              api={api}
              player={player}
              highlightId={highlightId}
              onHighlightDone={clearHighlight}
              onNewProject={() => setDialog({ mode: "new" })}
              onEditProject={(id) => setDialog({ mode: "edit", id })}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              projects={projects}
              today={today}
              api={api}
              month={month}
              onMonthChange={setMonth}
              openDay={openDay}
              onOpenDayChange={setOpenDay}
              onNewProject={(deadline) => setDialog({ mode: "new", defaults: { deadline } })}
            />
          )}
          {view === "timeline" && (
            <TimelineView
              projects={projects}
              today={today}
              onOpenProject={(id) => {
                setView("projects");
                setHighlightId(id);
              }}
            />
          )}
        </main>
        <ComingUp projects={projects} today={today} api={api} player={player} />
      </div>

      {pickingSkin && (
        <SkinPicker
          skinApi={skinApi}
          onEdit={(skin, isNew) => {
            setPickingSkin(false);
            setEditor({ skin, isNew });
          }}
          onClose={() => setPickingSkin(false)}
        />
      )}

      {backingUp && (
        <BackupDialog projects={projects} api={api} skinApi={skinApi} onClose={() => setBackingUp(false)} />
      )}

      {editor && (
        <SkinEditor
          key={editor.skin.id}
          initial={editor.skin}
          isNew={editor.isNew}
          skinApi={skinApi}
          onClose={() => setEditor(null)}
        />
      )}

      {dialog && (dialog.mode === "new" || editing) && (
        <ProjectDialog
          project={editing}
          defaults={dialog.mode === "new" ? dialog.defaults : undefined}
          suggestedColor={PROJECT_COLORS[projects.length % PROJECT_COLORS.length] ?? PROJECT_COLORS[0]}
          onSave={saveProject}
          onDelete={
            editing
              ? () => {
                  api.deleteProject(editing.id);
                  closeDialog();
                }
              : undefined
          }
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
