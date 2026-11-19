import { useCallback, useState } from "react";
import CalendarView from "./components/CalendarView";
import ComingUp from "./components/ComingUp";
import Header from "./components/Header";
import ProjectDialog, { type ProjectFormResult } from "./components/ProjectDialog";
import ProjectsView from "./components/ProjectsView";
import SummaryBar from "./components/SummaryBar";
import TimelineView from "./components/TimelineView";
import { PROJECT_COLORS } from "./lib/projectColors";
import { useProjects, type ProjectInput } from "./state/useProjects";
import { useSkin } from "./state/useSkin";
import { useToday } from "./state/useToday";
import type { ViewId } from "./types";

/** Which project dialog is open: a new project (with optional starting values) or an existing one. */
type ProjectDialogState = { mode: "new"; defaults?: Partial<ProjectInput> } | { mode: "edit"; id: string };

export default function App() {
  useSkin();
  const today = useToday();
  const api = useProjects();
  const { projects, saveFailed } = api;

  const [view, setView] = useState<ViewId>("calendar");
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const clearHighlight = useCallback(() => setHighlightId(null), []);

  const editing = dialog?.mode === "edit" ? projects.find((p) => p.id === dialog.id) : undefined;
  const closeDialog = () => setDialog(null);

  function saveProject(result: ProjectFormResult) {
    if (dialog?.mode === "edit") api.updateProject(dialog.id, result);
    else api.addProject(result);
    closeDialog();
  }

  return (
    <div className="app">
      <Header view={view} onViewChange={setView} />
      {saveFailed && (
        <p className="alert" role="alert">
          Your changes couldn't be saved in this browser. Storage may be full or turned off, so
          they will be lost when you close this page.
        </p>
      )}
      <div className="app-body">
        <SummaryBar projects={projects} today={today} />
        <main className="panel main-panel">
          {view === "projects" && (
            <ProjectsView
              projects={projects}
              today={today}
              api={api}
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
        <ComingUp projects={projects} today={today} api={api} />
      </div>

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
