import { useCallback, useEffect, useState } from "react";
import { HOME_PAGE, PAGES, pageFromPath, pagePath, type ViewId } from "../lib/pages";

/** The folder the site is served from: "/" on its own domain. */
export const BASE = import.meta.env.BASE_URL;

const addressPage = () => pageFromPath(window.location.pathname, BASE);

/**
 * The page on show, kept in step with the browser's address: each page has its own address,
 * Back and Forward move between them, and a bookmark opens straight on its page.
 */
export function useRoute(): [ViewId, (page: ViewId) => void] {
  const [page, setPage] = useState<ViewId>(() => addressPage() ?? HOME_PAGE);

  useEffect(() => {
    // "/" and addresses that don't exist show the home page, under its proper address.
    const follow = () => {
      const found = addressPage();
      if (!found) window.history.replaceState(null, "", pagePath(HOME_PAGE, BASE));
      setPage(found ?? HOME_PAGE);
    };
    follow();
    window.addEventListener("popstate", follow);
    return () => window.removeEventListener("popstate", follow);
  }, []);

  useEffect(() => {
    const label = PAGES.find((p) => p.id === page)?.label;
    document.title = `${label} · Work Calendar`;
  }, [page]);

  const go = useCallback((next: ViewId) => {
    if (addressPage() !== next) window.history.pushState(null, "", pagePath(next, BASE));
    setPage(next);
  }, []);

  return [page, go];
}
