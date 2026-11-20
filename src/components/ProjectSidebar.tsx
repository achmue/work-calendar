import { useMemo, type CSSProperties } from "react";
import { buildDayIndex, itemsOn, monthGrid } from "../lib/calendar";
import { addMonthsISO, formatISO, formatLong } from "../lib/dates";
import { isProjectDone, sortProjects, taskProgress } from "../lib/status";
import type { ISODate, Project } from "../types";

interface ProjectSidebarProps {
  projects: Project[];
  today: ISODate;
  month: ISODate;
  onMonthChange: (month: ISODate) => void;
  /** Open that day on the Calendar. */
  onPickDay: (date: ISODate) => void;
  onNewProject: () => void;
}

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

/** The left column (wide screens): your projects at a glance, and a mini calendar to jump around. */
export default function ProjectSidebar({
  projects,
  today,
  month,
  onMonthChange,
  onPickDay,
  onNewProject,
}: ProjectSidebarProps) {
  const sorted = useMemo(() => sortProjects(projects), [projects]);
  const index = useMemo(() => buildDayIndex(projects), [projects]);
  const weeks = useMemo(() => monthGrid(month), [month]);

  return (
    <aside className="sidebar" aria-label="Projects and mini calendar">
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

      <div className="mini" role="group" aria-label="Mini calendar">
        <div className="mini-head">
          <span>
            <strong>{formatISO(month, "MMMM")}</strong> <span className="calendar-year">{formatISO(month, "yyyy")}</span>
          </span>
          <span className="mini-nav">
            <button type="button" aria-label="Previous month in mini calendar" onClick={() => onMonthChange(addMonthsISO(month, -1))}>
              ‹
            </button>
            <button type="button" aria-label="Next month in mini calendar" onClick={() => onMonthChange(addMonthsISO(month, 1))}>
              ›
            </button>
          </span>
        </div>
        <table className="mini-grid">
          <thead>
            <tr>
              {LETTERS.map((letter, i) => (
                <th key={i} scope="col" aria-hidden="true">
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((date) => (
                  <td key={date}>
                    <button
                      type="button"
                      className="mini-day"
                      data-today={date === today || undefined}
                      data-outside={date.slice(0, 7) !== month.slice(0, 7) || undefined}
                      data-has={itemsOn(index, date).length > 0 || undefined}
                      aria-label={formatLong(date)}
                      onClick={() => onPickDay(date)}
                    >
                      {Number(date.slice(8))}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </aside>
  );
}
