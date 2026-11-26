import { useState, type KeyboardEvent } from "react";
import { isISODate } from "../lib/dates";
import { newId } from "../lib/id";
import type { PlanDraft } from "../lib/plans";
import ConfirmDialog from "./ConfirmDialog";

interface PlanFieldsProps {
  drafts: PlanDraft[];
  onChange: (drafts: PlanDraft[]) => void;
  /** Messages by row id. */
  errors: Record<string, string>;
  /** The project's deadline, to point out a small plan that ends after it. */
  deadline: string;
  /** How many checklist items each small plan holds, so removing one can say what goes with it. */
  itemCounts?: Record<string, number>;
}

/** The "small plans" part of a project's pop-up: a name and the finish date you expect, one row each. */
export default function PlanFields({ drafts, onChange, errors, deadline, itemCounts = {} }: PlanFieldsProps) {
  const [addedId, setAddedId] = useState("");
  const [removing, setRemoving] = useState<PlanDraft | null>(null);

  function add() {
    const draft = { id: newId(), name: "", due: "" };
    setAddedId(draft.id);
    onChange([...drafts, draft]);
  }

  const change = (id: string, patch: Partial<PlanDraft>) =>
    onChange(drafts.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));

  function remove(id: string) {
    onChange(drafts.filter((draft) => draft.id !== id));
    setRemoving(null);
  }

  // Enter in a name starts the next row; it mustn't save the whole project.
  function onNameKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (event.currentTarget.value.trim() !== "") add();
  }

  const items = removing ? (itemCounts[removing.id] ?? 0) : 0;

  return (
    <fieldset className="plan-fields">
      <legend>Small plans (optional)</legend>
      {drafts.length === 0 ? (
        <p className="plan-fields-hint">Parts of this project, each with the date you expect to finish it.</p>
      ) : (
        <>
          <div className="plan-field plan-fields-head" aria-hidden="true">
            <span>Name</span>
            <span>Finish date you expect</span>
          </div>
          <ul>
            {drafts.map((draft, i) => (
              <li key={draft.id} className="plan-field">
                <input
                  type="text"
                  value={draft.name}
                  maxLength={120}
                  placeholder="e.g. Design"
                  aria-label={`Small plan ${i + 1}: name`}
                  aria-invalid={errors[draft.id] ? true : undefined}
                  autoFocus={draft.id === addedId}
                  onChange={(e) => change(draft.id, { name: e.target.value })}
                  onKeyDown={onNameKey}
                />
                <label className="plan-field-date">
                  <span aria-hidden="true">Finish date you expect</span>
                  <input
                    type="date"
                    value={draft.due}
                    aria-label={`Small plan ${i + 1}: finish date you expect`}
                    onChange={(e) => change(draft.id, { due: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-quiet"
                  aria-label={`Remove small plan ${draft.name.trim() || i + 1}`}
                  onClick={() => ((itemCounts[draft.id] ?? 0) > 0 ? setRemoving(draft) : remove(draft.id))}
                >
                  ✕
                </button>
                {errors[draft.id] && <p className="field-error">{errors[draft.id]}</p>}
                {isISODate(draft.due) && isISODate(deadline) && draft.due > deadline && (
                  <p className="plan-field-note">This is after the project's deadline.</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      <button type="button" className="btn plan-fields-add" onClick={add}>
        ＋ Add a small plan
      </button>

      {removing && (
        <ConfirmDialog
          title="Remove this small plan?"
          message={`"${removing.name.trim() || "This plan"}" has ${items} checklist ${items === 1 ? "item" : "items"}. ${
            items === 1 ? "It" : "They"
          } will be deleted when you save.`}
          confirmLabel="Remove it"
          danger
          onConfirm={() => remove(removing.id)}
          onCancel={() => setRemoving(null)}
        />
      )}
    </fieldset>
  );
}
