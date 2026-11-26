import { useCallback, useEffect, useState } from "react";
import { allowedPage, pageFromPath, pageLabel, pagePath, type PageId } from "../lib/pages";

/** The folder the site is served from: "/" on its own domain. */
export const BASE = import.meta.env.BASE_URL;

const addressPage = () => pageFromPath(window.location.pathname, BASE);

/**
 * The page on show, kept in step with the browser's address: each page has its own address,
 * Back and Forward move between them, and a bookmark opens straight on its page. Someone who isn't
 * signed in sees the log in page, and goes on to the page they asked for once they are.
 */
export function useRoute(signedIn: boolean): [PageId, (page: PageId) => void] {
  // The page asked for. A new object each time, so asking twice for the same one still counts.
  const [asked, setAsked] = useState(() => ({ page: addressPage() }));
  const page = allowedPage(asked.page, signedIn);

  useEffect(() => {
    const follow = () => setAsked({ page: addressPage() });
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, []);

  // The address and the browser's title always say what's on show.
  useEffect(() => {
    if (addressPage() !== page) window.history.replaceState(null, "", pagePath(page, BASE));
    document.title = `${pageLabel(page)} · Work Calendar`;
  }, [page, asked]);

  const go = useCallback((next: PageId) => {
    if (addressPage() !== next) window.history.pushState(null, "", pagePath(next, BASE));
    setAsked({ page: next });
  }, []);

  return [page, go];
}
