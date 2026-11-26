// Every page of the app, and its address: the page "timeline" lives at /timeline.
//
// To add a page:
//   1. add a line to PAGES below (the id is the address, the label goes on its tab);
//   2. say what it shows in src/pages.tsx.
// The tab, the address, the browser title, the number key and Back/Forward then work by themselves.
// (Every page here needs someone to be signed in, or trying the demo.)

export const PAGES = [
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "projects", label: "Projects" },
] as const;

export type ViewId = (typeof PAGES)[number]["id"];

/** The pages for signing in. They aren't tabs: you only see them while signed out. */
export const ACCOUNT_PAGES = [
  { id: "login", label: "Log in" },
  { id: "signup", label: "Create account" },
] as const;

export type AccountPageId = (typeof ACCOUNT_PAGES)[number]["id"];

/** Any page with an address. */
export type PageId = ViewId | AccountPageId;

const EVERY_PAGE: readonly { id: PageId; label: string }[] = [...PAGES, ...ACCOUNT_PAGES];

export const pageLabel = (page: PageId): string => EVERY_PAGE.find((p) => p.id === page)?.label ?? "";

export const isAccountPage = (page: PageId): page is AccountPageId => ACCOUNT_PAGES.some((p) => p.id === page);

/** The page shown at "/", and for an address that doesn't exist. */
export const HOME_PAGE: ViewId = "calendar";

/**
 * Which page to show for the one asked for. Signed out, only the signing-in pages are open (log in
 * otherwise); signed in, those make no sense, so they lead home.
 */
export function allowedPage(asked: PageId | null, signedIn: boolean): PageId {
  if (!signedIn) return asked && isAccountPage(asked) ? asked : "login";
  return asked && !isAccountPage(asked) ? asked : HOME_PAGE;
}

/** The site may live in a sub-folder ("/work-calendar/"); this makes sure it ends with a slash. */
const folder = (base: string) => (base.endsWith("/") ? base : `${base}/`);

/** The address of a page: ("timeline", "/") gives "/timeline". */
export function pagePath(page: PageId, base: string): string {
  return `${folder(base)}${page}`;
}

/** Which page an address is for, or null if it isn't one. A trailing slash and capitals don't matter. */
export function pageFromPath(pathname: string, base: string): PageId | null {
  const root = folder(base);
  if (!pathname.startsWith(root)) return null;
  const rest = pathname.slice(root.length).replace(/\/+$/, "").toLowerCase();
  return EVERY_PAGE.find((page) => page.id === rest)?.id ?? null;
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
