// Shared bits for reading files: a result type, and turning a list of problems into a readable message.

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** A readable error: the first few problems as a bulleted list. */
export function formatProblems(intro: string, problems: readonly string[], max = 5): string {
  const shown = problems.slice(0, max).map((p) => `• ${p}`);
  const more = problems.length - shown.length;
  return [intro, ...shown, ...(more > 0 ? [`…and ${more} more.`] : [])].join("\n");
}
