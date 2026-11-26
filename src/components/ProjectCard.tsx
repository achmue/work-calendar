import { useId, useState, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import { formatISO, formatMedium, formatShort } from "../lib/dates";
import { getProjectStatus, isTaskOverdue, taskProgress } from "../lib/status";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project, Task } from "../types";

type ProjectsApi = ReturnType<typeof useProjects>;

interface ProjectCardProps {
  project: Project;
  today: ISODate;
  highlighted: boolean;
  /** Also write the notes and the start date on the card (there's room in the Projects view). */
  showDetails: boolean;
  api: Pick<ProjectsApi, "updateProject" | "addTask" | "updateTask" | "deleteTask">;
  onEdit: () => void;
}

/** Clicking the short date opens the browser's date picker. */
function openPicker(event: MouseEvent<HTMLInputElement>) {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    // Some browsers refuse; the field can still be typed into.
  }
}

function TaskRow({
  task,
  today,
  onChange,
  onDelete,
}: {
  task: Task;
  today: ISODate;
  onChange: (patch: Partial<Pick<Task, "done" | "due">>) => void;
  onDelete: () => void;
}) {
  const overdue = isTaskOverdue(task, today);
  const thisYear = task.due.slice(0, 4) === today.slice(0, 4);
  return (
    <li className="task" data-done={task.done || undefined} data-overdue={overdue || undefined}>
      <label className="task-main">
        <input type="checkbox" checked={task.done} onChange={(e) => onChange({ done: e.target.checked })} />
        <span className="task-text">{task.text}</span>
      </label>
      <button type="button" className="task-delete" onClick={onDelete} aria-label={`Delete "${task.text}"`}>
        ✕
      </button>
      <span className="task-date" data-empty={task.due === "" || undefined}>
        <span className="task-date-text" aria-hidden="true">
          {task.due === "" ? "date" : thisYear ? formatShort(task.due) : formatMedium(task.due)}
        </span>
        <input
          type="date"
          className="task-due"
          value={task.due}
          onClick={openPicker}
          onChange={(e) => onChange({ due: e.target.value })}
          aria-label={`Due date for "${task.text}"`}
        />
      </span>
    </li>
  );
}

/** A project as an index card taped to the board. */
export default function ProjectCard({ project, today, highlighted, showDetails, api, onEdit }: ProjectCardProps) {
  const headingId = useId();
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const status = getProjectStatus(project, today);
  const { done, total } = taskProgress(project);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  // Every item ticked already counts as done, so a manual "finished" button would do nothing.
  const doneByTasks = total > 0 && done === total;

  function addTask(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed === "") return;
    api.addTask(project.id, { text: trimmed, due });
    setText("");
    setDue("");
  }

  return (
    <article
      id={`project-${project.id}`}
      className="project-card"
      style={{ "--project-color": project.color } as CSSProperties}
      data-highlight={highlighted || undefined}
      data-status={status.kind}
      aria-labelledby={headingId}
    >
      <header className="project-card-header">
        <div className="project-card-title">
          <h3 id={headingId}>{project.name}</h3>
        </div>
      </header>

      <p className="card-meta">
        {/* a late card needs the room for its status, so it drops the day of the week */}
        <span>Due {formatISO(project.deadline, status.kind === "overdue" ? "d MMM" : "EEE d MMM")}</span>
        <span className="badge" data-kind={status.kind}>
          {status.label}
        </span>
      </p>

      {showDetails && project.start !== "" && (
        <p className="card-dates">
          Started {formatShort(project.start)}, due {formatMedium(project.deadline)}
        </p>
      )}
      {showDetails && project.details.trim() !== "" && <p className="project-details">{project.details}</p>}

      {project.tasks.length > 0 && (
        <ul className="tasks">
          {project.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              onChange={(patch) => api.updateTask(project.id, task.id, patch)}
              onDelete={() => api.deleteTask(project.id, task.id)}
            />
          ))}
        </ul>
      )}

      <form className="task-add" onSubmit={addTask} data-filled={text.trim() !== "" || due !== "" || undefined}>
        <span className="task-add-mark" aria-hidden="true" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a checklist item…"
          aria-label={`Add a checklist item to ${project.name}`}
          maxLength={200}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date (optional)" />
        <button type="submit" className="btn" disabled={text.trim() === ""}>
          Add
        </button>
      </form>

      <div className="progress-row">
        <div
          className="progress"
          role="progressbar"
          aria-label="Checklist progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${total} items done`}
        >
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="progress-count" aria-hidden="true">
          {done}/{total}
        </span>
      </div>

      <footer className="project-card-actions">
        <button type="button" className="btn" onClick={onEdit}>
          Edit
        </button>
        {!doneByTasks && (
          <button type="button" className="btn" onClick={() => api.updateProject(project.id, { done: !project.done })}>
            {project.done ? "Reopen" : "Mark finished"}
          </button>
        )}
      </footer>

      {status.kind === "overdue" && (
        <span className="ck-stamp" aria-hidden="true">
          Overdue<small>Not finished</small>
        </span>
      )}
    </article>
  );
}
