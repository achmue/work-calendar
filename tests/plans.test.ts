import { describe, expect, it } from "vitest";
import { draftsToPlans, looseItems, moveItems, planItems, sortPlans, validatePlanDrafts } from "../src/lib/plans";
import type { Plan, Project, Task } from "../src/types";

const plan = (id: string, due = "", done = false): Plan => ({ id, name: id, due, done });
const task = (id: string, planId?: string): Task => ({ id, text: id, due: "", done: false, ...(planId ? { planId } : {}) });

describe("sorting and grouping", () => {
  it("puts the soonest finish date first and undated plans last", () => {
    expect(sortPlans([plan("none"), plan("late", "2026-12-01"), plan("soon", "2026-11-01")]).map((p) => p.id)).toEqual(["soon", "late", "none"]);
  });

  it("splits items into their plans and the ones standing alone", () => {
    const project = { plans: [plan("a")], tasks: [task("1", "a"), task("2"), task("3", "missing")] };
    expect(planItems(project, "a").map((t) => t.id)).toEqual(["1"]);
    expect(looseItems(project).map((t) => t.id)).toEqual(["2", "3"]);
  });
});

describe("the small plan fields in a pop-up", () => {
  const row = (id: string, name: string, due = "") => ({ id, name, due });

  it("ignores empty rows, but a date needs a name", () => {
    expect(validatePlanDrafts([row("1", ""), row("2", "Design"), row("3", " ", "2026-11-20")])).toEqual({ "3": "Give this small plan a name." });
    expect(validatePlanDrafts([row("4", "x", "soon")])).toEqual({ "4": "That finish date isn't valid." });
  });

  it("turns rows into plans, keeping what was already finished", () => {
    const plans = draftsToPlans([row("1", " Design ", "2026-11-20"), row("2", ""), row("3", "New", "bad")], [plan("1", "", true)]);
    expect(plans).toEqual([
      { id: "1", name: "Design", due: "2026-11-20", done: true },
      { id: "3", name: "New", due: "", done: false },
    ]);
  });
});

describe("moving items", () => {
  const start: Project = {
    id: "p", name: "P", details: "", color: "#1F8A8A", start: "", deadline: "2026-12-01", done: false, createdAt: "",
    plans: [plan("a"), plan("b")],
    tasks: [task("1"), task("2", "a"), task("3"), task("4", "b")],
  };
  const where = (project: Project) => project.tasks.map((t) => `${t.id}:${t.planId ?? "-"}`);

  it("puts items into a plan, at the end of its list, keeping their order", () => {
    expect(where(moveItems(start, ["3", "1"], "a"))).toEqual(["2:a", "4:b", "1:a", "3:a"]);
  });

  it("takes an item out of its plan altogether", () => {
    const next = moveItems(start, ["2"], "");
    expect(where(next)).toEqual(["1:-", "3:-", "4:b", "2:-"]);
    expect(next.tasks[3]).not.toHaveProperty("planId");
  });

  it("keeps everything else about an item", () => {
    const project = { ...start, tasks: [{ id: "x", text: "Keep me", due: "2026-11-20", done: true }] };
    expect(moveItems(project, ["x"], "b").tasks).toEqual([{ id: "x", text: "Keep me", due: "2026-11-20", done: true, planId: "b" }]);
  });

  it("changes nothing for a plan that isn't there, an item already there, or an unknown item", () => {
    expect(moveItems(start, ["1"], "missing")).toBe(start);
    expect(moveItems(start, ["2"], "a")).toBe(start);
    expect(moveItems(start, ["nope"], "a")).toBe(start);
  });
});
