import type { ISODate, Plan, Project, Task } from "../types";
import { addDaysISO, daysBetween, formatISO } from "./dates";
import { DUE_SOON_DAYS, isInFinishedPlan, isPlanDone, isProjectDone, taskProgress } from "./status";

/** Something still to do: a project's deadline, a small plan's finish date, or a dated checklist item. */
export type AgendaItem =
  | { kind: "deadline"; date: ISODate; project: Project }
  | { kind: "plan"; date: ISODate; project: Project; plan: Plan }
  | { kind: "task"; date: ISODate; project: Project; task: Task };

/** How far ahead the "Coming up" panel looks. */
export const COMING_UP_DAYS = 14;

/** On the same day: the big thing first. */
const RANK = { deadline: 0, plan: 1, task: 2 } as const;

const words = (item: AgendaItem) => (item.kind === "task" ? item.task.text : item.kind === "plan" ? item.plan.name : "");

function compareItems(a: AgendaItem, b: AgendaItem): number {
  return (
    a.date.localeCompare(b.date) ||
    RANK[a.kind] - RANK[b.kind] ||
    a.project.name.localeCompare(b.project.name) ||
    words(a).localeCompare(words(b))
  );
}

/**
 * Everything not yet done, soonest first (deadlines before checklist items on the same day).
 * Finished projects and finished small plans (and their leftover items) are left out.
 */
export function pendingItems(projects: readonly Project[]): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const project of projects) {
    if (isProjectDone(project)) continue;
    items.push({ kind: "deadline", date: project.deadline, project });
    for (const plan of project.plans) {
      if (plan.due !== "" && !isPlanDone(project, plan)) items.push({ kind: "plan", date: plan.due, project, plan });
    }
    for (const task of project.tasks) {
      if (!task.done && task.due !== "" && !isInFinishedPlan(project, task)) {
        items.push({ kind: "task", date: task.due, project, task });
      }
    }
  }
  return items.sort(compareItems);
}

/** Overdue items plus everything due in the next `days` days (today included). */
export function comingUp(
  projects: readonly Project[],
  today: ISODate,
  days: number = COMING_UP_DAYS,
): AgendaItem[] {
  const last = addDaysISO(today, days);
  return pendingItems(projects).filter((item) => item.date <= last);
}

export interface Summary {
  /** Deadlines and checklist items that are past due and not done. */
  overdue: number;
  /** Not-done deadlines and items due from today to 7 days ahead. */
  dueSoon: number;
  tasksDone: number;
  tasksTotal: number;
}

export function summarize(projects: readonly Project[], today: ISODate): Summary {
  const soonEnd = addDaysISO(today, DUE_SOON_DAYS);
  let overdue = 0;
  let dueSoon = 0;
  for (const item of pendingItems(projects)) {
    if (item.date < today) overdue += 1;
    else if (item.date <= soonEnd) dueSoon += 1;
  }
  const progress = projects.map(taskProgress);
  const tasksDone = progress.reduce((n, p) => n + p.done, 0);
  const tasksTotal = progress.reduce((n, p) => n + p.total, 0);
  return { overdue, dueSoon, tasksDone, tasksTotal };
}

/** "Today", "Tomorrow", "3 days overdue", or "Fri 21 Nov". */
export function dayLabel(date: ISODate, today: ISODate): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${-diff} ${diff === -1 ? "day" : "days"} overdue`;
  return formatISO(date, "EEE d MMM");
}

/**
 * How many things are due on each of the next `days` days (index 0 = today).
 * Anything overdue is counted on today, because that's when you have to deal with it.
 */
export function dueCountsByDay(projects: readonly Project[], today: ISODate, days = 14): number[] {
  const counts = new Array<number>(days).fill(0);
  for (const item of pendingItems(projects)) {
    const offset = Math.max(0, daysBetween(today, item.date));
    if (offset < days) counts[offset] = (counts[offset] ?? 0) + 1;
  }
  return counts;
}
