import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { yarnPath, yarnTarget, type Point } from "../lib/yarn";
import type { ISODate, Project } from "../types";

interface Tie {
  card: Point;
  pin: Point;
  /** Cuts the front layer down to the card the yarn starts from. */
  onCard: string;
  color: string;
}

interface RedYarnProps {
  /** The area holding both the wall calendar and the cards: the yarn is drawn over it. */
  areaRef: RefObject<HTMLDivElement | null>;
  projects: Project[];
  today: ISODate;
  /** The month on the wall: its pins move when it changes. */
  month: ISODate;
}

/** Where on a card the yarn's pin goes, from its top left corner (in rem). */
const PIN_X = 1.4;
const PIN_Y = 0.35;

/**
 * A piece of red yarn from an index card to that project's deadline pin on the calendar.
 * Point at (or tab into) another card and the yarn moves to it. It is decoration only.
 */
export default function RedYarn({ areaRef, projects, today, month }: RedYarnProps) {
  const [pointedId, setPointedId] = useState<string | null>(null);
  const [tie, setTie] = useState<Tie | null>(null);

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const point = (event: Event) => {
      const card = event.target instanceof Element ? event.target.closest(".project-card") : null;
      if (card) setPointedId(card.id.replace(/^project-/, ""));
    };
    const leave = () => setPointedId(null);
    area.addEventListener("pointerover", point);
    area.addEventListener("focusin", point);
    area.addEventListener("pointerleave", leave);
    return () => {
      area.removeEventListener("pointerover", point);
      area.removeEventListener("focusin", point);
      area.removeEventListener("pointerleave", leave);
    };
  }, [areaRef]);

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    let frame = 0;

    const measure = () => {
      const pins = [...area.querySelectorAll<HTMLElement>("[data-deadline-pin]")];
      const pinned = new Set(pins.map((el) => el.dataset.deadlinePin ?? ""));
      const id = yarnTarget(projects, pinned, today, pointedId);
      const pin = pins.find((el) => el.dataset.deadlinePin === id);
      const card = id === null ? null : document.getElementById(`project-${id}`);
      const project = projects.find((p) => p.id === id);
      if (!pin || !card || !project) return setTie(null);

      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 15;
      const base = area.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      const p = pin.getBoundingClientRect();
      const from = { x: c.left + PIN_X * rem, y: c.top + PIN_Y * rem };
      // A card scrolled out of the board's window takes its yarn with it.
      const board = card.parentElement?.getBoundingClientRect();
      if (board && (from.y < board.top - rem || from.y > board.bottom - rem)) return setTie(null);

      const inset = [c.top - base.top, base.right - c.right, base.bottom - c.bottom, c.left - base.left];
      setTie({
        card: { x: from.x - base.left, y: from.y - base.top },
        pin: { x: p.left + p.width / 2 - base.left, y: p.top + p.height / 2 - base.top },
        onCard: `inset(${inset.map((n) => `${Math.round(n)}px`).join(" ")})`,
        color: project.color,
      });
    };
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    later(); // once more after the calendar has settled how many lines each day shows
    const observer = new ResizeObserver(later);
    observer.observe(area);
    for (const el of area.querySelectorAll(".ck-cards, .project-card")) observer.observe(el);
    area.addEventListener("scroll", later, true);
    area.addEventListener("transitionend", later);
    window.addEventListener("resize", later);
    void document.fonts?.ready.then(later);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      area.removeEventListener("scroll", later, true);
      area.removeEventListener("transitionend", later);
      window.removeEventListener("resize", later);
    };
  }, [areaRef, projects, today, month, pointedId]);

  if (!tie) return null;
  const path = yarnPath(tie.card, tie.pin);

  const strands = (
    <svg>
      <path className="ck-yarn-shadow" d={path} transform="translate(3 5)" />
      <path className="ck-yarn-string" d={path} />
      <path className="ck-yarn-twist" d={path} />
    </svg>
  );

  // Two layers: one passes behind the cards, so it never covers what's written on them; the other shows
  // only on its own card, so the yarn visibly starts at the pin.
  return (
    <>
      <div className="ck-yarn" aria-hidden="true">
        {strands}
      </div>
      <div className="ck-yarn ck-yarn-front" aria-hidden="true" style={{ clipPath: tie.onCard }}>
        {strands}
      </div>
      <span
        className="ck-yarn-pin"
        aria-hidden="true"
        style={{ "--project-color": tie.color, left: tie.card.x, top: tie.card.y } as CSSProperties}
      />
    </>
  );
}
