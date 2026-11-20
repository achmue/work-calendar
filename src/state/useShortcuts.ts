import { useEffect, useRef } from "react";
import { sfx } from "../lib/sfx";
import { TYPING_SELECTOR, shortcutFor, type ShortcutAction } from "../lib/shortcuts";

/** Keyboard shortcuts for the whole app. Handlers can change on every render; the listener is added once. */
export function useShortcuts(handlers: Record<ShortcutAction, () => void>): void {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      const typing = target?.closest(TYPING_SELECTOR) != null;
      const action = shortcutFor(event, typing);
      if (!action) return;
      event.preventDefault();
      sfx.key(); // the key "clicks" if sound is on
      latest.current[action]();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
