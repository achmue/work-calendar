import { isBuiltInSkin } from "../skins/presets";
import { sanitizeProjects, sanitizeSkins } from "../storage/storage";
import type { Project, Skin } from "../types";
import { newId } from "./id";
import { formatProblems, type Parsed } from "./problems";

// Backing up everything to one .json file and restoring it again.

export const BACKUP_APP = "work-calendar";
export const BACKUP_VERSION = 1;
/** Projects are small; skins can carry a ~500 KB picture each. */
export const MAX_BACKUP_CHARS = 25_000_000;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  projects: Project[];
  skins: Skin[];
}

export function buildBackup(projects: readonly Project[], userSkins: readonly Skin[], now: Date = new Date()): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    projects: [...projects],
    skins: [...userSkins],
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2);
}

export interface ParsedBackup {
  projects: Project[];
  skins: Skin[];
  exportedAt: string | null;
  /** Entries in the file that couldn't be used and were left out. */
  skippedProjects: number;
  skippedSkins: number;
}

/**
 * Read a backup file. The file must be one of ours; the projects and skins in
 * it are validated like anything else loaded from storage, and unusable ones
 * are left out (and counted) instead of failing the whole restore.
 */
export function parseBackup(text: string): Parsed<ParsedBackup> {
  if (text.length > MAX_BACKUP_CHARS) {
    return { ok: false, error: "That file is too big to be a backup." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON, so it can't be a backup." };
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, error: "That doesn't look like a Work Calendar backup." };
  }
  const file = raw as Record<string, unknown>;
  if (file.app !== BACKUP_APP) {
    return { ok: false, error: "That doesn't look like a Work Calendar backup." };
  }
  if (typeof file.version !== "number" || file.version < 1) {
    return { ok: false, error: "This backup is missing its version, so it can't be read safely." };
  }
  if (file.version > BACKUP_VERSION) {
    return { ok: false, error: "This backup was made by a newer version of Work Calendar. Update the app and try again." };
  }
  if (!Array.isArray(file.projects)) {
    return { ok: false, error: formatProblems("This backup can't be used:", ['It has no "projects" list.']) };
  }
  if (file.skins !== undefined && !Array.isArray(file.skins)) {
    return { ok: false, error: formatProblems("This backup can't be used:", ['"skins" should be a list.']) };
  }

  const projects = sanitizeProjects(file.projects);
  const skins = sanitizeSkins(Array.isArray(file.skins) ? file.skins : []);
  const exported = typeof file.exportedAt === "string" && !Number.isNaN(Date.parse(file.exportedAt)) ? file.exportedAt : null;
  return {
    ok: true,
    value: {
      projects: projects.items,
      skins: withoutBuiltInIds(skins.items),
      exportedAt: exported,
      skippedProjects: projects.dropped,
      skippedSkins: skins.dropped,
    },
  };
}

/** A user skin can't reuse a built-in skin's id: give it a new one. */
function withoutBuiltInIds(skins: readonly Skin[]): Skin[] {
  return skins.map((skin) => (isBuiltInSkin(skin.id) ? { ...skin, id: `user-${newId()}` } : skin));
}

export interface MergeResult<T> {
  items: T[];
  added: number;
  /** Entries in the file that were already here (same id), so the existing one was kept. */
  skipped: number;
}

function mergeById<T extends { id: string }>(existing: readonly T[], incoming: readonly T[]): MergeResult<T> {
  const have = new Set(existing.map((item) => item.id));
  const items = [...existing];
  let added = 0;
  let skipped = 0;
  for (const item of incoming) {
    if (have.has(item.id)) {
      skipped += 1;
    } else {
      have.add(item.id);
      items.push(item);
      added += 1;
    }
  }
  return { items, added, skipped };
}

/** Add what's new; a project that's already here (same id) is kept exactly as it is. */
export const mergeProjects = (existing: readonly Project[], incoming: readonly Project[]) => mergeById(existing, incoming);
export const mergeSkins = (existing: readonly Skin[], incoming: readonly Skin[]) => mergeById(existing, incoming);

/** A one-line description of what's in a backup, for the confirmation step. */
export function describeBackup(backup: ParsedBackup): string {
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const tasks = backup.projects.reduce((n, p) => n + p.tasks.length, 0);
  return `${count(backup.projects.length, "project", "projects")} (${count(tasks, "checklist item", "checklist items")}) and ${count(backup.skins.length, "skin", "skins")}`;
}
