import { describe, expect, it } from "vitest";
import {
  barStart,
  dayOffset,
  isWeekend,
  monthSegments,
  rangeDates,
  sortForTimeline,
  timelineRange,
} from "../src/lib/timeline";
import type { Project } from "../src/types";

const TODAY = "2026-11-19";

function project(id: string, overrides: Partial<Project> = {}): Project {
  return { id, name: id, details: "", color: "#2563EB", start: "", deadline: "2026-12-01", done: false, tasks: [], createdAt: "", ...overrides };
}

describe("barStart", () => {
  it("uses the start date when there is one", () => {
    expect(barStart(project("a", { start: "2026-11-01" }))).toBe("2026-11-01");
  });

  it("falls back to the earliest checklist date, then the deadline", () => {
    const withTasks = project("a", {
      tasks: [
        { id: "1", text: "x", due: "2026-11-25", done: false },
        { id: "2", text: "y", due: "2026-11-20", done: false },
        { id: "3", text: "z", due: "", done: false },
      ],
    });
    expect(barStart(withTasks)).toBe("2026-11-20");
    expect(barStart(project("b"))).toBe("2026-12-01");
  });

  it("never starts after the deadline", () => {
    expect(barStart(project("a", { start: "2026-12-20" }))).toBe("2026-12-01");
    const late = project("b", { tasks: [{ id: "1", text: "x", due: "2027-01-05", done: false }] });
    expect(barStart(late)).toBe("2026-12-01");
  });
});

describe("timelineRange", () => {
  it("covers a window around today even with no projects", () => {
    const range = timelineRange([], TODAY);
    expect(range.start).toBe("2026-10-29"); // 14 days before today (5 Nov) plus 7 days of padding
    expect(range.days).toBeGreaterThan(60);
    expect(dayOffset(range, TODAY)).toBeGreaterThanOrEqual(14);
  });

  it("stretches to include every bar and dated item, with padding", () => {
    const early = project("early", { start: "2025-06-10", deadline: "2025-07-01" });
    const late = project("late", { deadline: "2027-03-15", tasks: [{ id: "1", text: "x", due: "2027-03-01", done: false }] });
    const range = timelineRange([early, late], TODAY);
    expect(range.start < "2025-06-10").toBe(true);
    expect(range.end > "2027-03-15").toBe(true);
    expect(rangeDates(range)).toHaveLength(range.days);
    expect(rangeDates(range)[0]).toBe(range.start);
    expect(rangeDates(range).at(-1)).toBe(range.end);
  });

  it("gives every date a column", () => {
    const range = timelineRange([project("a", { start: "2026-11-01" })], TODAY);
    for (const date of ["2026-11-01", TODAY, "2026-12-01"]) {
      const offset = dayOffset(range, date);
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThan(range.days);
    }
  });
});

describe("helpers", () => {
  it("knows weekends", () => {
    expect(isWeekend("2026-11-20")).toBe(false); // Friday
    expect(isWeekend("2026-11-21")).toBe(true); // Saturday
    expect(isWeekend("2026-11-22")).toBe(true); // Sunday
    expect(isWeekend("2026-11-23")).toBe(false); // Monday
  });

  it("sorts by when the bar begins", () => {
    const sorted = sortForTimeline([
      project("late", { start: "2026-12-01", deadline: "2026-12-20" }),
      project("early", { start: "2026-11-01", deadline: "2026-12-30" }),
      project("middle", { start: "2026-11-15", deadline: "2026-11-20" }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["early", "middle", "late"]);
  });

  it("splits the range into month labels that add up to every day", () => {
    const range = timelineRange([], TODAY);
    const segments = monthSegments(range);
    expect(segments.reduce((n, s) => n + s.days, 0)).toBe(range.days);
    expect(segments[0]?.offset).toBe(0);
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i]?.offset).toBe((segments[i - 1]?.offset ?? 0) + (segments[i - 1]?.days ?? 0));
    }
    expect(segments.map((s) => s.label)).toContain("Nov 2026");
  });
});
