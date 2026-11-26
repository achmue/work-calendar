import { describe, expect, it } from "vitest";
import { buildDayIndex, itemsOn, monthGrid, weekNote } from "../src/lib/calendar";
import { addMonthsISO, isoWeekday, monthStartISO } from "../src/lib/dates";
import type { Project } from "../src/types";

describe("month helpers", () => {
  it("numbers weekdays Monday = 1 to Sunday = 7", () => {
    expect(isoWeekday("2026-11-16")).toBe(1); // Monday
    expect(isoWeekday("2026-11-19")).toBe(4); // Thursday
    expect(isoWeekday("2026-11-22")).toBe(7); // Sunday
  });

  it("finds the first of the month", () => {
    expect(monthStartISO("2026-11-19")).toBe("2026-11-01");
    expect(monthStartISO("2026-11-01")).toBe("2026-11-01");
    expect(() => monthStartISO("2026-02-30")).toThrow(RangeError);
  });

  it("moves by months across year ends and short months", () => {
    expect(addMonthsISO("2026-11-01", 1)).toBe("2026-12-01");
    expect(addMonthsISO("2026-12-01", 1)).toBe("2027-01-01");
    expect(addMonthsISO("2026-01-01", -1)).toBe("2025-12-01");
    expect(addMonthsISO("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("monthGrid", () => {
  it("starts weeks on Monday and pads with the neighbouring months", () => {
    // 1 Nov 2026 is a Sunday, so the first week starts on Monday 26 Oct.
    const weeks = monthGrid("2026-11-19");
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.[0]).toBe("2026-10-26");
    expect(weeks[0]?.[6]).toBe("2026-11-01");
    expect(weeks[5]?.[0]).toBe("2026-11-30");
    expect(weeks[5]?.[6]).toBe("2026-12-06");
  });

  it("every week has 7 days, every row is a Monday-to-Sunday week, days run without gaps", () => {
    for (const month of ["2026-02-10", "2026-11-19", "2027-02-01", "2028-02-29", "2026-12-31", "2027-03-01"]) {
      const weeks = monthGrid(month);
      const days = weeks.flat();
      expect(days.length % 7, month).toBe(0);
      weeks.forEach((week) => {
        expect(week).toHaveLength(7);
        expect(isoWeekday(week[0] ?? "")).toBe(1);
      });
      for (let i = 1; i < days.length; i++) {
        expect(days[i]! > days[i - 1]!, month).toBe(true);
      }
      expect(days).toContain(monthStartISO(month));
    }
  });

  it("uses exactly four weeks when February starts on a Monday", () => {
    const weeks = monthGrid("2027-02-15"); // 1 Feb 2027 is a Monday, 28 Feb a Sunday
    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.[0]).toBe("2027-02-01");
    expect(weeks[3]?.[6]).toBe("2027-02-28");
  });

  it("handles leap years", () => {
    expect(monthGrid("2028-02-10").flat()).toContain("2028-02-29");
  });
});

function project(id: string, deadline: string, tasks: Project["tasks"] = []): Project {
  return { id, name: `P ${id}`, details: "", color: "#2563EB", start: "", deadline, done: false, plans: [], tasks, createdAt: "" };
}

describe("buildDayIndex", () => {
  const a = project("a", "2026-11-20", [
    { id: "a1", text: "A one", due: "2026-11-20", done: false },
    { id: "a2", text: "A two", due: "", done: false },
    { id: "a3", text: "A three", due: "2026-11-18", done: true },
  ]);
  const b = project("b", "2026-11-18", [{ id: "b1", text: "B one", due: "2026-11-20", done: false }]);
  const index = buildDayIndex([a, b]);

  it("groups deadlines and dated items by day", () => {
    expect(itemsOn(index, "2026-11-18").map((i) => (i.kind === "task" ? `task:${i.task.id}` : `${i.kind}:${i.project.id}`))).toEqual([
      "deadline:b",
      "task:a3",
    ]);
  });

  it("lists deadlines before checklist items on the same day", () => {
    const kinds = itemsOn(index, "2026-11-20").map((i) => i.kind);
    expect(kinds).toEqual(["deadline", "task", "task"]);
  });

  it("ignores items with no due date and returns nothing for empty days", () => {
    expect([...index.values()].flat().some((i) => i.kind === "task" && i.task.id === "a2")).toBe(false);
    expect(itemsOn(index, "2026-12-25")).toEqual([]);
  });
});

describe("weekNote", () => {
  const project = (deadline: string, done = false): Project => ({
    id: deadline, name: deadline, details: "", color: "#1F8A8A", start: "", deadline, done, plans: [], tasks: [], createdAt: "",
  });

  it("gives the week and the wait for the next unfinished deadline", () => {
    expect(weekNote([project("2026-11-12"), project("2026-11-25")], "2026-11-20")).toBe("Week 47 · 5 days to next deadline");
    expect(weekNote([project("2026-11-21")], "2026-11-20")).toBe("Week 47 · 1 day to next deadline");
    expect(weekNote([project("2026-11-20")], "2026-11-20")).toBe("Week 47 · deadline today");
  });

  it("says so when nothing is ahead", () => {
    expect(weekNote([project("2026-11-12"), project("2026-11-25", true)], "2026-11-20")).toBe("Week 47 · no deadlines ahead");
    expect(weekNote([], "2026-01-01")).toBe("Week 1 · no deadlines ahead");
  });
});

describe("small plans on the calendar", () => {
  const a: Project = {
    ...project("a", "2026-11-20", [{ id: "a1", text: "A one", due: "2026-11-20", done: false }]),
    plans: [
      { id: "p1", name: "Design", due: "2026-11-20", done: false },
      { id: "p2", name: "No date yet", due: "", done: false },
    ],
  };

  it("shows a plan on its finish date, between the deadline and the items", () => {
    expect(itemsOn(buildDayIndex([a]), "2026-11-20").map((i) => i.kind)).toEqual(["deadline", "plan", "task"]);
  });

  it("leaves out a plan with no finish date", () => {
    expect([...buildDayIndex([a]).values()].flat().filter((i) => i.kind === "plan")).toHaveLength(1);
  });
});
