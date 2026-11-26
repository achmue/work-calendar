import { useLayoutEffect, type RefObject } from "react";

/**
 * Cards of different heights, pinned up in columns without big holes between them. The list is a grid
 * with 1px rows; the children are dealt left to right into its columns, and each is told how many rows
 * it covers (its height plus its margins) so the next one in that column sits right underneath.
 */
export function useMasonry(ref: RefObject<HTMLElement | null>): void {
  // Runs after every render, because cards come, go and change height.
  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const children = [...list.children] as HTMLElement[];
    const lay = () => {
      // Put everything in column 1 first, or an old "column 2" would keep a second column alive.
      for (const child of children) child.style.gridColumnStart = "1";
      const columns = getComputedStyle(list).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
      for (const [index, child] of children.entries()) {
        child.style.gridColumnStart = String((index % columns) + 1);
        const style = getComputedStyle(child);
        const height = child.offsetHeight + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
        child.style.gridRowEnd = `span ${Math.max(1, Math.ceil(height))}`;
      }
    };
    lay();
    const observer = new ResizeObserver(lay);
    observer.observe(list); // a wider or narrower board means a different number of columns
    for (const child of children) observer.observe(child);
    return () => observer.disconnect();
  });
}
