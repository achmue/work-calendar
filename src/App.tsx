import { useState } from "react";
import Header from "./components/Header";
import { todayISO } from "./lib/dates";
import { getProjectStatus, taskProgress } from "./lib/status";
import { useProjects } from "./state/useProjects";
import { useSkin } from "./state/useSkin";
import type { Project, ViewId } from "./types";

const PLACEHOLDERS: Record<ViewId, { title: string; text: string }> = {
  calendar: {
    title: "Calendar",
    text: "Your month calendar will show up here.",
  },
  timeline: {
    title: "Timeline",
    text: "Your projects will be laid out as bars on a timeline here.",
  },
  projects: {
    title: "Projects",
    text: "You don't have any projects yet.",
  },
};

/** Temporary plain list so the saved data is visible. M3 replaces it with project cards. */
function ProjectList({ projects }: { projects: Project[] }) {
  const today = todayISO();
  return (
    <ul className="project-list">
      {projects.map((project) => {
        const status = getProjectStatus(project, today);
        const { done, total } = taskProgress(project);
        return (
          <li key={project.id}>
            <strong>{project.name}</strong>
            <span className="muted">
              {status.label} · {done} of {total} checklist items done
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function App() {
  useSkin();
  const { projects, saveFailed } = useProjects();
  const [view, setView] = useState<ViewId>("calendar");
  const placeholder = PLACEHOLDERS[view];
  const showProjects = view === "projects" && projects.length > 0;

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
        <main className="panel main-panel" aria-labelledby="view-title">
          <h2 id="view-title" className="panel-title">
            {placeholder.title}
          </h2>
          {showProjects ? (
            <ProjectList projects={projects} />
          ) : (
            <p className="muted">{placeholder.text}</p>
          )}
        </main>
        <aside className="panel side-panel" aria-labelledby="coming-up-title">
          <h2 id="coming-up-title" className="panel-title">
            Coming up
          </h2>
          <p className="muted">
            Deadlines and checklist items due soon will appear here.
          </p>
        </aside>
      </div>
    </div>
  );
}
