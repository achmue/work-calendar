import { useEffect, useMemo, useState } from "react";
import { sortProjects, taskProgress } from "../lib/status";
import { FIT_QUERY, useMediaQuery } from "../state/useMediaQuery";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import type { CSSProperties } from "react";
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

  // When everything has to fit on one screen, show one project at a time with a row of buttons to switch.
  const fit = useMediaQuery(FIT_QUERY);
  const [picked, setPicked] = useState<string | null>(null);
  const switcher = fit && sorted.length > 1;
  const known = (id: string | null) => (id !== null && sorted.some((p) => p.id === id) ? id : null);
  const selectedId = known(highlightId) ?? known(picked) ?? sorted[0]?.id ?? null;
  const visible = switcher ? sorted.filter((p) => p.id === selectedId) : sorted;

  // Remember the project on show, so it stays selected when the list re-orders
  // (a finished project sinks to the bottom) instead of the view jumping to another one.
  useEffect(() => {
    if (known(picked) === null && sorted[0]) setPicked(sorted[0].id);
  }, [picked, sorted]);

  useEffect(() => {
    if (!highlightId) return;
    setPicked(highlightId);
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

      {switcher && (
        <nav className="project-switcher" aria-label="Choose a project">
          {sorted.map((project) => {
            const { done, total } = taskProgress(project);
            return (
              <button
                key={project.id}
                type="button"
                className="project-chip"
                aria-current={project.id === selectedId ? "true" : undefined}
                style={{ "--project-color": project.color } as CSSProperties}
                onClick={() => setPicked(project.id)}
              >
                <span className="chip-name">{project.name}</span>
                <span className="chip-count num">
                  {done}/{total}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {sorted.length === 0 ? (
        <p className="muted empty">
          You don't have any projects yet. Add your first one to get started.
        </p>
      ) : (
        <div className="project-list">
          {visible.map((project) => (
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
