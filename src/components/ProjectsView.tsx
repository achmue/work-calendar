import { useEffect, useMemo } from "react";
import { sortProjects } from "../lib/status";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import ProjectCard from "./ProjectCard";

type ProjectsApi = ReturnType<typeof useProjects>;

interface ProjectsViewProps {
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "updateProject" | "addTask" | "updateTask" | "deleteTask">;
  /** A project to scroll to and briefly highlight (e.g. clicked on the timeline). */
  highlightId: string | null;
  player?: boolean;
  onHighlightDone: () => void;
  onNewProject: () => void;
  onEditProject: (id: string) => void;
}

export default function ProjectsView({
  projects,
  today,
  api,
  highlightId,
  player = false,
  onHighlightDone,
  onNewProject,
  onEditProject,
}: ProjectsViewProps) {
  const sorted = useMemo(() => sortProjects(projects), [projects]);

  useEffect(() => {
    if (!highlightId) return;
    document.getElementById(`project-${highlightId}`)?.scrollIntoView({ block: "center" });
    const timer = window.setTimeout(onHighlightDone, 2500);
    return () => window.clearTimeout(timer);
  }, [highlightId, onHighlightDone]);

  return (
    <section className="view" aria-labelledby="projects-title">
      <div className="view-toolbar">
        <h2 id="projects-title" className="panel-title">
          Projects
        </h2>
        <button type="button" className="btn btn-primary" onClick={onNewProject}>
          New project
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="muted empty">
          You don't have any projects yet. Add your first one to get started.
        </p>
      ) : (
        <div className="project-list">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              today={today}
              highlighted={project.id === highlightId}
              player={player}
              api={api}
              onEdit={() => onEditProject(project.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
