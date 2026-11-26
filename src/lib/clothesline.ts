// The arithmetic of the "coming up" clothesline: how many tags fit, which ones show, and how far each hangs.

/** How many tags fit on a line this wide. Never fewer than two: one thing, and "more". */
export function tagSlots(width: number, tagWidth: number, gap: number): number {
  if (!(width > 0) || !(tagWidth > 0)) return 2;
  return Math.max(2, Math.floor((width + gap) / (tagWidth + gap)));
}

export interface LinePage {
  /** The tags on show are items[start] up to, not including, items[end]. */
  start: number;
  end: number;
  /** How many come after the ones on show. */
  rest: number;
  page: number;
  /** 1 when everything fits. More than 1 means the last slot is a "more" tag. */
  pages: number;
}

/**
 * Which tags to hang. When they don't all fit, one slot is kept for a "more" tag and the rest are
 * shown a page at a time, going back to the start after the last page.
 */
export function linePage(count: number, slots: number, page: number): LinePage {
  if (count <= slots) return { start: 0, end: count, rest: 0, page: 0, pages: 1 };
  const perPage = Math.max(1, slots - 1);
  const pages = Math.ceil(count / perPage);
  const current = ((page % pages) + pages) % pages;
  const start = current * perPage;
  const end = Math.min(count, start + perPage);
  return { start, end, rest: count - end, page: current, pages };
}

/** How far down the sagging line tag `index` of `total` hangs: near 0 at either end, 1 in the middle. */
export function sagAt(index: number, total: number): number {
  const t = (index + 0.5) / Math.max(1, total);
  return 4 * t * (1 - t);
}
