import { describe, expect, it } from "vitest";
import { addDaysISO } from "../src/lib/dates";
import { getProjectStatus, isProjectDone, isTaskOverdue, sortProjects, taskProgress, boardOrder } from "../src/lib/status";
import type { Project } from "../src/types";
import type { Task } from "../src/types";

const TODAY = "2026-11-19";

function task(done: boolean): Task {
  return { id: `t-${Math.random()}`, text: "item", due: "", done };
}

function project(deadlineOffset: number, overrides: { done?: boolean; tasks?: Task[] } = {}) {
  return {
    done: false,
    tasks: [task(false)],
    ...overrides,
    deadline: addDaysISO(TODAY, deadlineOffset),
  };
}

describe("getProjectStatus: counting down", () => {
  it('says "N days left" when more than 7 days away', () => {
    expect(getProjectStatus(project(8), TODAY)).toEqual({ kind: "on-track", label: "8 days left" });
    expect(getProjectStatus(project(30), TODAY).label).toBe("30 days left");
  });

  it('says "Due in N days" from 1 to 7 days away', () => {
    expect(getProjectStatus(project(7), TODAY)).toEqual({ kind: "due-soon", label: "Due in 7 days" });
    expect(getProjectStatus(project(2), TODAY).label).toBe("Due in 2 days");
    expect(getProjectStatus(project(1), TODAY).label).toBe("Due in 1 day");
  });

  it('says "Due today" on the deadline', () => {
    expect(getProjectStatus(project(0), TODAY)).toEqual({ kind: "due-today", label: "Due today" });
  });

  it('says "Overdue by N days" after the deadline', () => {
    expect(getProjectStatus(project(-1), TODAY)).toEqual({ kind: "overdue", label: "Overdue by 1 day" });
    expect(getProjectStatus(project(-12), TODAY).label).toBe("Overdue by 12 days");
  });

  it("works across a month boundary", () => {
    const status = getProjectStatus({ done: false, tasks: [], deadline: "2026-12-02" }, "2026-11-28");
    expect(status.label).toBe("Due in 4 days");
  });
});

describe("getProjectStatus: done", () => {
  it("is Done when marked finished, even if overdue", () => {
    expect(getProjectStatus(project(-5, { done: true }), TODAY)).toEqual({ kind: "done", label: "Done" });
  });

  it("is Done when every task is ticked, even if overdue", () => {
    const tasks = [task(true), task(true)];
    expect(getProjectStatus(project(-5, { tasks }), TODAY).kind).toBe("done");
    expect(getProjectStatus(project(20, { tasks }), TODAY).kind).toBe("done");
  });

  it("is not Done while any task is left", () => {
    const tasks = [task(true), task(false)];
    expect(getProjectStatus(project(3, { tasks }), TODAY).kind).toBe("due-soon");
  });

  it("is not Done just because there are no tasks", () => {
    expect(getProjectStatus(project(3, { tasks: [] }), TODAY).kind).toBe("due-soon");
    expect(isProjectDone({ done: false, tasks: [] })).toBe(false);
  });
});

describe("taskProgress", () => {
  it("counts ticked items out of the total", () => {
    expect(taskProgress({ tasks: [task(true), task(false), task(true)] })).toEqual({ done: 2, total: 3 });
    expect(taskProgress({ tasks: [] })).toEqual({ done: 0, total: 0 });
  });
});

describe("isTaskOverdue", () => {
  it("is true only for unticked items with a past due date", () => {
    expect(isTaskOverdue({ done: false, due: "2026-11-18" }, TODAY)).toBe(true);
    expect(isTaskOverdue({ done: false, due: TODAY }, TODAY)).toBe(false);
    expect(isTaskOverdue({ done: false, due: "2026-11-20" }, TODAY)).toBe(false);
    expect(isTaskOverdue({ done: true, due: "2026-11-01" }, TODAY)).toBe(false);
    expect(isTaskOverdue({ done: false, due: "" }, TODAY)).toBe(false);
  });
});

describe("sortProjects", () => {
  const p = (name: string, deadline: string, done = false) => ({
    id: name, name, details: "", color: "#000000", start: "", deadline, done, tasks: [], createdAt: "",
  });

  it("puts soonest deadlines first and finished projects last", () => {
    const sorted = sortProjects([p("late", "2026-12-30"), p("finished", "2026-11-01", true), p("soon", "2026-11-20")]);
    expect(sorted.map((x) => x.name)).toEqual(["soon", "late", "finished"]);
  });

  it("breaks ties by name and doesn't change the original list", () => {
    const original = [p("b", "2026-11-20"), p("a", "2026-11-20")];
    expect(sortProjects(original).map((x) => x.name)).toEqual(["a", "b"]);
    expect(original.map((x) => x.name)).toEqual(["b", "a"]);
  });
});

describe("boardOrder", () => {
  const project = (id: string, deadline: string, done = false): Project => ({
    id, name: id, details: "", color: "#1F8A8A", start: "", deadline, done, tasks: [], createdAt: "",
  });

  it("pins what's coming up first, then what's late, then what's finished", () => {
    const board = [
      project("old", "2026-11-01"),
      project("later", "2026-12-04"),
      project("done", "2026-11-22", true),
      project("soon", "2026-11-20"),
      project("late", "2026-11-12"),
    ];
    expect(boardOrder(board, "2026-11-20").map((p) => p.id)).toEqual(["soon", "later", "late", "old", "done"]);
  });
});
