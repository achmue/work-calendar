import { describe, expect, it } from "vitest";
import { daysBetween, isISODate } from "../src/lib/dates";
import { isHexColor } from "../src/lib/projectColors";
import { makeSampleProjects } from "../src/lib/sampleProjects";
import { getProjectStatus } from "../src/lib/status";
import { sanitizeProjects } from "../src/storage/storage";
import { projectsReducer } from "../src/state/useProjects";
import type { Project, Task } from "../src/types";

const NOW = "2026-11-19T09:00:00.000Z";

function task(id: string, overrides: Partial<Task> = {}): Task {
  return { id, text: `Item ${id}`, due: "", done: false, ...overrides };
}

function project(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    name: `Project ${id}`,
    details: "",
    color: "#2563EB",
    start: "",
    deadline: "2026-12-01",
    done: false,
    tasks: [],
    createdAt: NOW,
    ...overrides,
  };
}

describe("projectsReducer", () => {
  it("adds a project at the end", () => {
    const result = projectsReducer([project("a")], { type: "add", project: project("b") });
    expect(result.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("updates only the project it's told to", () => {
    const state = [project("a"), project("b")];
    const result = projectsReducer(state, { type: "update", id: "b", patch: { name: "Renamed", done: true } });
    expect(result[0]).toBe(state[0]);
    expect(result[1]).toMatchObject({ id: "b", name: "Renamed", done: true, deadline: "2026-12-01" });
  });

  it("deletes a project", () => {
    const result = projectsReducer([project("a"), project("b")], { type: "delete", id: "a" });
    expect(result.map((p) => p.id)).toEqual(["b"]);
  });

  it("adds, updates and deletes checklist items", () => {
    let state = [project("a", { tasks: [task("t1")] }), project("b")];

    state = projectsReducer(state, { type: "addTask", projectId: "a", task: task("t2", { due: "2026-11-25" }) });
    expect(state[0]?.tasks.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(state[1]?.tasks).toEqual([]);

    state = projectsReducer(state, { type: "updateTask", projectId: "a", taskId: "t1", patch: { done: true, text: "Changed" } });
    expect(state[0]?.tasks[0]).toEqual({ id: "t1", text: "Changed", due: "", done: true });
    expect(state[0]?.tasks[1]?.done).toBe(false);

    state = projectsReducer(state, { type: "deleteTask", projectId: "a", taskId: "t1" });
    expect(state[0]?.tasks.map((t) => t.id)).toEqual(["t2"]);
  });

  it("ignores ids that don't exist", () => {
    const state = [project("a", { tasks: [task("t1")] })];
    expect(projectsReducer(state, { type: "update", id: "zzz", patch: { name: "x" } })).toEqual(state);
    expect(projectsReducer(state, { type: "delete", id: "zzz" })).toEqual(state);
    expect(projectsReducer(state, { type: "addTask", projectId: "zzz", task: task("t9") })).toEqual(state);
    expect(projectsReducer(state, { type: "updateTask", projectId: "a", taskId: "zzz", patch: { done: true } })).toEqual(state);
    expect(projectsReducer(state, { type: "deleteTask", projectId: "a", taskId: "zzz" })).toEqual(state);
  });

  it("never changes the state it was given", () => {
    const state = [project("a", { tasks: [task("t1")] })];
    const snapshot = structuredClone(state);
    projectsReducer(state, { type: "update", id: "a", patch: { name: "New" } });
    projectsReducer(state, { type: "updateTask", projectId: "a", taskId: "t1", patch: { done: true } });
    projectsReducer(state, { type: "addTask", projectId: "a", task: task("t2") });
    projectsReducer(state, { type: "deleteTask", projectId: "a", taskId: "t1" });
    projectsReducer(state, { type: "delete", id: "a" });
    expect(state).toEqual(snapshot);
  });
});

describe("example projects for first run", () => {
  const today = "2026-11-19";
  const samples = makeSampleProjects(today, NOW);

  it("makes two projects, clearly labelled as examples", () => {
    expect(samples).toHaveLength(2);
    for (const sample of samples) {
      expect(sample.name.startsWith("Example:")).toBe(true);
      expect(sample.details).toMatch(/example/i);
    }
  });

  it("is valid data: real dates, hex colours, unique ids, start before deadline", () => {
    const ids = new Set<string>();
    for (const sample of samples) {
      expect(isHexColor(sample.color)).toBe(true);
      expect(isISODate(sample.deadline)).toBe(true);
      expect(isISODate(sample.start)).toBe(true);
      expect(daysBetween(sample.start, sample.deadline)).toBeGreaterThan(0);
      expect(sample.tasks.length).toBeGreaterThan(0);
      ids.add(sample.id);
      for (const t of sample.tasks) {
        ids.add(t.id);
        if (t.due !== "") expect(isISODate(t.due)).toBe(true);
      }
    }
    expect(ids.size).toBe(2 + samples.reduce((n, s) => n + s.tasks.length, 0));
  });

  it("survives storage validation unchanged", () => {
    const { items, dropped } = sanitizeProjects(samples, NOW);
    expect(dropped).toBe(0);
    expect(items).toEqual(samples);
  });

  it("shows off different statuses and dates relative to today", () => {
    expect(getProjectStatus(samples[0]!, today).label).toBe("Due in 5 days");
    expect(getProjectStatus(samples[1]!, today).label).toBe("25 days left");
    // One undone item is already overdue, one is done, and one has no date at all
    const tasks = samples.flatMap((s) => s.tasks);
    expect(tasks.some((t) => !t.done && t.due !== "" && t.due < today)).toBe(true);
    expect(tasks.some((t) => t.done)).toBe(true);
    expect(tasks.some((t) => t.due === "")).toBe(true);
  });

  it("moves with the date it is given", () => {
    const later = makeSampleProjects("2027-03-01", NOW);
    expect(later[0]?.deadline).toBe("2027-03-06");
  });
});
