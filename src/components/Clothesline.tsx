import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { COMING_UP_DAYS, comingUp, dayLabel } from "../lib/agenda";
import { linePage, sagAt, tagSlots } from "../lib/clothesline";
import { formatISO } from "../lib/dates";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import { agendaKey, agendaText, tickItem, tickLabel } from "./agendaActions";

type ProjectsApi = ReturnType<typeof useProjects>;

interface ClotheslineProps {
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "updateProject" | "updateTask" | "updatePlan">;
}

/** The width of a tag and the least gap between two, in rem: the same sizes as .ck-tag in cork.css. */
const TAG_WIDTH = 5.6;
const TAG_GAP = 0.3;

/** "Coming up", as paper tags pegged on a sagging line in date order. Tick one and it comes off the line. */
export default function Clothesline({ projects, today, api }: ClotheslineProps) {
  const items = useMemo(() => comingUp(projects, today), [projects, today]);
  const ref = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState(6);
  const [page, setPage] = useState(0);

  useLayoutEffect(() => {
    const line = ref.current;
    if (!line) return;
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 15;
      setSlots(tagSlots(line.clientWidth - TAG_GAP * rem, TAG_WIDTH * rem, TAG_GAP * rem));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(line);
    return () => observer.disconnect();
  }, []);

  const shown = linePage(items.length, slots, page);
  const visible = items.slice(shown.start, shown.end);
  const hung = visible.length + (shown.pages > 1 ? 1 : 0);
  const sag = (index: number) => ({ "--sag": sagAt(index, hung).toFixed(3) });

  return (
    <section className="ck-line" aria-labelledby="line-title">
      <h2 id="line-title" className="ck-line-title">
        Coming up · next {COMING_UP_DAYS} days
      </h2>
      <div className="ck-line-body" ref={ref}>
        <svg className="ck-rope" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 2 Q50 28 100 2" vectorEffect="non-scaling-stroke" />
        </svg>
        {items.length === 0 ? (
          <p className="ck-line-empty" role="status">
            All caught up: nothing is due in the next {COMING_UP_DAYS} days.
          </p>
        ) : (
          <ul className="ck-tags" aria-label="Things coming up, soonest first">
            {visible.map((item, i) => (
              <li
                key={agendaKey(item)}
                className="ck-tag"
                data-late={item.date < today || undefined}
                data-deadline={item.kind === "deadline" || undefined}
                data-plan={item.kind === "plan" || undefined}
                style={{ ...sag(i), "--project-color": item.project.color } as CSSProperties}
              >
                <span className="ck-peg" aria-hidden="true" />
                <span className="ck-tag-date">
                  {formatISO(item.date, "EEE d")}
                  {item.date < today ? " · late" : item.kind === "deadline" ? " ◆" : item.kind === "plan" ? " ⚑" : ""}
                </span>
                <span
                  className="ck-tag-text"
                  title={`${agendaText(item)}${item.kind === "deadline" ? "" : ` (${item.project.name})`} · ${dayLabel(item.date, today)}`}
                >
                  {agendaText(item)}
                </span>
                <button type="button" className="ck-tag-tick" aria-label={tickLabel(item)} onClick={() => tickItem(api, item)}>
                  <span aria-hidden="true">✓</span>
                </button>
              </li>
            ))}
            {shown.pages > 1 && (
              <li className="ck-tag ck-tag-more" style={sag(visible.length) as CSSProperties}>
                <span className="ck-peg" aria-hidden="true" />
                <button type="button" onClick={() => setPage(shown.page + 1)}>
                  {shown.rest > 0 ? (
                    <>
                      +{shown.rest} more <span aria-hidden="true">›</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">‹</span> Back to start
                    </>
                  )}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
