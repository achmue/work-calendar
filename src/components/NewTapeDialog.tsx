import { useId, useState, type CSSProperties, type FormEvent } from "react";
import { daysBetween, isISODate } from "../lib/dates";
import { DEFAULT_PROJECT_COLOR, PROJECT_COLORS } from "../lib/projectColors";
import { validateProjectForm, type ProjectFormErrors } from "../lib/projectForm";
import type { ProjectInput } from "../state/useProjects";
import type { ProjectFormResult } from "./ProjectDialog";
import { TRANSPORT, TransportIcon } from "./icons";
import Dialog from "./Dialog";

interface NewTapeDialogProps {
  /** Starting values (e.g. a deadline picked on the calendar). */
  defaults?: Partial<ProjectInput>;
  suggestedColor: string;
  onSave: (result: ProjectFormResult) => void;
  onClose: () => void;
}

/** Adding a project in the tape layout: you load a blank tape, write its label, pick a shell and set how long it runs. */
export default function NewTapeDialog({ defaults, suggestedColor, onSave, onClose }: NewTapeDialogProps) {
  const ids = useId();
  const [name, setName] = useState(defaults?.name ?? "");
  const [details, setDetails] = useState(defaults?.details ?? "");
  const [color, setColor] = useState(defaults?.color ?? suggestedColor);
  const [start, setStart] = useState(defaults?.start ?? "");
  const [deadline, setDeadline] = useState(defaults?.deadline ?? "");
  const [errors, setErrors] = useState<ProjectFormErrors>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateProjectForm({ name, start, deadline });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave({ name: name.trim(), details, color, start, deadline, done: false });
  }

  const errorId = (field: string) => `${ids}-${field}-error`;
  const length = isISODate(deadline) ? (isISODate(start) && start <= deadline ? daysBetween(start, deadline) + 1 : null) : null;

  return (
    <Dialog title="Load a blank tape" size="wide" className="dialog-tape" onClose={onClose}>
      <form onSubmit={submit} noValidate className="nt">
        <div className="nt-left">
          <div className="nt-shell" style={{ "--shell": color } as CSSProperties}>
            <span className="nt-screw" data-at="tl" aria-hidden="true" />
            <span className="nt-screw" data-at="tr" aria-hidden="true" />
            <span className="nt-screw" data-at="bl" aria-hidden="true" />
            <span className="nt-screw" data-at="br" aria-hidden="true" />
            <div className="nt-label">
              <span className="nt-side" aria-hidden="true">
                <span>SIDE A</span>
                <span>{length ? `${length} ${length === 1 ? "DAY" : "DAYS"}` : "BLANK"}</span>
              </span>
              <label htmlFor={`${ids}-name`} className="sr-only">
                Project name
              </label>
              <input
                id={`${ids}-name`}
                className="nt-name"
                type="text"
                value={name}
                placeholder="Name your project"
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? errorId("name") : undefined}
                data-autofocus
              />
            </div>
            <div className="nt-window" aria-hidden="true">
              <span className="nt-reel" />
              <span className="nt-line" />
              <span className="nt-reel" />
            </div>
            <div className="nt-base" aria-hidden="true" />
          </div>
          {errors.name && (
            <p id={errorId("name")} className="field-error">
              {errors.name}
            </p>
          )}

          <fieldset className="nt-shells">
            <legend>Shell colour (this is the project's colour)</legend>
            <div className="swatches" role="radiogroup" aria-label="Project colour">
              {PROJECT_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  role="radio"
                  aria-checked={color.toLowerCase() === swatch.toLowerCase()}
                  aria-label={swatch}
                  className="nt-swatch"
                  style={{ "--s": swatch } as CSSProperties}
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
        </div>

        <div className="nt-right">
          <h3 className="nt-h">How long does the tape run?</h3>
          <div className="nt-dates">
            <div className="field">
              <label htmlFor={`${ids}-start`}>Starts (optional)</label>
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
          <p className="nt-length readout" role="status">
            {length ? `${length} ${length === 1 ? "day" : "days"} of tape` : "Set both dates to see how much tape you need"}
          </p>

          <div className="field">
            <label htmlFor={`${ids}-details`}>J-card notes (optional)</label>
            <textarea id={`${ids}-details`} className="nt-notes" rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
        </div>

        <div className="dialog-actions nt-actions">
          <button type="button" className="btn" onClick={onClose}>
            <TransportIcon path={TRANSPORT.eject} /> Eject
          </button>
          <span className="spacer" />
          <button type="submit" className="btn btn-primary tp-rec-button">
            <TransportIcon path={TRANSPORT.record} /> Record: create project
          </button>
        </div>
      </form>
    </Dialog>
  );
}
