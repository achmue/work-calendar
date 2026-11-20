import type { Skin } from "../types";
import { checkSkin } from "./skinSchema";

// Sharing skins as ".skin.json" files.

/** A skin file is a few KB; even with a 500 KB background picture it stays under this. */
export const MAX_SKIN_FILE_CHARS = 1_000_000;

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** The text to save in a ".skin.json" file. Only known fields are written. */
export function serializeSkin(skin: Skin): string {
  const { id, name, author, version, tokens } = skin;
  return JSON.stringify({ id, name, ...(author ? { author } : {}), version, tokens }, null, 2);
}

/** "My Skin" -> "my-skin.skin.json" is built in the UI with fileSlug; this is the shared suffix. */
export const SKIN_FILE_SUFFIX = ".skin.json";

/** A readable error: the first few problems as a list. */
export function formatProblems(intro: string, problems: readonly string[], max = 5): string {
  const shown = problems.slice(0, max).map((p) => `• ${p}`);
  const more = problems.length - shown.length;
  return [intro, ...shown, ...(more > 0 ? [`…and ${more} more.`] : [])].join("\n");
}

/**
 * Read a skin file. Anything invalid is rejected with a message explaining why;
 * missing tokens are filled in from Clean Light. The skin keeps the file's id
 * and name; the caller gives it a fresh id before saving so it can't replace
 * another skin.
 */
export function parseSkinFile(text: string): Parsed<Skin> {
  if (text.length > MAX_SKIN_FILE_CHARS) {
    return { ok: false, error: "That file is too big to be a skin (over 1 MB)." };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON, so it can't be a skin." };
  }
  const { skin, problems } = checkSkin(raw);
  if (!skin || problems.length > 0) {
    return { ok: false, error: formatProblems("This skin file can't be used:", problems) };
  }
  return { ok: true, value: skin };
}

/** Keep names distinct: "Night" -> "Night (imported)" -> "Night (imported 2)". */
export function uniqueSkinName(name: string, existing: readonly string[]): string {
  const taken = new Set(existing.map((n) => n.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  let candidate = `${name} (imported)`;
  for (let n = 2; taken.has(candidate.toLowerCase()); n += 1) candidate = `${name} (imported ${n})`;
  return candidate;
}
