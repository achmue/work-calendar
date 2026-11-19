import type { ISODate, Project, Task } from "../types";
import { addDaysISO, daysBetween, formatISO } from "./dates";
import { DUE_SOON_DAYS, isProjectDone } from "./status";

/** Something still to do: an unfinished project's deadline, or an unticked dated checklist item. */
export type AgendaItem =
  | { kind: "deadline"; date: ISODate; project: Project }
  | { kind: "task"; date: ISODate; project: Project; task: Task };

/** How far ahead the "Coming up" panel looks. */
export const COMING_UP_DAYS = 14;

function compareItems(a: AgendaItem, b: AgendaItem): number {
  return (
    a.date.localeCompare(b.date) ||
    Number(a.kind === "task") - Number(b.kind === "task") ||
    a.project.name.localeCompare(b.project.name) ||
    (a.kind === "task" && b.kind === "task" ? a.task.text.localeCompare(b.task.text) : 0)
  );
}

/**
 * Everything not yet done, soonest first (deadlines before checklist items on the same day).
 * Finished projects (and their leftover items) are left out.
 */
export function pendingItems(projects: readonly Project[]): AgendaItem[] {
  const items: AgendaItem[] = [];
  for (const project of projects) {
    if (isProjectDone(project)) continue;
    items.push({ kind: "deadline", date: project.deadline, project });
    for (const task of project.tasks) {
      if (!task.done && task.due !== "") items.push({ kind: "task", date: task.due, project, task });
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
  const tasks = projects.flatMap((p) => p.tasks);
  return { overdue, dueSoon, tasksDone: tasks.filter((t) => t.done).length, tasksTotal: tasks.length };
}

/** "Today", "Tomorrow", "3 days overdue", or "Fri 21 Nov". */
export function dayLabel(date: ISODate, today: ISODate): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${-diff} ${diff === -1 ? "day" : "days"} overdue`;
  return formatISO(date, "EEE d MMM");
}
