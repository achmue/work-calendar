import { useId, type CSSProperties } from "react";
import { daysBetween, formatISO, isISODate } from "../lib/dates";
import { DEFAULT_PROJECT_COLOR, PROJECT_COLORS } from "../lib/projectColors";
import { useProjectForm } from "../state/useProjectForm";
import type { ProjectInput } from "../state/useProjects";
import type { ProjectFormResult } from "./ProjectDialog";
import Dialog from "./Dialog";
import PlanFields from "./PlanFields";

interface NewCardDialogProps {
  /** Starting values (e.g. a deadline picked on the calendar). */
  defaults?: Partial<ProjectInput>;
  suggestedColor: string;
  onSave: (result: ProjectFormResult) => void;
  onClose: () => void;
}

const stamp = (date: string) => formatISO(date, "EEE d MMM");

/** Adding a project in the cork layout: you take a blank index card, write on it, pick a highlighter and stamp its dates. */
export default function NewCardDialog({ defaults, suggestedColor, onSave, onClose }: NewCardDialogProps) {
  const ids = useId();
  const {
    name, setName, details, setDetails, color, setColor, start, setStart, deadline, setDeadline, errors, submit,
    planDrafts, setPlanDrafts, planErrors,
  } = useProjectForm(defaults, suggestedColor, onSave);
  const errorId = (field: string) => `${ids}-${field}-error`;
  const days = isISODate(start) && isISODate(deadline) && start <= deadline ? daysBetween(start, deadline) + 1 : null;

  return (
    <Dialog title="A new index card" className="dialog-card" onClose={onClose}>
      <form onSubmit={submit} noValidate className="nc" style={{ "--project-color": color } as CSSProperties}>
        <div className="nc-card">
          <label htmlFor={`${ids}-name`} className="nc-label">
            Project name
          </label>
          <input
            id={`${ids}-name`}
            className="nc-name"
            type="text"
            value={name}
            maxLength={120}
            placeholder="Write it here"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            data-autofocus
          />
          {errors.name && (
            <p id={errorId("name")} className="field-error">
              {errors.name}
            </p>
          )}

          <div className="nc-dates">
            <div className="field nc-date" data-which="start">
              <label htmlFor={`${ids}-start`}>Starts (optional)</label>
              <input
                id={`${ids}-start`}
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-invalid={errors.start ? true : undefined}
                aria-describedby={errors.start ? errorId("start") : undefined}
              />
              {isISODate(start) && (
                <span className="nc-stamp" aria-hidden="true">
                  {stamp(start)}
                </span>
              )}
              {errors.start && (
                <p id={errorId("start")} className="field-error">
                  {errors.start}
                </p>
              )}
            </div>
            <div className="field nc-date" data-which="deadline">
              <label htmlFor={`${ids}-deadline`}>Deadline</label>
              <input
                id={`${ids}-deadline`}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                aria-invalid={errors.deadline ? true : undefined}
                aria-describedby={errors.deadline ? errorId("deadline") : undefined}
              />
              {isISODate(deadline) && (
                <span className="nc-stamp" aria-hidden="true">
                  {stamp(deadline)}
                </span>
              )}
              {errors.deadline && (
                <p id={errorId("deadline")} className="field-error">
                  {errors.deadline}
                </p>
              )}
            </div>
          </div>
          <p className="nc-days" role="status">
            {days ? `${days} ${days === 1 ? "day" : "days"} on the wall calendar` : ""}
          </p>

          <PlanFields drafts={planDrafts} onChange={setPlanDrafts} errors={planErrors} deadline={deadline} />

          <label htmlFor={`${ids}-details`} className="nc-label">
            Notes (optional)
          </label>
          <textarea id={`${ids}-details`} className="nc-notes" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>

        <fieldset className="nc-pens">
          <legend>Highlighter (this is the project's colour)</legend>
          <div className="swatches" role="radiogroup" aria-label="Project colour">
            {PROJECT_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                role="radio"
                aria-checked={color.toLowerCase() === swatch.toLowerCase()}
                aria-label={swatch}
                className="nc-pen"
                style={{ "--pen": swatch } as CSSProperties}
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

        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Never mind
          </button>
          <span className="spacer" />
          <button type="submit" className="btn btn-primary nc-pin">
            Pin it up
          </button>
        </div>
      </form>
    </Dialog>
  );
}
