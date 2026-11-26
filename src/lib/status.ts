import type { ISODate, Plan, Project, Task } from "../types";
import { daysBetween } from "./dates";
import { looseItems, planItems } from "./plans";

/** Within this many days (inclusive) the status switches to "Due in N days". */
export const DUE_SOON_DAYS = 7;

export type StatusKind = "done" | "overdue" | "due-today" | "due-soon" | "on-track";

export interface ProjectStatus {
  kind: StatusKind;
  label: string;
}

function days(count: number): string {
  return count === 1 ? "1 day" : `${count} days`;
}

/**
 * How far along a project is: every checklist item counts as one step, and so does a small plan
 * that has no items of its own.
 */
export function taskProgress(project: Pick<Project, "tasks" | "plans">): { done: number; total: number } {
  const bare = project.plans.filter((plan) => planItems(project, plan.id).length === 0);
  const total = project.tasks.length + bare.length;
  const done = project.tasks.filter((task) => task.done).length + bare.filter((plan) => plan.done).length;
  return { done, total };
}

/** Items done out of the items in one small plan. */
export function planProgress(project: Pick<Project, "tasks">, plan: Pick<Plan, "id">): { done: number; total: number } {
  const items = planItems(project, plan.id);
  return { done: items.filter((task) => task.done).length, total: items.length };
}

/** Finished: marked by hand, or it has items and every one is ticked. */
export function isPlanDone(project: Pick<Project, "tasks">, plan: Pick<Plan, "id" | "done">): boolean {
  const { done, total } = planProgress(project, plan);
  return plan.done || (total > 0 && done === total);
}

/** A small plan that should have been finished by now. */
export function isPlanOverdue(project: Pick<Project, "tasks">, plan: Plan, today: ISODate): boolean {
  return !isPlanDone(project, plan) && plan.due !== "" && plan.due < today;
}

/**
 * Done: marked finished by hand, or there is something in it and all of that is done: every small
 * plan, and every item that stands on its own.
 * (A project with nothing in it is not "done" just because there's nothing to tick.)
 */
export function isProjectDone(project: Pick<Project, "done" | "tasks" | "plans">): boolean {
  if (project.done) return true;
  if (project.tasks.length === 0 && project.plans.length === 0) return false;
  return looseItems(project).every((task) => task.done) && project.plans.every((plan) => isPlanDone(project, plan));
}

export function getProjectStatus(
  project: Pick<Project, "done" | "deadline" | "tasks" | "plans">,
  today: ISODate,
): ProjectStatus {
  if (isProjectDone(project)) return { kind: "done", label: "Done" };

  const left = daysBetween(today, project.deadline);
  if (left < 0) return { kind: "overdue", label: `Overdue by ${days(-left)}` };
  if (left === 0) return { kind: "due-today", label: "Due today" };
  if (left <= DUE_SOON_DAYS) return { kind: "due-soon", label: `Due in ${days(left)}` };
  return { kind: "on-track", label: `${days(left)} left` };
}

/** An item whose small plan has been marked finished: it no longer needs doing. */
export function isInFinishedPlan(project: Pick<Project, "tasks" | "plans">, task: Pick<Task, "planId">): boolean {
  const plan = project.plans.find((p) => p.id === task.planId);
  return plan !== undefined && isPlanDone(project, plan);
}

/** An unticked checklist item whose due date has passed. */
export function isTaskOverdue(task: Pick<Task, "done" | "due">, today: ISODate): boolean {
  return !task.done && task.due !== "" && task.due < today;
}

/** Unfinished projects first (soonest deadline first), finished ones last. */
export function sortProjects(projects: readonly Project[]): Project[] {
  return [...projects].sort(
    (a, b) =>
      Number(isProjectDone(a)) - Number(isProjectDone(b)) ||
      a.deadline.localeCompare(b.deadline) ||
      a.name.localeCompare(b.name),
  );
}

/**
 * The order cards are pinned on the board: what's coming up (soonest first), then what has slipped
 * past its deadline (most recently first), then what's finished.
 */
export function boardOrder(projects: readonly Project[], today: ISODate): Project[] {
  const group = (p: Project) => (isProjectDone(p) ? 2 : p.deadline < today ? 1 : 0);
  return sortProjects(projects).sort((a, b) => {
    const difference = group(a) - group(b);
    if (difference !== 0) return difference;
    return group(a) === 1 ? b.deadline.localeCompare(a.deadline) : 0;
  });
}
