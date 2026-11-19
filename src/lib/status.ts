import type { ISODate, Project } from "../types";
import { daysBetween } from "./dates";

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

export function taskProgress(project: Pick<Project, "tasks">): { done: number; total: number } {
  const total = project.tasks.length;
  const done = project.tasks.filter((task) => task.done).length;
  return { done, total };
}

/**
 * Done: marked finished by hand, or it has tasks and every one is ticked.
 * (A project with no tasks is not "done" just because there's nothing to tick.)
 */
export function isProjectDone(project: Pick<Project, "done" | "tasks">): boolean {
  const { done, total } = taskProgress(project);
  return project.done || (total > 0 && done === total);
}

export function getProjectStatus(
  project: Pick<Project, "done" | "deadline" | "tasks">,
  today: ISODate,
): ProjectStatus {
  if (isProjectDone(project)) return { kind: "done", label: "Done" };

  const left = daysBetween(today, project.deadline);
  if (left < 0) return { kind: "overdue", label: `Overdue by ${days(-left)}` };
  if (left === 0) return { kind: "due-today", label: "Due today" };
  if (left <= DUE_SOON_DAYS) return { kind: "due-soon", label: `Due in ${days(left)}` };
  return { kind: "on-track", label: `${days(left)} left` };
}
