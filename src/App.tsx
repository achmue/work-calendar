import { useCallback, useState } from "react";
import BackupDialog from "./components/BackupDialog";
import CorkLayout from "./components/CorkLayout";
import NewCardDialog from "./components/NewCardDialog";
import ProjectDialog, { type ProjectFormResult } from "./components/ProjectDialog";
import ShortcutsDialog from "./components/ShortcutsDialog";
import SkinEditor from "./components/SkinEditor";
import SkinPicker from "./components/SkinPicker";
import { addMonthsISO, monthStartISO } from "./lib/dates";
import { PAGES, type ViewId } from "./lib/pages";
import { PROJECT_COLORS } from "./lib/projectColors";
import { useProjects, type ProjectInput } from "./state/useProjects";
import { useRoute } from "./state/useRoute";
import { useShortcuts } from "./state/useShortcuts";
import { useSkin } from "./state/useSkin";
import { useSound } from "./state/useSound";
import { useToday } from "./state/useToday";
import type { ISODate, Skin } from "./types";

/** Which project dialog is open: a new project (with optional starting values) or an existing one. */
type ProjectDialogState = { mode: "new"; defaults?: Partial<ProjectInput> } | { mode: "edit"; id: string };

export default function App() {
  const skinApi = useSkin();
  const today = useToday();
  const api = useProjects();
  const { projects, saveFailed } = api;
  const { soundOn, toggleSound } = useSound();

  const [view, setView] = useRoute();
  const [month, setMonth] = useState<ISODate>(() => monthStartISO(today));
  const [openDay, setOpenDay] = useState<ISODate | null>(null);
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [pickingSkin, setPickingSkin] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [helping, setHelping] = useState(false);
  const [editor, setEditor] = useState<{ skin: Skin; isNew: boolean } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearHighlight = useCallback(() => setHighlightId(null), []);

  const editing = dialog?.mode === "edit" ? projects.find((p) => p.id === dialog.id) : undefined;
  const closeDialog = () => setDialog(null);
  const suggestedColor = PROJECT_COLORS[projects.length % PROJECT_COLORS.length] ?? PROJECT_COLORS[0];

  function saveProject(result: ProjectFormResult) {
    if (dialog?.mode === "edit") api.updateProject(dialog.id, result);
    else {
      const created = api.addProject(result);
      if (view === "projects") setHighlightId(created.id); // so you see what you just made
    }
    closeDialog();
  }

  // The month keys act on the wall calendar, so they switch to it first.
  const showMonth = (next: ISODate) => {
    setView("calendar");
    setMonth(next);
  };

  useShortcuts({
    "prev-month": () => showMonth(addMonthsISO(month, -1)),
    "next-month": () => showMonth(addMonthsISO(month, 1)),
    today: () => showMonth(monthStartISO(today)),
    // each page has a number key
    ...(Object.fromEntries(PAGES.map((page) => [page.id, () => setView(page.id)])) as Record<ViewId, () => void>),
    "new-project": () => setDialog({ mode: "new" }),
    help: () => setHelping(true),
  });

  return (
    <>
      <CorkLayout
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
        <NewCardDialog defaults={dialog.defaults} suggestedColor={suggestedColor} onSave={saveProject} onClose={closeDialog} />
      )}

      {dialog?.mode === "edit" && editing && (
        <ProjectDialog
          project={editing}
          suggestedColor={suggestedColor}
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
