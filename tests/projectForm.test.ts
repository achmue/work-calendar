import { describe, expect, it } from "vitest";
import { validateProjectForm } from "../src/lib/projectForm";

describe("validateProjectForm", () => {
  it("accepts a name and a deadline", () => {
    expect(validateProjectForm({ name: "Plan", start: "", deadline: "2026-12-01" })).toEqual({});
  });

  it("accepts a start on or before the deadline", () => {
    expect(validateProjectForm({ name: "Plan", start: "2026-12-01", deadline: "2026-12-01" })).toEqual({});
    expect(validateProjectForm({ name: "Plan", start: "2026-11-01", deadline: "2026-12-01" })).toEqual({});
  });

  it("requires a name (spaces don't count)", () => {
    expect(validateProjectForm({ name: "", start: "", deadline: "2026-12-01" }).name).toBeTruthy();
    expect(validateProjectForm({ name: "   ", start: "", deadline: "2026-12-01" }).name).toBeTruthy();
  });

  it("requires a real deadline", () => {
    expect(validateProjectForm({ name: "A", start: "", deadline: "" }).deadline).toBeTruthy();
    expect(validateProjectForm({ name: "A", start: "", deadline: "2026-02-30" }).deadline).toBeTruthy();
  });

  it("rejects a start date after the deadline", () => {
    const errors = validateProjectForm({ name: "A", start: "2026-12-02", deadline: "2026-12-01" });
    expect(errors.start).toMatch(/after the deadline/);
    expect(errors.name).toBeUndefined();
    expect(errors.deadline).toBeUndefined();
  });

  it("doesn't blame the start date when the deadline is the problem", () => {
    const errors = validateProjectForm({ name: "A", start: "2026-12-02", deadline: "" });
    expect(errors.deadline).toBeTruthy();
    expect(errors.start).toBeUndefined();
  });

  it("reports several problems at once", () => {
    const errors = validateProjectForm({ name: "", start: "", deadline: "" });
    expect(Object.keys(errors).sort()).toEqual(["deadline", "name"]);
  });
});
