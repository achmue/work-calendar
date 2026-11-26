import { useId, useState, type FormEvent } from "react";
import { draftsToPlans, planItems, sortPlans, validatePlanDrafts, type PlanDraft } from "../lib/plans";
import { DEFAULT_PROJECT_COLOR, PROJECT_COLORS } from "../lib/projectColors";
import { validateProjectForm, type ProjectFormErrors } from "../lib/projectForm";
import type { ProjectInput } from "../state/useProjects";
import type { Project } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import Dialog from "./Dialog";
import PlanFields from "./PlanFields";

export interface ProjectFormResult extends ProjectInput {
  done: boolean;
}

interface ProjectDialogProps {
  /** Set to edit an existing project. Leave out to create a new one. */
  project?: Project;
  /** Starting values for a new project (e.g. a deadline picked on the calendar). */
  defaults?: Partial<ProjectInput>;
  suggestedColor: string;
  onSave: (result: ProjectFormResult) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function ProjectDialog({
  project,
  defaults,
  suggestedColor,
  onSave,
  onDelete,
  onClose,
}: ProjectDialogProps) {
  const ids = useId();
  const editing = project !== undefined;

  const [name, setName] = useState(project?.name ?? defaults?.name ?? "");
  const [details, setDetails] = useState(project?.details ?? defaults?.details ?? "");
  const [color, setColor] = useState(project?.color ?? defaults?.color ?? suggestedColor);
  const [start, setStart] = useState(project?.start ?? defaults?.start ?? "");
  const [deadline, setDeadline] = useState(project?.deadline ?? defaults?.deadline ?? "");
  const [done, setDone] = useState(project?.done ?? false);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [planDrafts, setPlanDrafts] = useState<PlanDraft[]>(() => sortPlans(project?.plans ?? []).map(({ id, name, due }) => ({ id, name, due })));
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});
  const itemCounts = Object.fromEntries((project?.plans ?? []).map((plan) => [plan.id, project ? planItems(project, plan.id).length : 0]));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateProjectForm({ name, start, deadline });
    // A plan that has items keeps its old name if the box was emptied, so nothing is lost by accident.
    const drafts = planDrafts.map((draft) =>
      draft.name.trim() === "" && (itemCounts[draft.id] ?? 0) > 0
        ? { ...draft, name: project?.plans.find((plan) => plan.id === draft.id)?.name ?? "" }
        : draft,
    );
    const foundInPlans = validatePlanDrafts(drafts);
    setErrors(found);
    setPlanErrors(foundInPlans);
    if (Object.keys(found).length > 0 || Object.keys(foundInPlans).length > 0) return;
    onSave({ name: name.trim(), details, color, start, deadline, done, plans: draftsToPlans(drafts, project?.plans) });
  }

  const errorId = (field: string) => `${ids}-${field}-error`;

  return (
    <Dialog title={editing ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="form">
        <div className="field">
          <label htmlFor={`${ids}-name`}>Project name</label>
          <input
            id={`${ids}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            data-autofocus={editing ? undefined : true}
            maxLength={120}
          />
          {errors.name && (
            <p id={errorId("name")} className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${ids}-details`}>Details or notes (optional)</label>
          <textarea
            id={`${ids}-details`}
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor={`${ids}-start`}>Start date (optional)</label>
            <input
              id={`${ids}-start`}
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              aria-invalid={errors.start ? true : undefined}
              aria-describedby={errors.start ? errorId("start") : undefined}
            />
            {errors.start && (
              <p id={errorId("start")} className="field-error">
                {errors.start}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor={`${ids}-deadline`}>Deadline</label>
            <input
              id={`${ids}-deadline`}
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              aria-invalid={errors.deadline ? true : undefined}
              aria-describedby={errors.deadline ? errorId("deadline") : undefined}
            />
            {errors.deadline && (
              <p id={errorId("deadline")} className="field-error">
                {errors.deadline}
              </p>
            )}
          </div>
        </div>

        <PlanFields
          drafts={planDrafts}
          onChange={(next) => {
            setPlanDrafts(next);
            setPlanErrors({});
          }}
          errors={planErrors}
          deadline={deadline}
          itemCounts={itemCounts}
        />

        <fieldset className="field color-field">
          <legend>Colour</legend>
          <div className="swatches" role="radiogroup" aria-label="Project colour">
            {PROJECT_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                role="radio"
                aria-checked={color.toLowerCase() === swatch.toLowerCase()}
                aria-label={swatch}
                className="swatch"
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
              />
            ))}
            <label className="swatch-custom">
              <span>Other</span>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_PROJECT_COLOR}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Pick any colour"
              />
            </label>
          </div>
        </fieldset>

        {editing && (
          <label className="check">
            <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} />
            This project is finished
          </label>
        )}

        <div className="dialog-actions">
          {editing && onDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete project
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editing ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>

      {confirmingDelete && project && (
        <ConfirmDialog
          title="Delete this project?"
          message={`"${project.name}" and its ${
            project.plans.length === 0 ? "" : `${project.plans.length} small ${project.plans.length === 1 ? "plan" : "plans"} and `
          }${project.tasks.length} checklist ${project.tasks.length === 1 ? "item" : "items"} will be deleted. This can't be undone.`}
          confirmLabel="Delete project"
          danger
          onConfirm={() => onDelete?.()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </Dialog>
  );
}
