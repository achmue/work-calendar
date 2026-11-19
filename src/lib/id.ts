/**
 * A new unique id. crypto.randomUUID only exists on https:// and localhost, so
 * opening the dev server from a phone over the local network needs the fallback.
 */
export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
