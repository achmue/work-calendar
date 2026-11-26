import { describe, expect, it } from "vitest";
import {
  BACKUP_VERSION,
  buildBackup,
  describeBackup,
  mergeProjects,
  mergeSkins,
  parseBackup,
  serializeBackup,
} from "../src/lib/backup";
import { makeSampleProjects } from "../src/lib/sampleProjects";
import { formatProblems } from "../src/lib/problems";
import { cleanLight } from "../src/skins/presets";
import type { Project, Skin } from "../src/types";

const NOW = new Date("2026-11-19T10:30:00.000Z");
const projects = makeSampleProjects("2026-11-19", NOW.toISOString());
const mySkin: Skin = { ...cleanLight, id: "user-1", name: "Mine" };

function project(id: string, name = id): Project {
  return { id, name, details: "", color: "#2563EB", start: "", deadline: "2026-12-01", done: false, plans: [], tasks: [], createdAt: NOW.toISOString() };
}

function parse(text: string) {
  const result = parseBackup(text);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
function failure(text: string) {
  const result = parseBackup(text);
  expect(result.ok).toBe(false);
  return result.ok ? "" : result.error;
}

describe("making and reading a backup", () => {
  it("round-trips projects, checklists and the user's skins", () => {
    const text = serializeBackup(buildBackup(projects, [mySkin], NOW));
    expect(parse(text)).toEqual({
      projects, skins: [mySkin], exportedAt: NOW.toISOString(), skippedProjects: 0, skippedSkins: 0,
    });
  });

  it("labels the file so it can be recognised later", () => {
    const backup = JSON.parse(serializeBackup(buildBackup([], [], NOW)));
    expect(backup).toMatchObject({ app: "work-calendar", version: BACKUP_VERSION, exportedAt: NOW.toISOString(), projects: [], skins: [] });
  });

  it("accepts an empty backup and one without a skins list", () => {
    expect(parse(serializeBackup(buildBackup([], [], NOW))).projects).toEqual([]);
    const noSkins = JSON.stringify({ app: "work-calendar", version: 1, projects: [] });
    expect(parse(noSkins)).toMatchObject({ projects: [], skins: [], exportedAt: null });
  });
});

describe("refusing files that aren't usable backups", () => {
  it("explains broken or unrelated files", () => {
    expect(failure("not json")).toMatch(/valid JSON/);
    expect(failure("")).toMatch(/valid JSON/);
    expect(failure("[]")).toMatch(/doesn't look like a Work Calendar backup/);
    expect(failure("null")).toMatch(/doesn't look like a Work Calendar backup/);
    expect(failure('{"hello":"world"}')).toMatch(/doesn't look like a Work Calendar backup/);
    expect(failure('{"app":"other-app","version":1,"projects":[]}')).toMatch(/doesn't look like/);
  });

  it("refuses a backup from a newer version, or with no version", () => {
    expect(failure(`{"app":"work-calendar","version":${BACKUP_VERSION + 1},"projects":[]}`)).toMatch(/newer version/);
    expect(failure('{"app":"work-calendar","projects":[]}')).toMatch(/missing its version/);
    expect(failure('{"app":"work-calendar","version":"1","projects":[]}')).toMatch(/missing its version/);
    expect(failure('{"app":"work-calendar","version":0,"projects":[]}')).toMatch(/missing its version/);
  });

  it("refuses a backup with no projects list", () => {
    expect(failure('{"app":"work-calendar","version":1}')).toMatch(/no "projects" list/);
    expect(failure('{"app":"work-calendar","version":1,"projects":"x"}')).toMatch(/no "projects" list/);
    expect(failure('{"app":"work-calendar","version":1,"projects":[],"skins":{}}')).toMatch(/"skins" should be a list/);
  });
});

describe("validating what's inside a backup", () => {
  const wrap = (projectsList: unknown[], skinsList: unknown[] = []) =>
    JSON.stringify({ app: "work-calendar", version: 1, projects: projectsList, skins: skinsList });

  it("keeps usable projects and counts the ones it had to leave out", () => {
    const value = parse(wrap([project("good"), { id: "bad", name: "No deadline" }, 42, null, "x"]));
    expect(value.projects.map((p) => p.id)).toEqual(["good"]);
    expect(value.skippedProjects).toBe(4);
  });

  it("repairs fixable problems the same way loading from the browser does", () => {
    const value = parse(wrap([{ id: "x", name: "  ", deadline: "2026-12-01", color: "nope", start: "never", tasks: [{ id: "t", text: "ok", due: "31/12", done: "yes" }, { text: "" }] }]));
    expect(value.skippedProjects).toBe(0);
    expect(value.projects[0]).toMatchObject({ name: "Untitled project", start: "", tasks: [{ id: "t", text: "ok", due: "", done: false }] });
    expect(value.projects[0]?.color).toMatch(/^#/);
  });

  it("validates skins as strictly as a skin file: a bad token falls back to a default", () => {
    const value = parse(wrap([], [{ ...mySkin, tokens: { ...mySkin.tokens, accent: "red; } body{display:none}" } }, { id: "no-tokens", name: "Broken", version: 1 }]));
    expect(value.skippedSkins).toBe(1);
    expect(value.skins).toHaveLength(1);
    expect(value.skins[0]?.tokens.accent).toBe(cleanLight.tokens.accent);
  });

  it("never lets a backup overwrite a built-in skin", () => {
    const value = parse(wrap([], [{ ...mySkin, id: "night-cork" }]));
    expect(value.skins).toHaveLength(1);
    expect(value.skins[0]?.id).not.toBe("night-cork");
    expect(value.skins[0]?.id.startsWith("user-")).toBe(true);
  });

  it("ignores unknown extra fields on projects", () => {
    const value = parse(wrap([{ ...project("a"), evil: "<script>alert(1)</script>", __proto__: { polluted: 1 } }]));
    expect(JSON.stringify(value.projects)).not.toMatch(/script|evil|polluted/);
  });

  it("refuses an absurdly large file", () => {
    expect(failure("x".repeat(25_000_001))).toMatch(/too big/);
  });
});

describe("restoring: merge and replace", () => {
  const here = [project("a", "Mine A"), project("b", "Mine B")];

  it("merge adds new projects and keeps ones already here exactly as they are", () => {
    const incoming = [project("b", "From file B (older copy)"), project("c", "From file C")];
    const result = mergeProjects(here, incoming);
    expect(result.items.map((p) => p.name)).toEqual(["Mine A", "Mine B", "From file C"]);
    expect(result).toMatchObject({ added: 1, skipped: 1 });
  });

  it("merge with nothing new changes nothing", () => {
    const result = mergeProjects(here, [project("a"), project("b")]);
    expect(result).toMatchObject({ added: 0, skipped: 2 });
    expect(result.items).toEqual(here);
  });

  it("merge into an empty list adds everything, and handles duplicates inside the file", () => {
    const result = mergeProjects([], [project("x"), project("x"), project("y")]);
    expect(result.items.map((p) => p.id)).toEqual(["x", "y"]);
    expect(result).toMatchObject({ added: 2, skipped: 1 });
  });

  it("merge doesn't change the lists it was given", () => {
    const existing = [project("a")];
    const incoming = [project("z")];
    mergeProjects(existing, incoming);
    expect(existing).toHaveLength(1);
    expect(incoming).toHaveLength(1);
  });

  it("merges skins the same way", () => {
    const result = mergeSkins([mySkin], [mySkin, { ...mySkin, id: "user-2", name: "Other" }]);
    expect(result.items.map((s) => s.id)).toEqual(["user-1", "user-2"]);
    expect(result).toMatchObject({ added: 1, skipped: 1 });
  });

  it("replace is simply using what's in the file (the app swaps the lists)", () => {
    const value = parse(serializeBackup(buildBackup([project("only")], [], NOW)));
    expect(value.projects.map((p) => p.id)).toEqual(["only"]);
  });
});

describe("describeBackup", () => {
  it("summarises what's inside with correct plurals", () => {
    const value = parse(serializeBackup(buildBackup(projects, [mySkin], NOW)));
    expect(describeBackup(value)).toBe("2 projects (2 small plans, 9 checklist items) and 1 skin");
    expect(describeBackup({ ...value, projects: [project("a")], skins: [] })).toBe("1 project (0 checklist items) and 0 skins");
    expect(describeBackup({ ...value, projects: [{ ...project("a"), tasks: [{ id: "t", text: "x", due: "", done: false }] }], skins: [mySkin, mySkin] })).toBe("1 project (1 checklist item) and 2 skins");
  });
});

describe("formatProblems", () => {
  it("builds a bulleted message and says how many more there were", () => {
    expect(formatProblems("Nope:", ["a", "b"])).toBe("Nope:\n• a\n• b");
    expect(formatProblems("Nope:", ["a", "b", "c"], 2)).toBe("Nope:\n• a\n• b\n…and 1 more.");
  });
});

describe("small plans in a backup", () => {
  const withPlans: Project = {
    ...project("a"),
    plans: [{ id: "d", name: "Design", due: "2026-11-20", done: false }],
    tasks: [{ id: "t", text: "x", due: "", done: false, planId: "d" }],
  };

  it("keeps them, and says so", () => {
    const value = parse(serializeBackup(buildBackup([withPlans], [], NOW)));
    expect(value.projects).toEqual([withPlans]);
    expect(describeBackup(value)).toBe("1 project (1 small plan, 1 checklist item) and 0 skins");
  });

  it("still restores a backup made before small plans", () => {
    const { plans: _plans, ...before } = project("old");
    const value = parse(JSON.stringify({ app: "work-calendar", version: 1, projects: [before] }));
    expect(value.projects[0]?.plans).toEqual([]);
  });
});
