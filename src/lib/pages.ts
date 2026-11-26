// Every page of the app, and its address: the page "timeline" lives at /timeline.
//
// To add a page:
//   1. add a line to PAGES below (the id is the address, the label goes on its tab);
//   2. say what it shows in src/pages.tsx.
// The tab, the address, the browser title, the number key and Back/Forward then work by themselves.

export const PAGES = [
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "projects", label: "Projects" },
] as const;

export type ViewId = (typeof PAGES)[number]["id"];

/** The page shown at "/", and for an address that doesn't exist. */
export const HOME_PAGE: ViewId = "calendar";

/** The site may live in a sub-folder ("/work-calendar/"); this makes sure it ends with a slash. */
const folder = (base: string) => (base.endsWith("/") ? base : `${base}/`);

/** The address of a page: ("timeline", "/") gives "/timeline". */
export function pagePath(page: ViewId, base: string): string {
  return `${folder(base)}${page}`;
}

/** Which page an address is for, or null if it isn't one. A trailing slash and capitals don't matter. */
export function pageFromPath(pathname: string, base: string): ViewId | null {
  const root = folder(base);
  if (!pathname.startsWith(root)) return null;
  const rest = pathname.slice(root.length).replace(/\/+$/, "").toLowerCase();
  return PAGES.find((page) => page.id === rest)?.id ?? null;
}

interface ClickInfo {
  button: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/**
 * An ordinary click on a link to one of our pages: the app changes page itself. Anything else
 * (a new tab, a new window, the middle button) is left to the browser.
 */
export function isPlainClick(event: ClickInfo): boolean {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}
