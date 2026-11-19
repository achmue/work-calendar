import { useId, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { buildDayIndex, itemsOn } from "../lib/calendar";
import { formatLong } from "../lib/dates";
import { getProjectStatus, isProjectDone, isTaskOverdue, taskProgress } from "../lib/status";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import Dialog from "./Dialog";

type ProjectsApi = ReturnType<typeof useProjects>;

interface DayDialogProps {
  date: ISODate;
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "addTask" | "updateTask" | "updateProject">;
  onNewProject: () => void;
  onClose: () => void;
}

export default function DayDialog({ date, projects, today, api, onNewProject, onClose }: DayDialogProps) {
  const ids = useId();
  const items = useMemo(() => itemsOn(buildDayIndex(projects), date), [projects, date]);

  const [text, setText] = useState("");
  const [chosenId, setChosenId] = useState("");
  // Fall back to the first unfinished project if nothing valid is chosen.
  const projectId =
    projects.find((p) => p.id === chosenId)?.id ??
    projects.find((p) => !isProjectDone(p))?.id ??
    projects[0]?.id ??
    "";

  function addItem(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed === "" || projectId === "") return;
    api.addTask(projectId, { text: trimmed, due: date });
    setText("");
  }

  return (
    <Dialog title={formatLong(date)} onClose={onClose}>
      {items.length === 0 ? (
        <p className="muted">Nothing is due on this day.</p>
      ) : (
        <ul className="day-items">
          {items.map((item) => {
            const style = { "--project-color": item.project.color } as CSSProperties;
            if (item.kind === "deadline") {
              const { project } = item;
              const status = getProjectStatus(project, today);
              const { done, total } = taskProgress(project);
              const doneByTasks = total > 0 && done === total;
              return (
                <li key={`d-${project.id}`} className="day-item" style={style}>
                  <label className="task-main">
                    <input
                      type="checkbox"
                      checked={isProjectDone(project)}
                      disabled={doneByTasks}
                      onChange={(e) => api.updateProject(project.id, { done: e.target.checked })}
                    />
                    <span className="calendar-mark" data-kind="deadline" aria-hidden="true" />
                    <span>
                      <strong>{project.name}</strong>
                      <span className="muted"> · deadline</span>
                    </span>
                  </label>
                  <span className="badge" data-kind={status.kind}>
                    {status.label}
                  </span>
                </li>
              );
            }
            const { project, task } = item;
            return (
              <li
                key={`t-${task.id}`}
                className="day-item task"
                style={style}
                data-done={task.done || undefined}
                data-overdue={isTaskOverdue(task, today) || undefined}
              >
                <label className="task-main">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => api.updateTask(project.id, task.id, { done: e.target.checked })}
                  />
                  <span className="calendar-mark" data-kind="task" aria-hidden="true" />
                  <span className="task-text">{task.text}</span>
                </label>
                <span className="muted">{project.name}</span>
              </li>
            );
          })}
        </ul>
      )}

      {projects.length > 0 ? (
        <form className="day-add" onSubmit={addItem}>
          <h3 className="day-subtitle">Add a checklist item for this day</h3>
          <div className="field">
            <label htmlFor={`${ids}-project`}>Project</label>
            <select id={`${ids}-project`} value={projectId} onChange={(e) => setChosenId(e.target.value)}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="task-add day-add-row">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a checklist item…"
              aria-label="Checklist item"
              maxLength={200}
              data-autofocus
            />
            <button type="submit" className="btn btn-primary" disabled={text.trim() === ""}>
              Add
            </button>
          </div>
        </form>
      ) : (
        <p className="muted">Create a project to start adding checklist items.</p>
      )}

      <div className="dialog-actions">
        <button type="button" className="btn" onClick={onNewProject}>
          New project due this day
        </button>
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Dialog>
  );
}
