import { useMemo, type CSSProperties } from "react";
import { isProjectDone, sortProjects, taskProgress } from "../lib/status";
import type { Project } from "../types";

interface ProjectSidebarProps {
  projects: Project[];
  onNewProject: () => void;
}

/** The left column (wide screens): your projects at a glance, in their colours, with how many items are left. */
export default function ProjectSidebar({ projects, onNewProject }: ProjectSidebarProps) {
  const sorted = useMemo(() => sortProjects(projects), [projects]);

  return (
    <aside className="sidebar" aria-label="Projects">
      <h2 className="side-heading">Projects</h2>
      {sorted.length === 0 ? (
        <p className="muted side-empty">No projects yet.</p>
      ) : (
        <ul className="side-projects">
          {sorted.map((project) => {
            const { done, total } = taskProgress(project);
            const finished = isProjectDone(project);
            const left = total - done;
            return (
              <li key={project.id} style={{ "--project-color": project.color } as CSSProperties}>
                <span className="side-dot" data-done={finished || undefined} aria-hidden="true" />
                <span className="side-name">{project.name}</span>
                <span className="side-count">{finished ? "Done" : left > 0 ? `${left} left` : ""}</span>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="link-button side-new" onClick={onNewProject}>
        ＋ New project
      </button>
    </aside>
  );
}
