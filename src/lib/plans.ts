import type { Plan, Project, Task } from "../types";
import { isISODate } from "./dates";

// Small plans: the parts of a project, each with the date you expect it to be finished.

/** The checklist items that belong to one small plan. */
export function planItems(project: Pick<Project, "tasks">, planId: string): Task[] {
  return project.tasks.filter((task) => task.planId === planId);
}

/** The checklist items that aren't part of any small plan. */
export function looseItems(project: Pick<Project, "tasks" | "plans">): Task[] {
  const ids = new Set(project.plans.map((plan) => plan.id));
  return project.tasks.filter((task) => !task.planId || !ids.has(task.planId));
}

/**
 * Move checklist items into a small plan ("" takes them out of any plan). They join the end of the
 * list there. A plan that doesn't exist, or items that are already there, change nothing.
 */
export function moveItems(project: Project, taskIds: readonly string[], planId: string): Project {
  if (planId !== "" && !project.plans.some((plan) => plan.id === planId)) return project;
  const wanted = new Set(taskIds);
  const moving = project.tasks.filter((task) => wanted.has(task.id) && (task.planId ?? "") !== planId);
  if (moving.length === 0) return project;
  const moved = moving.map(({ planId: _from, ...task }): Task => (planId === "" ? task : { ...task, planId }));
  return { ...project, tasks: [...project.tasks.filter((task) => !moving.includes(task)), ...moved] };
}

/** Soonest finish date first; plans without a date go last. Otherwise the order they were added. */
export function sortPlans(plans: readonly Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    if (a.due === b.due) return 0;
    if (a.due === "") return 1;
    if (b.due === "") return -1;
    return a.due.localeCompare(b.due);
  });
}

/** One row of the "small plans" fields in a form: what's typed, not yet checked. */
export interface PlanDraft {
  id: string;
  name: string;
  due: string;
}

/** Errors by row id. A completely empty row is fine (it's left out); a date needs a name to go with it. */
export function validatePlanDrafts(drafts: readonly PlanDraft[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const draft of drafts) {
    if (draft.due !== "" && !isISODate(draft.due)) errors[draft.id] = "That finish date isn't valid.";
    else if (draft.name.trim() === "" && draft.due !== "") errors[draft.id] = "Give this small plan a name.";
  }
  return errors;
}

/** The rows as small plans: empty rows left out, and anything already marked finished stays finished. */
export function draftsToPlans(drafts: readonly PlanDraft[], existing: readonly Plan[] = []): Plan[] {
  return drafts
    .filter((draft) => draft.name.trim() !== "")
    .map((draft) => ({
      id: draft.id,
      name: draft.name.trim(),
      due: isISODate(draft.due) ? draft.due : "",
      done: existing.find((plan) => plan.id === draft.id)?.done ?? false,
    }));
}
