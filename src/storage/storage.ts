import { isISODate } from "../lib/dates";
import { newId } from "../lib/id";
import { DEFAULT_PROJECT_COLOR, isHexColor } from "../lib/projectColors";
import { sanitizeSkin } from "../lib/skinSchema";
import type { Plan, Project, Skin, SkinChoice, Task } from "../types";

// The ONLY place the app touches localStorage. Everything else goes through
// these functions so storage can be swapped for a backend later.
//
// Versioning: the version is part of the key. If the data format changes, add the
// next version and a migration here that reads the one before, converts it, and
// leaves the old key alone. Never silently change what a version means.
//
//   wc.projects.v2  projects have small plans (loadProjects reads v1 until v2 exists)
//   wc.projects.v1  projects with a plain checklist; kept as it was
//
// Loading never throws. Missing data gives null ("nothing saved yet"); corrupt
// data gives an empty list and the original text is copied to "<key>.corrupt"
// first, so a bad save can't quietly wipe someone's work.

export const STORAGE_KEYS = {
  projects: "wc.projects.v2",
  /** The format before small plans. Only ever read. */
  projectsV1: "wc.projects.v1",
  skins: "wc.skins.v1",
  activeSkin: "wc.activeSkin.v1",
  // Added later, for the optional sound effects switch
  sound: "wc.sound.v1",
} as const;

/** The small slice of the Storage API we need. Tests pass an in-memory one. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** The browser's localStorage, or null if it's missing or blocked (private mode, etc.). */
export function getBrowserStore(): KeyValueStore | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------- low level

function readText(store: KeyValueStore, key: string): string | null {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

function writeText(store: KeyValueStore | null, key: string, value: string): boolean {
  if (!store) return false;
  try {
    store.setItem(key, value);
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

function quarantine(store: KeyValueStore, key: string, text: string): void {
  writeText(store, `${key}.corrupt`, text);
}

interface Sanitized<T> {
  items: T[];
  /** How many entries had to be thrown away. */
  dropped: number;
}

function loadList<T>(
  key: string,
  sanitize: (raw: readonly unknown[]) => Sanitized<T>,
  store: KeyValueStore | null,
): T[] | null {
  if (!store) return null;
  const text = readText(store, key);
  if (text === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    quarantine(store, key, text);
    return [];
  }
  if (!Array.isArray(parsed)) {
    quarantine(store, key, text);
    return [];
  }

  const { items, dropped } = sanitize(parsed);
  if (dropped > 0) quarantine(store, key, text);
  return items;
}

/** Use `candidate` if it's a usable id nobody has taken yet, else make a new one. */
function uniqueId(candidate: unknown, taken: Set<string>): string {
  let id = typeof candidate === "string" && candidate.trim() !== "" ? candidate : newId();
  while (taken.has(id)) id = newId();
  taken.add(id);
  return id;
}

// ----------------------------------------------------------------- projects

function sanitizePlan(raw: unknown, taken: Set<string>): Plan | null {
  if (!isRecord(raw)) return null;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  return {
    id: uniqueId(raw.id, taken),
    name: name === "" ? "Untitled plan" : name,
    due: isISODate(raw.due) ? raw.due : "",
    done: raw.done === true,
  };
}

function sanitizeTask(raw: unknown, taken: Set<string>): Task | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.text !== "string" || raw.text.trim() === "") return null;
  return {
    id: uniqueId(raw.id, taken),
    text: raw.text,
    due: isISODate(raw.due) ? raw.due : "",
    done: raw.done === true,
  };
}

function sanitizeProject(raw: unknown, taken: Set<string>, now: string): Project | null {
  if (!isRecord(raw)) return null;
  if (!isISODate(raw.deadline)) return null; // required, and we can't invent one

  const planIds = new Set<string>();
  const plans: Plan[] = [];
  if (Array.isArray(raw.plans)) {
    for (const entry of raw.plans) {
      const plan = sanitizePlan(entry, planIds);
      if (plan) plans.push(plan);
    }
  }

  const taskIds = new Set<string>();
  const tasks: Task[] = [];
  if (Array.isArray(raw.tasks)) {
    for (const entry of raw.tasks) {
      const task = sanitizeTask(entry, taskIds);
      if (!task) continue;
      // An item pointing at a plan that isn't there simply stands on its own.
      const planId = (entry as Record<string, unknown>).planId;
      if (typeof planId === "string" && planIds.has(planId)) task.planId = planId;
      tasks.push(task);
    }
  }

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  return {
    id: uniqueId(raw.id, taken),
    name: name === "" ? "Untitled project" : name,
    details: typeof raw.details === "string" ? raw.details : "",
    color: isHexColor(raw.color) ? raw.color : DEFAULT_PROJECT_COLOR,
    start: isISODate(raw.start) ? raw.start : "",
    deadline: raw.deadline,
    done: raw.done === true,
    plans,
    tasks,
    createdAt:
      typeof raw.createdAt === "string" && !Number.isNaN(Date.parse(raw.createdAt))
        ? raw.createdAt
        : now,
  };
}

/**
 * Clean up unknown data into valid projects. Fixes what it can (bad colour,
 * bad task date, duplicate id) and drops entries that can't be saved
 * (not an object, no valid deadline).
 */
export function sanitizeProjects(
  raw: readonly unknown[],
  now: string = new Date().toISOString(),
): Sanitized<Project> {
  const taken = new Set<string>();
  const items: Project[] = [];
  let dropped = 0;
  for (const entry of raw) {
    const project = sanitizeProject(entry, taken, now);
    if (project) items.push(project);
    else dropped += 1;
  }
  return { items, dropped };
}

/** Saved projects, or null if nothing has been saved yet (first run). */
export function loadProjects(store: KeyValueStore | null = getBrowserStore()): Project[] | null {
  const read = (key: string) => loadList(key, (raw) => sanitizeProjects(raw), store);
  // Migration: until something has been saved in the new format, bring over the old one.
  // (Reading it fills in "no small plans"; the old key stays exactly as it was.)
  return read(STORAGE_KEYS.projects) ?? read(STORAGE_KEYS.projectsV1);
}

/** Returns false if the save didn't work (storage full or blocked). */
export function saveProjects(
  projects: readonly Project[],
  store: KeyValueStore | null = getBrowserStore(),
): boolean {
  return writeText(store, STORAGE_KEYS.projects, JSON.stringify(projects));
}

// -------------------------------------------------------------------- skins

export function sanitizeSkins(raw: readonly unknown[]): Sanitized<Skin> {
  const seen = new Set<string>();
  const items: Skin[] = [];
  let dropped = 0;
  for (const entry of raw) {
    const skin = sanitizeSkin(entry);
    if (skin && !seen.has(skin.id)) {
      seen.add(skin.id);
      items.push(skin);
    } else {
      dropped += 1;
    }
  }
  return { items, dropped };
}

/** The user's own skins (not the built-in presets). Empty if none saved. */
export function loadUserSkins(store: KeyValueStore | null = getBrowserStore()): Skin[] {
  return loadList(STORAGE_KEYS.skins, sanitizeSkins, store) ?? [];
}

export function saveUserSkins(
  skins: readonly Skin[],
  store: KeyValueStore | null = getBrowserStore(),
): boolean {
  return writeText(store, STORAGE_KEYS.skins, JSON.stringify(skins));
}

/**
 * Which skin is in use, or null if nothing valid is saved. A plain string is an
 * older/simple form and means "this one skin, always".
 */
export function loadSkinChoice(store: KeyValueStore | null = getBrowserStore()): SkinChoice | null {
  if (!store) return null;
  const text = readText(store, STORAGE_KEYS.activeSkin);
  if (text === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const nonEmpty = (v: unknown): v is string => typeof v === "string" && v !== "";
  if (nonEmpty(parsed)) return { mode: "fixed", id: parsed };
  if (!isRecord(parsed)) return null;
  if (parsed.mode === "fixed" && nonEmpty(parsed.id)) return { mode: "fixed", id: parsed.id };
  if (parsed.mode === "system" && nonEmpty(parsed.lightId) && nonEmpty(parsed.darkId)) {
    return { mode: "system", lightId: parsed.lightId, darkId: parsed.darkId };
  }
  return null;
}

export function saveSkinChoice(
  choice: SkinChoice,
  store: KeyValueStore | null = getBrowserStore(),
): boolean {
  return writeText(store, STORAGE_KEYS.activeSkin, JSON.stringify(choice));
}

/** Whether the optional sound effects are switched on. Off unless the person turned them on. */
export function loadSoundOn(store: KeyValueStore | null = getBrowserStore()): boolean {
  if (!store) return false;
  return readText(store, STORAGE_KEYS.sound) === "true";
}

export function saveSoundOn(on: boolean, store: KeyValueStore | null = getBrowserStore()): boolean {
  return writeText(store, STORAGE_KEYS.sound, on ? "true" : "false");
}
