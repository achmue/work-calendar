import { useEffect, useState } from "react";

/** True while the browser window matches a CSS media query (and updates when it changes). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** The windows big enough for the "everything on one screen" layout. Keep in step with design.css. */
export const FIT_QUERY = "(min-width: 961px) and (min-height: 600px)";
