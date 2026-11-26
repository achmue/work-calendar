import { describe, expect, it } from "vitest";
import { monthGrid } from "../src/lib/calendar";
import { weekSpans } from "../src/lib/weekSpans";
import type { Project } from "../src/types";

const project = (id: string, start: string, deadline: string, extra: Partial<Project> = {}): Project => ({
  id, name: id, details: "", color: "#1F8A8A", start, deadline, done: false, tasks: [], createdAt: "2026-01-01T00:00:00.000Z", ...extra,
});
const weeks = monthGrid("2026-11-01"); // Mon 26 Oct ... Sun 6 Dec

describe("weekSpans", () => {
  it("cuts a project into one stroke per week, marking where it begins", () => {
    const spans = weekSpans([project("a", "2026-11-12", "2026-11-24")], weeks);
    expect(spans.map((w) => w.length)).toEqual([0, 0, 1, 1, 1, 0]);
    expect(spans[2]?.[0]).toMatchObject({ from: 3, to: 6, starts: true });
    expect(spans[3]?.[0]).toMatchObject({ from: 0, to: 6, starts: false });
    expect(spans[4]?.[0]).toMatchObject({ from: 0, to: 1, starts: false });
  });

  it("keeps overlapping projects in their own rows, the same row every week", () => {
    const spans = weekSpans([project("a", "2026-11-02", "2026-11-20"), project("b", "2026-11-09", "2026-11-27")], weeks);
    expect(spans[2]?.map((s) => [s.project.id, s.lane])).toEqual([["a", 0], ["b", 1]]);
    expect(spans[4]?.map((s) => [s.project.id, s.lane])).toEqual([["b", 1]]);
  });

  it("leaves out what doesn't fit in the rows allowed", () => {
    const three = ["a", "b", "c"].map((id) => project(id, "2026-11-09", "2026-11-13"));
    expect(weekSpans(three, weeks, 2)[2]?.map((s) => s.project.id)).toEqual(["a", "b"]);
  });

  it("ignores finished projects and ones outside the month shown", () => {
    const spans = weekSpans(
      [project("done", "2026-11-02", "2026-11-06", { done: true }), project("far", "2027-02-01", "2027-02-05")],
      weeks,
    );
    expect(spans.flat()).toEqual([]);
  });

  it("starts a project with no start date at its first dated item", () => {
    const p = project("a", "", "2026-11-13", { tasks: [{ id: "t", text: "x", due: "2026-11-10", done: false }] });
    expect(weekSpans([p], weeks)[2]?.[0]).toMatchObject({ from: 1, to: 4 });
  });
});
