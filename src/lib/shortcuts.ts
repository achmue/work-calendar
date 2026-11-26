// Keyboard shortcuts. The decision of "what does this key do?" is a pure function so it can be tested.

import { PAGES, type ViewId } from "./pages";

export type ShortcutAction = "prev-month" | "next-month" | "today" | ViewId | "new-project" | "help";

/** The first nine pages get the number keys, in the order of their tabs. */
const NUMBERED = PAGES.slice(0, 9);

/** What the help dialog lists, in order. */
export const SHORTCUT_LIST: { keys: string; label: string }[] = [
  { keys: "←  →", label: "Previous / next month" },
  { keys: "T", label: "Jump to today" },
  { keys: NUMBERED.map((_, i) => String(i + 1)).join("  "), label: NUMBERED.map((page) => page.label).join(" / ") },
  { keys: "N", label: "New project" },
  { keys: "?", label: "Show this list" },
];

interface KeyInfo {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/**
 * The action for a key press, or null if it isn't one of ours. Nothing fires while you're
 * typing in a field, or when a modifier is held (so browser shortcuts like Ctrl+T still work).
 */
export function shortcutFor(event: KeyInfo, typing: boolean): ShortcutAction | null {
  if (typing || event.ctrlKey || event.altKey || event.metaKey) return null;
  switch (event.key) {
    case "ArrowLeft":
      return "prev-month";
    case "ArrowRight":
      return "next-month";
    case "t":
    case "T":
      return "today";
    case "n":
    case "N":
      return "new-project";
    case "?":
      return "help";
    default:
      return NUMBERED.find((_, i) => event.key === String(i + 1))?.id ?? null;
  }
}

/** Places where keys belong to something else: text fields, dialogs, the timeline's scroller, the skin editor. */
export const TYPING_SELECTOR = "input, textarea, select, dialog, [contenteditable='true'], .tl-scroll, .editor";
