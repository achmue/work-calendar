import type { ISODate, Plan, Project, Task } from "../types";
import { addDaysISO, addMonthsISO, daysBetween, isoWeek, isoWeekday, monthStartISO } from "./dates";
import { isProjectDone } from "./status";

/**
 * The weeks to draw for the month containing `date`. Weeks start on Monday and
 * include the days of the neighbouring months needed to fill the first and last week.
 */
export function monthGrid(date: ISODate): ISODate[][] {
  const first = monthStartISO(date);
  const last = addDaysISO(addMonthsISO(first, 1), -1);
  const gridStart = addDaysISO(first, -(isoWeekday(first) - 1));
  const gridEnd = addDaysISO(last, 7 - isoWeekday(last));

  const weeks: ISODate[][] = [];
  const total = daysBetween(gridStart, gridEnd) + 1;
  for (let i = 0; i < total; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, d) => addDaysISO(gridStart, i + d)));
  }
  return weeks;
}

/** Something that happens on a day: a project deadline, a small plan's finish date or a checklist item. */
export type DayItem =
  | { kind: "deadline"; project: Project }
  | { kind: "plan"; project: Project; plan: Plan }
  | { kind: "task"; project: Project; task: Task };

export type DayIndex = Map<ISODate, DayItem[]>;

/** Group everything with a date by day. On each day: deadlines, then small plans, then checklist items. */
export function buildDayIndex(projects: readonly Project[]): DayIndex {
  const index: DayIndex = new Map();
  const add = (date: ISODate, item: DayItem) => {
    const list = index.get(date);
    if (list) list.push(item);
    else index.set(date, [item]);
  };

  // All deadlines go in first, then all small plans, then items, so that's the order on each day.
  for (const project of projects) add(project.deadline, { kind: "deadline", project });
  for (const project of projects) {
    for (const plan of project.plans) {
      if (plan.due !== "") add(plan.due, { kind: "plan", project, plan });
    }
  }
  for (const project of projects) {
    for (const task of project.tasks) {
      if (task.due !== "") add(task.due, { kind: "task", project, task });
    }
  }
  return index;
}

export function itemsOn(index: DayIndex, date: ISODate): DayItem[] {
  return index.get(date) ?? [];
}

/** The line beside the month's name: this week's number and how long until the next deadline. */
export function weekNote(projects: readonly Project[], today: ISODate): string {
  const waits = projects.filter((p) => !isProjectDone(p) && p.deadline >= today).map((p) => daysBetween(today, p.deadline));
  const next = waits.length > 0 ? Math.min(...waits) : null;
  const wait =
    next === null ? "no deadlines ahead" : next === 0 ? "deadline today" : `${next} ${next === 1 ? "day" : "days"} to next deadline`;
  return `Week ${isoWeek(today)} · ${wait}`;
}
