import { useCallback, useState } from "react";
import Header from "./components/Header";
import ProjectDialog, { type ProjectFormResult } from "./components/ProjectDialog";
import ProjectsView from "./components/ProjectsView";
import { PROJECT_COLORS } from "./lib/projectColors";
import { useProjects, type ProjectInput } from "./state/useProjects";
import { useSkin } from "./state/useSkin";
import { useToday } from "./state/useToday";
import type { ViewId } from "./types";

/** Which project dialog is open: a new project (with optional starting values) or an existing one. */
type ProjectDialogState = { mode: "new"; defaults?: Partial<ProjectInput> } | { mode: "edit"; id: string };

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="view">
      <h2 className="panel-title">{title}</h2>
      <p className="muted">{text}</p>
    </section>
  );
}

export default function App() {
  useSkin();
  const today = useToday();
  const api = useProjects();
  const { projects, saveFailed } = api;

  const [view, setView] = useState<ViewId>("projects");
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
            <Placeholder title="Calendar" text="Your month calendar will show up here." />
          )}
          {view === "timeline" && (
            <Placeholder
              title="Timeline"
              text="Your projects will be laid out as bars on a timeline here."
            />
          )}
        </main>
        <aside className="panel side-panel" aria-labelledby="coming-up-title">
          <h2 id="coming-up-title" className="panel-title">
            Coming up
          </h2>
          <p className="muted">Deadlines and checklist items due soon will appear here.</p>
        </aside>
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
