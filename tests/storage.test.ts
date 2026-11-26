import { describe, expect, it } from "vitest";
import { DEFAULT_PROJECT_COLOR } from "../src/lib/projectColors";
import { makeSampleProjects } from "../src/lib/sampleProjects";
import { cleanLight } from "../src/skins/presets";
import {
  STORAGE_KEYS,
  loadSkinChoice,
  loadProjects,
  loadUserSkins,
  saveSkinChoice,
  saveProjects,
  saveUserSkins,
  sanitizeProjects,
  type KeyValueStore,
} from "../src/storage/storage";
import type { Project } from "../src/types";

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const NOW = "2026-11-19T09:00:00.000Z";

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    name: "Test project",
    details: "",
    color: "#2563EB",
    start: "2026-11-01",
    deadline: "2026-11-30",
    done: false,
    plans: [],
    tasks: [],
    createdAt: NOW,
    ...overrides,
  };
}

describe("projects: saving and loading", () => {
  it("returns null when nothing has been saved yet", () => {
    expect(loadProjects(new MemoryStore())).toBeNull();
  });

  it("round-trips projects with their checklists", () => {
    const store = new MemoryStore();
    const projects = makeSampleProjects("2026-11-19", NOW);
    expect(saveProjects(projects, store)).toBe(true);
    expect(loadProjects(store)).toEqual(projects);
  });

  it("uses the versioned storage key", () => {
    const store = new MemoryStore();
    saveProjects([project()], store);
    expect([...store.data.keys()]).toEqual(["wc.projects.v2"]);
  });

  it("keeps an empty list as empty (so deleting everything doesn't bring the examples back)", () => {
    const store = new MemoryStore();
    saveProjects([], store);
    expect(loadProjects(store)).toEqual([]);
  });
});

describe("projects: corrupt data never crashes", () => {
  it("returns an empty list for broken JSON and keeps a copy of the original", () => {
    const store = new MemoryStore();
    store.setItem(STORAGE_KEYS.projects, "{not json");
    expect(loadProjects(store)).toEqual([]);
    expect(store.getItem(`${STORAGE_KEYS.projects}.corrupt`)).toBe("{not json");
  });

  it("returns an empty list when the data isn't a list, and keeps a copy", () => {
    const store = new MemoryStore();
    store.setItem(STORAGE_KEYS.projects, '{"hello":"world"}');
    expect(loadProjects(store)).toEqual([]);
    expect(store.getItem(`${STORAGE_KEYS.projects}.corrupt`)).toBe('{"hello":"world"}');
  });

  it("keeps the good projects, drops the unusable ones, and keeps a copy", () => {
    const store = new MemoryStore();
    const text = JSON.stringify([project({ id: "good" }), { id: "bad", name: "No deadline" }, 42, null]);
    store.setItem(STORAGE_KEYS.projects, text);
    const loaded = loadProjects(store);
    expect(loaded?.map((p) => p.id)).toEqual(["good"]);
    expect(store.getItem(`${STORAGE_KEYS.projects}.corrupt`)).toBe(text);
  });

  it("doesn't write a backup when nothing was wrong", () => {
    const store = new MemoryStore();
    saveProjects([project()], store);
    loadProjects(store);
    expect(store.getItem(`${STORAGE_KEYS.projects}.corrupt`)).toBeNull();
  });

  it("copes with storage that is missing or throws", () => {
    expect(loadProjects(null)).toBeNull();
    expect(saveProjects([project()], null)).toBe(false);

    const broken: KeyValueStore = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("full");
      },
    };
    expect(loadProjects(broken)).toBeNull();
    expect(saveProjects([project()], broken)).toBe(false);
    expect(loadUserSkins(broken)).toEqual([]);
    expect(loadSkinChoice(broken)).toBeNull();
    expect(saveSkinChoice({ mode: "fixed", id: "clean-light" }, broken)).toBe(false);
  });
});

describe("sanitizeProjects: fixing what can be fixed", () => {
  it("fills in defaults for missing or wrong fields", () => {
    const { items, dropped } = sanitizeProjects(
      [{ id: "x", deadline: "2026-12-01", name: 7, color: "red", start: "soon", tasks: "nope", details: 5, done: "yes" }],
      NOW,
    );
    expect(dropped).toBe(0);
    expect(items[0]).toEqual({
      id: "x",
      name: "Untitled project",
      details: "",
      color: DEFAULT_PROJECT_COLOR,
      start: "",
      deadline: "2026-12-01",
      done: false,
      plans: [],
      tasks: [],
      createdAt: NOW,
    });
  });

  it("drops a project whose deadline is missing or not a real date", () => {
    for (const deadline of [undefined, "", "2026-02-30", "tomorrow", 20261201]) {
      const { items, dropped } = sanitizeProjects([{ id: "x", name: "A", deadline }], NOW);
      expect(items, String(deadline)).toEqual([]);
      expect(dropped).toBe(1);
    }
  });

  it("cleans up checklist items", () => {
    const { items } = sanitizeProjects(
      [
        project({
          tasks: [
            { id: "a", text: "Good", due: "2026-11-25", done: true },
            { id: "b", text: "Bad date", due: "2026-02-31", done: "true" as unknown as boolean },
            { id: "c", text: "   ", due: "", done: false },
            "junk" as unknown as Project["tasks"][number],
          ],
        }),
      ],
      NOW,
    );
    expect(items[0]?.tasks).toEqual([
      { id: "a", text: "Good", due: "2026-11-25", done: true },
      { id: "b", text: "Bad date", due: "", done: false },
    ]);
  });

  it("gives duplicate and missing ids new unique ids instead of losing data", () => {
    const { items, dropped } = sanitizeProjects(
      [project({ id: "same", name: "One" }), project({ id: "same", name: "Two" }), project({ id: "", name: "Three" })],
      NOW,
    );
    expect(dropped).toBe(0);
    expect(items.map((p) => p.name)).toEqual(["One", "Two", "Three"]);
    expect(new Set(items.map((p) => p.id)).size).toBe(3);
    expect(items[0]?.id).toBe("same");
  });

  it("replaces an unreadable createdAt", () => {
    const { items } = sanitizeProjects([project({ createdAt: "yesterday-ish" })], NOW);
    expect(items[0]?.createdAt).toBe(NOW);
  });
});

describe("skins in storage", () => {
  it("has nothing saved at first", () => {
    const store = new MemoryStore();
    expect(loadUserSkins(store)).toEqual([]);
    expect(loadSkinChoice(store)).toBeNull();
  });

  it("round-trips the user's skins", () => {
    const store = new MemoryStore();
    const mine = { ...cleanLight, id: "mine", name: "Mine", author: "Me" };
    expect(saveUserSkins([mine], store)).toBe(true);
    expect(loadUserSkins(store)).toEqual([mine]);
    expect([...store.data.keys()]).toEqual(["wc.skins.v1"]);
  });

  it("drops broken skins and keeps a copy", () => {
    const store = new MemoryStore();
    const text = JSON.stringify([{ ...cleanLight, id: "ok", name: "OK" }, { id: "no-tokens", name: "Broken", version: 1 }]);
    store.setItem(STORAGE_KEYS.skins, text);
    expect(loadUserSkins(store).map((s) => s.id)).toEqual(["ok"]);
    expect(store.getItem("wc.skins.v1.corrupt")).toBe(text);
  });

  it("survives corrupt skin data", () => {
    const store = new MemoryStore();
    store.setItem(STORAGE_KEYS.skins, "<<<");
    expect(loadUserSkins(store)).toEqual([]);
  });

  it("remembers a fixed skin choice", () => {
    const store = new MemoryStore();
    expect(saveSkinChoice({ mode: "fixed", id: "neon-night" }, store)).toBe(true);
    expect(loadSkinChoice(store)).toEqual({ mode: "fixed", id: "neon-night" });
    expect([...store.data.keys()]).toEqual(["wc.activeSkin.v1"]);
  });

  it("remembers a follow-the-system choice", () => {
    const store = new MemoryStore();
    const choice = { mode: "system", lightId: "paper-notebook", darkId: "retro-player" } as const;
    saveSkinChoice(choice, store);
    expect(loadSkinChoice(store)).toEqual(choice);
  });

  it("still understands a plain skin id", () => {
    const store = new MemoryStore();
    store.setItem(STORAGE_KEYS.activeSkin, JSON.stringify("clean-dark"));
    expect(loadSkinChoice(store)).toEqual({ mode: "fixed", id: "clean-dark" });
  });

  it("ignores a corrupt or incomplete skin choice", () => {
    const store = new MemoryStore();
    for (const bad of ["not json", "123", "null", "{}", '{"mode":"fixed"}', '{"mode":"system","lightId":"a"}', '{"mode":"other","id":"x"}', '""']) {
      store.setItem(STORAGE_KEYS.activeSkin, bad);
      expect(loadSkinChoice(store), bad).toBeNull();
    }
  });
});

describe("small plans in storage", () => {
  const old = { id: "p1", name: "Old", details: "", color: "#2563EB", start: "", deadline: "2026-11-30", done: false, tasks: [{ id: "t", text: "kept", due: "", done: true }], createdAt: NOW };

  it("brings projects over from the format without small plans, leaving the old copy as it was", () => {
    const store = new MemoryStore();
    const text = JSON.stringify([old]);
    store.setItem(STORAGE_KEYS.projectsV1, text);
    const loaded = loadProjects(store);
    expect(loaded).toEqual([{ ...old, plans: [] }]);
    saveProjects(loaded ?? [], store);
    expect(store.getItem(STORAGE_KEYS.projectsV1)).toBe(text);
    expect(loadProjects(store)).toEqual([{ ...old, plans: [] }]);
  });

  it("uses the new format once there is one, even if it's empty", () => {
    const store = new MemoryStore();
    store.setItem(STORAGE_KEYS.projectsV1, JSON.stringify([old]));
    saveProjects([], store);
    expect(loadProjects(store)).toEqual([]);
  });

  it("keeps plans and which items belong to them", () => {
    const store = new MemoryStore();
    const saved = project({
      plans: [{ id: "d", name: "Design", due: "2026-11-20", done: false }],
      tasks: [{ id: "t", text: "x", due: "", done: false, planId: "d" }],
    });
    saveProjects([saved], store);
    expect(loadProjects(store)).toEqual([saved]);
  });

  it("repairs bad plans, and an item pointing nowhere stands on its own", () => {
    const { items } = sanitizeProjects(
      [
        {
          ...old,
          plans: ["junk", { id: "d", name: "  ", due: "someday", done: "yes" }, { id: "d", name: "Second", due: "2026-11-20", done: true }],
          tasks: [
            { id: "a", text: "in the first", due: "", done: false, planId: "d" },
            { id: "b", text: "lost", due: "", done: false, planId: "gone" },
          ],
        },
      ],
      NOW,
    );
    expect(items[0]?.plans.map(({ name, due, done }) => ({ name, due, done }))).toEqual([
      { name: "Untitled plan", due: "", done: false },
      { name: "Second", due: "2026-11-20", done: true },
    ]);
    expect(new Set(items[0]?.plans.map((p) => p.id)).size).toBe(2);
    expect(items[0]?.tasks.map((t) => t.planId)).toEqual(["d", undefined]);
  });
});
