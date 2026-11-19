import { useMemo, type CSSProperties } from "react";
import { COMING_UP_DAYS, comingUp, dayLabel } from "../lib/agenda";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";

type ProjectsApi = ReturnType<typeof useProjects>;

interface ComingUpProps {
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "updateProject" | "updateTask">;
}

export default function ComingUp({ projects, today, api }: ComingUpProps) {
  const items = useMemo(() => comingUp(projects, today), [projects, today]);

  return (
    <aside className="panel side-panel" aria-labelledby="coming-up-title">
      <h2 id="coming-up-title" className="panel-title">
        Coming up
      </h2>

      {items.length === 0 ? (
        <p className="muted">
          You're all caught up. Nothing is due in the next {COMING_UP_DAYS} days.
        </p>
      ) : (
        <ul className="coming-list">
          {items.map((item) => {
            const overdue = item.date < today;
            const style = { "--project-color": item.project.color } as CSSProperties;
            const text = item.kind === "deadline" ? item.project.name : item.task.text;
            const hint = item.kind === "deadline" ? "Deadline" : item.project.name;
            return (
              <li
                key={item.kind === "deadline" ? `d-${item.project.id}` : `t-${item.task.id}`}
                className="coming-item"
                data-overdue={overdue || undefined}
                style={style}
              >
                <label className="coming-main">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() =>
                      item.kind === "deadline"
                        ? api.updateProject(item.project.id, { done: true })
                        : api.updateTask(item.project.id, item.task.id, { done: true })
                    }
                    aria-label={
                      item.kind === "deadline"
                        ? `Mark "${item.project.name}" as finished`
                        : `Tick off "${item.task.text}"`
                    }
                  />
                  <span className="calendar-mark" data-kind={item.kind} aria-hidden="true" />
                  <span className="coming-text">
                    <span className="coming-title">{text}</span>
                    <span className="muted coming-hint">{hint}</span>
                  </span>
                </label>
                <span className="coming-date num">{dayLabel(item.date, today)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
