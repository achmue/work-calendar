import { useCallback, useEffect, useState } from "react";
import { setSfxEnabled, sfx } from "../lib/sfx";
import { loadSoundOn, saveSoundOn } from "../storage/storage";

/**
 * The optional sound effects: a switch (remembered, off by default) and a single listener
 * that makes the right little noise for clicks and ticks anywhere in the app.
 */
export function useSound() {
  const [on, setOn] = useState<boolean>(() => loadSoundOn());

  useEffect(() => {
    setSfxEnabled(on);
    if (!on) return;

    // Checkboxes are handled on "click", not "change": when a ticked item leaves the list, React removes it
    // during the click, so the later "change" event would never reach us. The box is already toggled here.
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target instanceof HTMLInputElement && target.type === "checkbox") (target.checked ? sfx.tick : sfx.click)();
      else if (target.closest(".deck-cap")) sfx.key();
      else if (target.closest("button, a, summary, [role=button]")) sfx.click();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [on]);

  const toggle = useCallback(() => {
    const next = !on;
    setOn(next);
    saveSoundOn(next);
    setSfxEnabled(next);
    if (next) sfx.done(); // a little chime so you know it's on
  }, [on]);

  return { soundOn: on, toggleSound: toggle };
}
