import { describe, expect, it } from "vitest";
import { assignLanes } from "../src/lib/lanes";
import { timelineRange } from "../src/lib/timeline";

describe("assignLanes", () => {
  it("puts spans that don't touch in the same lane", () => {
    expect(assignLanes([{ start: "2026-11-02", end: "2026-11-12" }, { start: "2026-11-17", end: "2026-11-30" }])).toEqual([0, 0]);
  });

  it("puts overlapping spans in different lanes", () => {
    expect(assignLanes([{ start: "2026-11-06", end: "2026-11-25" }, { start: "2026-11-17", end: "2026-12-04" }])).toEqual([0, 1]);
  });

  it("leaves a blank day between spans in one lane, so two strips never run together", () => {
    // the first ends on the 10th; starting on the 11th would touch it, the 12th leaves a gap
    expect(assignLanes([{ start: "2026-11-01", end: "2026-11-10" }, { start: "2026-11-11", end: "2026-11-15" }])).toEqual([0, 1]);
    expect(assignLanes([{ start: "2026-11-01", end: "2026-11-10" }, { start: "2026-11-12", end: "2026-11-15" }])).toEqual([0, 0]);
  });

  it("returns lanes in the order the spans were given, whatever their dates", () => {
    const lanes = assignLanes([
      { start: "2026-11-17", end: "2026-12-04" },
      { start: "2026-11-06", end: "2026-11-25" },
      { start: "2026-11-02", end: "2026-11-12" },
    ]);
    expect(lanes).toEqual([0, 1, 0]);
  });

  it("reuses the first lane that is free, not a new one (shorter spans that start together go first)", () => {
    const lanes = assignLanes([
      { start: "2026-11-01", end: "2026-11-30" },
      { start: "2026-11-01", end: "2026-11-05" },
      { start: "2026-11-10", end: "2026-11-15" },
    ]);
    expect(lanes).toEqual([1, 0, 0]);
  });

  it("handles no spans", () => {
    expect(assignLanes([])).toEqual([]);
  });
});

describe("timelineRange window", () => {
  it("can look further back and ahead than the default", () => {
    const narrow = timelineRange([], "2026-11-20");
    const wide = timelineRange([], "2026-11-20", { before: 30, after: 120 });
    expect(wide.days).toBeGreaterThan(narrow.days);
    expect(wide.start < narrow.start).toBe(true);
    expect(wide.end > narrow.end).toBe(true);
  });
});
