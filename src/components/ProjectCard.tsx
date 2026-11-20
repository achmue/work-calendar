import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { sfx } from "../lib/sfx";
import { formatMedium, formatShort } from "../lib/dates";
import { getProjectStatus, isTaskOverdue, taskProgress } from "../lib/status";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project, Task } from "../types";
import Cassette from "./Cassette";

type ProjectsApi = ReturnType<typeof useProjects>;

interface ProjectCardProps {
  project: Project;
  today: ISODate;
  highlighted: boolean;
  /** Draw the project as a cassette (skins with the player look). */
  player?: boolean;
  api: Pick<ProjectsApi, "updateProject" | "addTask" | "updateTask" | "deleteTask">;
  onEdit: () => void;
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
  return (
    <li className="task" data-done={task.done || undefined} data-overdue={overdue || undefined}>
      <label className="task-main">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(e) => onChange({ done: e.target.checked })}
        />
        <span className="task-text">{task.text}</span>
      </label>
      <input
        type="date"
        className="task-due"
        value={task.due}
        onChange={(e) => onChange({ due: e.target.value })}
        aria-label={`Due date for "${task.text}"`}
      />
      <button
        type="button"
        className="btn btn-quiet"
        onClick={onDelete}
        aria-label={`Delete "${task.text}"`}
      >
        ✕
      </button>
    </li>
  );
}

export default function ProjectCard({ project, today, highlighted, player = false, api, onEdit }: ProjectCardProps) {
  const headingId = useId();
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  // Finishing a cassette ejects it first: it slides out, then the project is marked finished.
  const [ejecting, setEjecting] = useState(false);
  const ejectTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(ejectTimer.current), []);

  function finish() {
    if (!player || project.done) {
      api.updateProject(project.id, { done: !project.done });
      return;
    }
    sfx.clunk();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setEjecting(true);
    ejectTimer.current = window.setTimeout(() => {
      api.updateProject(project.id, { done: true });
      setEjecting(false);
    }, reduced ? 0 : 450);
  }

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

  const dates =
    project.start !== ""
      ? `${formatShort(project.start)} → ${formatMedium(project.deadline)}`
      : `Deadline ${formatMedium(project.deadline)}`;

  return (
    <article
      id={`project-${project.id}`}
      className="project-card"
      style={{ "--project-color": project.color } as CSSProperties}
      data-highlight={highlighted || undefined}
      data-ejecting={ejecting || undefined}
      aria-labelledby={headingId}
    >
      {player ? (
        <>
          <h3 id={headingId} className="sr-only">
            {project.name}
          </h3>
          <Cassette project={project} status={status} done={done} total={total} />
          <div className="tape-meta">
            <span className="badge" data-kind={status.kind}>
              {status.label}
            </span>
            <span className="muted num">
              {done} of {total} done · {dates}
            </span>
          </div>
        </>
      ) : (
              <header className="project-card-header">
          <div className="project-card-title">
            <h3 id={headingId}>{project.name}</h3>
            <p className="muted num">{dates}</p>
          </div>
          <span className="badge" data-kind={status.kind}>
            {status.label}
          </span>
        </header>
      )}

      {project.details.trim() !== "" && <p className="project-details">{project.details}</p>}

      {!player && (
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
          <span className="muted num">
            {done} of {total} done
          </span>
        </div>
      )}

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

      <form className="task-add" onSubmit={addTask}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a checklist item…"
          aria-label={`Add a checklist item to ${project.name}`}
          maxLength={200}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date (optional)"
        />
        <button type="submit" className="btn" disabled={text.trim() === ""}>
          Add
        </button>
      </form>

      <footer className="project-card-actions">
        <button type="button" className="btn" onClick={onEdit}>
          Edit
        </button>
        {!doneByTasks && (
          <button
            type="button"
            className="btn"
            onClick={finish}
          >
            {project.done ? "Reopen" : player ? "⏏ Mark finished" : "Mark finished"}
          </button>
        )}
      </footer>
    </article>
  );
}
