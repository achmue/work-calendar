import { describe, expect, it } from "vitest";
import { comingUp, dayLabel, dueCountsByDay, pendingItems, summarize, type AgendaItem } from "../src/lib/agenda";
import type { Project, Task } from "../src/types";

const TODAY = "2026-11-19";

function task(id: string, due: string, done = false): Task {
  return { id, text: `Task ${id}`, due, done };
}
function project(id: string, deadline: string, tasks: Task[] = [], done = false): Project {
  return { id, name: `Project ${id}`, details: "", color: "#2563EB", start: "", deadline, done, tasks, createdAt: "" };
}
const label = (i: AgendaItem) => (i.kind === "deadline" ? `D:${i.project.id}` : `T:${i.task.id}`);

describe("pendingItems", () => {
  it("lists deadlines and unticked dated items, soonest first, deadlines before items", () => {
    const a = project("a", "2026-11-25", [task("a1", "2026-11-25"), task("a2", "2026-11-20"), task("a3", "", false), task("a4", "2026-11-21", true)]);
    const b = project("b", "2026-11-20");
    expect(pendingItems([a, b]).map(label)).toEqual(["D:b", "T:a2", "D:a", "T:a1"]);
  });

  it("leaves out finished projects and everything in them", () => {
    const manual = project("m", "2026-11-01", [task("m1", "2026-11-01")], true);
    const allTicked = project("t", "2026-11-01", [task("t1", "2026-11-01", true)]);
    expect(pendingItems([manual, allTicked])).toEqual([]);
  });
});

describe("comingUp", () => {
  const projects = [
    project("old", "2026-11-10", [task("o1", "2026-11-12")]),
    project("soon", "2026-11-22"),
    project("edge", "2026-12-03"), // exactly 14 days ahead
    project("later", "2026-12-04"), // 15 days ahead
  ];

  it("includes overdue items and the next 14 days, nothing after", () => {
    expect(comingUp(projects, TODAY).map(label)).toEqual(["D:old", "T:o1", "D:soon", "D:edge"]);
  });

  it("can look a different distance ahead", () => {
    expect(comingUp(projects, TODAY, 3).map(label)).toEqual(["D:old", "T:o1", "D:soon"]);
  });
});

describe("summarize", () => {
  it("counts overdue, due in the next 7 days, and checklist progress", () => {
    const projects = [
      project("a", "2026-11-17", [task("a1", "2026-11-15"), task("a2", "2026-11-26"), task("a3", "2026-11-27"), task("a4", "", true)]),
      project("b", "2026-11-19", [task("b1", "2026-11-19", true)]), // all ticked -> finished
      project("c", "2026-12-30", [task("c1", "2026-11-20")]),
    ];
    // overdue: a's deadline + a1. due soon (19..26): a2 (26th) and c1 (20th). a3 is on the 27th: not yet.
    expect(summarize(projects, TODAY)).toEqual({ overdue: 2, dueSoon: 2, tasksDone: 2, tasksTotal: 6 });
  });

  it("counts today as due soon, not overdue", () => {
    expect(summarize([project("a", TODAY)], TODAY)).toMatchObject({ overdue: 0, dueSoon: 1 });
  });

  it("is all zeros with no projects", () => {
    expect(summarize([], TODAY)).toEqual({ overdue: 0, dueSoon: 0, tasksDone: 0, tasksTotal: 0 });
  });
});

describe("dayLabel", () => {
  it("is friendly for nearby days", () => {
    expect(dayLabel("2026-11-19", TODAY)).toBe("Today");
    expect(dayLabel("2026-11-20", TODAY)).toBe("Tomorrow");
    expect(dayLabel("2026-11-18", TODAY)).toBe("1 day overdue");
    expect(dayLabel("2026-11-12", TODAY)).toBe("7 days overdue");
    expect(dayLabel("2026-11-27", TODAY)).toBe("Fri 27 Nov");
  });
});

describe("dueCountsByDay (the equaliser)", () => {
  it("counts what's due on each of the next days, with overdue piled onto today", () => {
    const projects = [
      project("a", "2026-11-21", [task("a1", "2026-11-17"), task("a2", "2026-11-19"), task("a3", "2026-11-21")]), // a1+a2 overdue; deadline + a3 on the 21st
      project("b", "2026-12-02", [task("b1", "2026-11-19")]), // b1 overdue; deadline is day 13
      project("c", "2026-12-03"), // day 14: outside a 14-day window
    ];
    const counts = dueCountsByDay(projects, TODAY, 14);
    expect(counts).toHaveLength(14);
    expect(counts[0]).toBe(3); // three overdue items
    expect(counts[2]).toBe(2); // a's deadline and a3 on the 21st
    expect(counts[13]).toBe(1); // b's deadline on 2 Dec
    expect(counts.reduce((n, c) => n + c, 0)).toBe(6);
  });

  it("is all zeros when nothing is due, and ignores finished projects", () => {
    expect(dueCountsByDay([], TODAY)).toEqual(new Array(14).fill(0));
    expect(dueCountsByDay([project("m", "2026-11-21", [], true)], TODAY).every((n) => n === 0)).toBe(true);
  });
});
