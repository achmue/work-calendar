import { useCallback, useEffect, useRef, useState } from "react";
import BackupDialog from "./components/BackupDialog";
import CorkLayout from "./components/CorkLayout";
import NewCardDialog from "./components/NewCardDialog";
import NewTapeDialog from "./components/NewTapeDialog";
import ProjectDialog, { type ProjectFormResult } from "./components/ProjectDialog";
import ShortcutsDialog from "./components/ShortcutsDialog";
import SkinEditor from "./components/SkinEditor";
import SkinPicker from "./components/SkinPicker";
import TapeLayout from "./components/TapeLayout";
import type { TapeTimelineHandle } from "./components/TapeTimeline";
import type { NavigateAction } from "./components/workspace";
import { addDaysISO, addMonthsISO, monthStartISO } from "./lib/dates";
import { flashLcd } from "./lib/lcdMessage";
import type { ShortcutAction } from "./lib/shortcuts";
import { PROJECT_COLORS } from "./lib/projectColors";
import { useProjects, type ProjectInput } from "./state/useProjects";
import { useShortcuts } from "./state/useShortcuts";
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
  const timelineRef = useRef<TapeTimelineHandle>(null);

  // The skin chooses the whole layout; each layout opens on the view it is built around.
  const cork = skinApi.shownSkin.tokens.layout === "cork";
  const [view, setView] = useState<ViewId>(cork ? "calendar" : "timeline");
  const [month, setMonth] = useState<ISODate>(() => monthStartISO(today));
  const [openDay, setOpenDay] = useState<ISODate | null>(null);
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [pickingSkin, setPickingSkin] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [helping, setHelping] = useState(false);
  // A deck key used from the keyboard shows as pressed for a moment
  const [pressed, setPressed] = useState<ShortcutAction | null>(null);
  useEffect(() => {
    if (!pressed) return;
    const timer = window.setTimeout(() => setPressed(null), 180);
    return () => window.clearTimeout(timer);
  }, [pressed]);
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

  // The transport keys and the arrow keys move whatever is showing: the tape (timeline), or the calendar's month.
  // From the Projects view they take you to the calendar first.
  function navigate(action: NavigateAction) {
    const tape = timelineRef.current;
    if (view === "timeline" && tape) {
      const at = tape.focused();
      const target =
        action === "today"
          ? today
          : action === "prev-month"
            ? addMonthsISO(at, -1)
            : action === "next-month"
              ? addMonthsISO(at, 1)
              : addDaysISO(at, action === "week-back" ? -7 : 7);
      tape.seek(target, true);
      return;
    }
    if (action === "week-back" || action === "week-forward") return;
    setView("calendar");
    setMonth(action === "today" ? monthStartISO(today) : addMonthsISO(month, action === "prev-month" ? -1 : 1));
  }

  useShortcuts({
    "prev-month": () => {
      setPressed("prev-month");
      navigate("prev-month");
    },
    "next-month": () => {
      setPressed("next-month");
      navigate("next-month");
    },
    today: () => {
      setPressed("today");
      navigate("today");
    },
    calendar: () => setView("calendar"),
    timeline: () => setView("timeline"),
    projects: () => setView("projects"),
    "new-project": () => setDialog({ mode: "new" }),
    help: () => setHelping(true),
  });

  const Layout = cork ? CorkLayout : TapeLayout;
  const NewDialog = cork ? NewCardDialog : NewTapeDialog;

  return (
    <>
      <Layout
        projects={projects}
        today={today}
        api={api}
        view={view}
        onViewChange={setView}
        month={month}
        onMonthChange={setMonth}
        openDay={openDay}
        onOpenDayChange={setOpenDay}
        highlightId={highlightId}
        onHighlightDone={clearHighlight}
        onNewProject={(defaults) => setDialog({ mode: "new", defaults })}
        onEditProject={(id) => setDialog({ mode: "edit", id })}
        onOpenProject={(id) => {
          setView("projects");
          setHighlightId(id);
        }}
        onOpenSkins={() => setPickingSkin(true)}
        onOpenBackup={() => setBackingUp(true)}
        onOpenHelp={() => setHelping(true)}
        sound={{ on: soundOn, onToggle: toggleSound }}
        pressed={pressed}
        onNavigate={navigate}
        timelineRef={timelineRef}
        saveFailed={saveFailed}
        editing={editor !== null}
      />

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

      {helping && <ShortcutsDialog onClose={() => setHelping(false)} />}

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

      {dialog?.mode === "new" && (
        <NewDialog
          defaults={dialog.defaults}
          suggestedColor={PROJECT_COLORS[projects.length % PROJECT_COLORS.length] ?? PROJECT_COLORS[0]}
          onSave={saveProject}
          onClose={closeDialog}
        />
      )}

      {dialog?.mode === "edit" && editing && (
        <ProjectDialog
          project={editing}
          suggestedColor={PROJECT_COLORS[projects.length % PROJECT_COLORS.length] ?? PROJECT_COLORS[0]}
          onSave={saveProject}
          onDelete={() => {
            api.deleteProject(editing.id);
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
