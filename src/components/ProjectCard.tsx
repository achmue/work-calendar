import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type MouseEvent } from "react";
import { formatISO, formatMedium, formatShort } from "../lib/dates";
import { looseItems, planItems, sortPlans } from "../lib/plans";
import { getProjectStatus, isPlanDone, isPlanOverdue, isProjectDone, isTaskOverdue, planProgress, taskProgress } from "../lib/status";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Plan, Project, Task } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import MoveDialog from "./MoveDialog";

type ProjectsApi = ReturnType<typeof useProjects>;
type CardApi = Pick<
  ProjectsApi,
  "updateProject" | "addTask" | "updateTask" | "deleteTask" | "addPlan" | "updatePlan" | "deletePlan" | "moveTasks"
>;

interface ProjectCardProps {
  project: Project;
  today: ISODate;
  highlighted: boolean;
  /** Also write the notes and the start date on the card, and open every small plan (the Projects view has room). */
  showDetails: boolean;
  api: CardApi;
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

/** A date in small print, with the real date field lying over it. */
function DueDate({
  value,
  today,
  label,
  empty,
  onChange,
}: {
  value: ISODate | "";
  today: ISODate;
  label: string;
  /** What to show (on hover) when there's no date yet. */
  empty: string;
  onChange: (due: string) => void;
}) {
  const thisYear = value.slice(0, 4) === today.slice(0, 4);
  return (
    <span className="task-date" data-empty={value === "" || undefined}>
      <span className="task-date-text" aria-hidden="true">
        {value === "" ? empty : thisYear ? formatShort(value) : formatMedium(value)}
      </span>
      <input type="date" className="task-due" value={value} onClick={openPicker} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    </span>
  );
}

function TaskRow({
  task,
  today,
  late,
  onChange,
  onDelete,
  onMove,
}: {
  task: Task;
  today: ISODate;
  late: boolean;
  onChange: (patch: Partial<Pick<Task, "done" | "due">>) => void;
  onDelete: () => void;
  /** Given when the card has small plans to move between. */
  onMove?: () => void;
}) {
  return (
    <li
      className="task"
      data-task={task.id}
      data-movable={onMove ? true : undefined}
      data-done={task.done || undefined}
      data-overdue={late || undefined}
    >
      <label className="task-main">
        <input type="checkbox" checked={task.done} onChange={(e) => onChange({ done: e.target.checked })} />
        <span className="task-text">{task.text}</span>
      </label>
      {onMove && (
        <button type="button" className="task-move" onClick={onMove} aria-label={`Move "${task.text}"`} title="Move to a small plan">
          ⇄
        </button>
      )}
      <button type="button" className="task-delete" onClick={onDelete} aria-label={`Delete "${task.text}"`}>
        ✕
      </button>
      <DueDate value={task.due} today={today} empty="date" label={`Due date for "${task.text}"`} onChange={(due) => onChange({ due })} />
    </li>
  );
}

/** The next empty line: write on it and press Enter. */
function AddItem({ into, onAdd }: { into: string; onAdd: (item: { text: string; due: string }) => void }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed === "") return;
    onAdd({ text: trimmed, due });
    setText("");
    setDue("");
  }

  return (
    <form className="task-add" onSubmit={submit} data-filled={text.trim() !== "" || due !== "" || undefined}>
      <span className="task-add-mark" aria-hidden="true" />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a checklist item…"
        aria-label={`Add a checklist item to ${into}`}
        maxLength={200}
      />
      <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date (optional)" />
      <button type="submit" className="btn" disabled={text.trim() === ""}>
        Add
      </button>
    </form>
  );
}

/** A new small plan: its name and the date you expect to finish it. */
function AddPlan({ into, onAdd, onClose }: { into: string; onAdd: (plan: { name: string; due: string }) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [due, setDue] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim() === "") return;
    onAdd({ name: name.trim(), due });
    setName("");
    setDue("");
    nameRef.current?.focus(); // ready for the next one
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onClose();
  }

  return (
    <form className="plan-add" onSubmit={submit} onKeyDown={onKeyDown}>
      <input
        ref={nameRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name of the small plan"
        aria-label={`Add a small plan to ${into}`}
        maxLength={120}
        autoFocus
      />
      <label>
        <span>Finish date you expect</span>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      <button type="submit" className="btn" disabled={name.trim() === ""}>
        Add
      </button>
    </form>
  );
}

/** One small plan on the card: a heading you can open, with its own part of the checklist. */
function PlanGroup({
  project,
  plan,
  today,
  open,
  api,
  onToggle,
  onDelete,
  onMove,
}: {
  project: Project;
  plan: Plan;
  today: ISODate;
  open: boolean;
  api: CardApi;
  onToggle: () => void;
  onDelete: () => void;
  onMove: (task: Task) => void;
}) {
  const bodyId = useId();
  const items = planItems(project, plan.id);
  const { done, total } = planProgress(project, plan);
  const finished = isPlanDone(project, plan);
  const late = isPlanOverdue(project, plan, today);
  const doneByItems = total > 0 && done === total;

  return (
    <li
      className="plan"
      data-done={finished || undefined}
      data-late={late || undefined}
      data-open={open || undefined}
      data-beyond={(plan.due !== "" && plan.due > project.deadline) || undefined}
    >
      <div className="plan-row">
        <input
          type="checkbox"
          className="plan-check"
          checked={finished}
          disabled={doneByItems}
          onChange={(e) => api.updatePlan(project.id, plan.id, { done: e.target.checked })}
          aria-label={`Small plan "${plan.name}" finished`}
          title={doneByItems ? "All its items are ticked" : "Tick when this small plan is finished"}
        />
        <button type="button" className="plan-name" aria-expanded={open} aria-controls={open ? bodyId : undefined} onClick={onToggle}>
          <span className="plan-name-text">{plan.name}</span>
          <span className="plan-arrow" aria-hidden="true">
            ▸
          </span>
          {total > 0 && (
            <span className="plan-count">
              {done}/{total}
              <span className="sr-only"> items done</span>
            </span>
          )}
        </button>
        <button type="button" className="task-delete" onClick={onDelete} aria-label={`Delete small plan "${plan.name}"`}>
          ✕
        </button>
        <DueDate
          value={plan.due}
          today={today}
          empty="finish date"
          label={`Finish date you expect for "${plan.name}"`}
          onChange={(due) => api.updatePlan(project.id, plan.id, { due })}
        />
      </div>

      {open && (
        <div id={bodyId} className="plan-body">
          {items.length > 0 && (
            <ul className="tasks">
              {items.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  today={today}
                  late={!finished && isTaskOverdue(task, today)}
                  onChange={(patch) => api.updateTask(project.id, task.id, patch)}
                  onDelete={() => api.deleteTask(project.id, task.id)}
                  onMove={() => onMove(task)}
                />
              ))}
            </ul>
          )}
          <AddItem into={plan.name} onAdd={(item) => api.addTask(project.id, { ...item, planId: plan.id })} />
        </div>
      )}
    </li>
  );
}

/** A project as an index card taped to the board. */
export default function ProjectCard({ project, today, highlighted, showDetails, api, onEdit }: ProjectCardProps) {
  const headingId = useId();
  const plans = sortPlans(project.plans);
  const loose = looseItems(project);
  const status = getProjectStatus(project, today);
  const { done, total } = taskProgress(project);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  // Everything in it ticked already counts as done, so a manual "finished" button would do nothing.
  const doneByContents = isProjectDone({ ...project, done: false });

  // Which small plans are open: the one you're working on (all unfinished ones where there's room).
  const [open, setOpen] = useState<ReadonlySet<string>>(() => {
    const unfinished = plans.filter((plan) => !isPlanDone(project, plan)).map((plan) => plan.id);
    return new Set(showDetails ? unfinished : unfinished.slice(0, 1));
  });
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const [addingPlan, setAddingPlan] = useState(false);
  const addPlanRef = useRef<HTMLButtonElement>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const deletingItems = deleting ? planItems(project, deleting.id).length : 0;

  // Moving items between small plans: which ones the pop-up offers, what it said, and where focus goes.
  const [moving, setMoving] = useState<Task[] | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [focusTask, setFocusTask] = useState("");
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusTask === "") return;
    cardRef.current?.querySelector<HTMLElement>(`[data-task="${CSS.escape(focusTask)}"] .task-move`)?.focus();
    setFocusTask("");
  }, [focusTask]);

  function move(taskIds: string[], planId: string) {
    api.moveTasks(project.id, taskIds, planId);
    if (planId !== "") setOpen((current) => new Set(current).add(planId));
    const where = project.plans.find((plan) => plan.id === planId)?.name ?? "Other items";
    const only = taskIds.length === 1 ? project.tasks.find((task) => task.id === taskIds[0]) : undefined;
    setAnnouncement(`Moved ${only ? `"${only.text}"` : `${taskIds.length} items`} to ${where}.`);
    setMoving(null);
    setFocusTask(taskIds[0] ?? ""); // follow the item to where it went
  }

  function removePlan(plan: Plan) {
    if (planItems(project, plan.id).length > 0) setDeleting(plan);
    else api.deletePlan(project.id, plan.id);
  }

  return (
    <article
      ref={cardRef}
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

      {plans.length > 0 && (
        <ul className="plans" aria-label="Small plans">
          {plans.map((plan) => (
            <PlanGroup
              key={plan.id}
              project={project}
              plan={plan}
              today={today}
              open={open.has(plan.id)}
              api={api}
              onToggle={() => toggle(plan.id)}
              onDelete={() => removePlan(plan)}
              onMove={(task) => setMoving([task])}
            />
          ))}
        </ul>
      )}

      {plans.length > 0 && loose.length > 0 && (
        <div className="card-subhead">
          <p>Other items</p>
          <button type="button" className="plan-new" onClick={() => setMoving(loose)}>
            Move into a plan…
          </button>
        </div>
      )}

      {loose.length > 0 && (
        <ul className="tasks">
          {loose.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              today={today}
              late={isTaskOverdue(task, today)}
              onChange={(patch) => api.updateTask(project.id, task.id, patch)}
              onDelete={() => api.deleteTask(project.id, task.id)}
              onMove={plans.length > 0 ? () => setMoving([task]) : undefined}
            />
          ))}
        </ul>
      )}

      {/* Once a card has small plans, new items go inside them. */}
      {(plans.length === 0 || loose.length > 0) && <AddItem into={project.name} onAdd={(item) => api.addTask(project.id, item)} />}

      <div className="progress-row">
        <button
          ref={addPlanRef}
          type="button"
          className="plan-new"
          aria-expanded={addingPlan}
          onClick={() => setAddingPlan((now) => !now)}
        >
          ＋ Small plan
        </button>
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

      {addingPlan && (
        <AddPlan
          into={project.name}
          onAdd={(input) => {
            const plan = api.addPlan(project.id, input);
            setOpen((current) => new Set(current).add(plan.id));
          }}
          onClose={() => {
            setAddingPlan(false);
            addPlanRef.current?.focus();
          }}
        />
      )}

      <footer className="project-card-actions">
        <button type="button" className="btn" onClick={onEdit}>
          Edit
        </button>
        {!doneByContents && (
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

      <p className="sr-only" role="status">
        {announcement}
      </p>

      {moving && <MoveDialog project={project} items={moving} onMove={move} onClose={() => setMoving(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this small plan?"
          message={`"${deleting.name}" and its ${deletingItems} checklist ${deletingItems === 1 ? "item" : "items"} will be deleted. This can't be undone.`}
          confirmLabel="Delete small plan"
          danger
          onConfirm={() => {
            api.deletePlan(project.id, deleting.id);
            setDeleting(null);
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </article>
  );
}
