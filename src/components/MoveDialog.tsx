import { useId, useState, type FormEvent } from "react";
import { formatShort } from "../lib/dates";
import { sortPlans } from "../lib/plans";
import { isPlanDone } from "../lib/status";
import type { Project, Task } from "../types";
import Dialog from "./Dialog";

interface MoveDialogProps {
  project: Project;
  /** One item to move, or several to pick from (the ones that aren't in any small plan). */
  items: Task[];
  onMove: (taskIds: string[], planId: string) => void;
  onClose: () => void;
}

/** Choosing where checklist items go: into a small plan, or out among the "other items". */
export default function MoveDialog({ project, items, onMove, onClose }: MoveDialogProps) {
  const ids = useId();
  const single = items.length === 1 ? items[0] : undefined;
  const from = single?.planId ?? "";
  // Everywhere except where it is now.
  const places = [
    ...sortPlans(project.plans).map((plan) => {
      const finished = isPlanDone(project, plan);
      const date = plan.due === "" ? "no finish date" : `finish ${formatShort(plan.due)}`;
      return { id: plan.id, name: plan.name, note: finished ? `${date}, finished` : date, finished };
    }),
    { id: "", name: "Other items", note: "not part of a small plan", finished: false },
  ].filter((place) => place.id !== from);

  const [to, setTo] = useState(() => (places.find((place) => !place.finished) ?? places[0])?.id ?? "");
  const [chosen, setChosen] = useState<ReadonlySet<string>>(() => new Set(single ? [single.id] : []));
  const all = chosen.size === items.length;

  const pick = (id: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (chosen.size === 0) return;
    onMove(
      items.filter((item) => chosen.has(item.id)).map((item) => item.id),
      to,
    );
  }

  return (
    <Dialog title={single ? "Move this item" : "Move items into a small plan"} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {single ? (
          <p className="move-item">{single.text}</p>
        ) : (
          <fieldset className="field move-list">
            <legend>Which items?</legend>
            <label className="check">
              <input
                type="checkbox"
                checked={all}
                onChange={() => setChosen(new Set(all ? [] : items.map((item) => item.id)))}
                data-autofocus
              />
              <span>Select all</span>
            </label>
            {items.map((item) => (
              <label key={item.id} className="check move-choice">
                <input type="checkbox" checked={chosen.has(item.id)} onChange={() => pick(item.id)} />
                <span>{item.text}</span>
              </label>
            ))}
          </fieldset>
        )}

        <fieldset className="field move-list">
          <legend>Move to</legend>
          {places.map((place) => (
            <label key={place.id} className="check">
              <input
                type="radio"
                name={`${ids}-to`}
                checked={to === place.id}
                onChange={() => setTo(place.id)}
                data-autofocus={single && to === place.id ? true : undefined}
              />
              <span>
                {place.name} <small>{place.note}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={chosen.size === 0}>
            {chosen.size > 1 ? `Move ${chosen.size} items` : "Move"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
