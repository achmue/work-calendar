import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { addDaysISO, formatISO, formatMedium, formatShort } from "../lib/dates";
import { assignLanes } from "../lib/lanes";
import { isTaskOverdue, taskProgress } from "../lib/status";
import { barStart, dayOffset, isWeekend, monthSegments, rangeDates, sortForTimeline, timelineRange } from "../lib/timeline";
import type { ISODate, Project } from "../types";

/** Width of one day on the tape. Matches --tp-day in tape.css. */
export const TAPE_DAY_PX = 40;

/** What the transport keys can ask the tape to do. */
export interface TapeTimelineHandle {
  /** Wind the tape so this date is under the play head. */
  seek: (date: ISODate, smooth?: boolean) => void;
  /** The date that is under the play head right now. */
  focused: () => ISODate;
}

interface TapeTimelineProps {
  projects: Project[];
  today: ISODate;
  onOpenProject: (id: string) => void;
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;

/** One reel of the cassette: the tape pack and a hub that turns as the tape winds past. */
function Reel({ side }: { side: "left" | "right" }) {
  return (
    <svg className="tp-reel" data-side={side} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <circle className="tp-pack" r="48" />
      <g className="tp-hub">
        <circle r="19" className="tp-hub-ring" />
        <circle r="8" className="tp-hub-hole" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect key={deg} className="tp-spoke" x="-2.2" y="-19" width="4.4" height="11" transform={`rotate(${deg})`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * The schedule as a strip of recording tape. It winds past a fixed play head, which marks the
 * day you're looking at; projects are paper labels stuck on the tape, with their checklist
 * items as round flags. It is a real scrolling region, so a trackpad, touch or the keyboard all work.
 */
const TapeTimeline = forwardRef<TapeTimelineHandle, TapeTimelineProps>(function TapeTimeline(
  { projects, today, onOpenProject },
  ref,
) {
  const rootRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => timelineRange(projects, today, { before: 30, after: 120 }), [projects, today]);
  const dates = useMemo(() => rangeDates(range), [range]);
  const months = useMemo(() => monthSegments(range), [range]);
  const rows = useMemo(() => sortForTimeline(projects), [projects]);
  const lanes = useMemo(() => assignLanes(rows.map((p) => ({ start: barStart(p), end: p.deadline }))), [rows]);
  const laneCount = lanes.length === 0 ? 0 : Math.max(...lanes) + 1;
  const todayOffset = dayOffset(range, today);

  const [focus, setFocus] = useState<ISODate>(today);

  // The play head sits in the middle of the window, so the day under it is the one at this scroll position.
  const dateAt = useCallback(
    (left: number) => addDaysISO(range.start, Math.min(range.days - 1, Math.max(0, Math.floor(left / TAPE_DAY_PX)))),
    [range],
  );

  const seek = useCallback(
    (date: ISODate, smooth = false) => {
      const el = scrollRef.current;
      if (!el) return;
      const day = Math.min(range.days - 1, Math.max(0, dayOffset(range, date)));
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: (day + 0.5) * TAPE_DAY_PX, behavior: smooth && !reduced ? "smooth" : "auto" });
    },
    [range],
  );

  useImperativeHandle(ref, () => ({ seek, focused: () => dateAt(scrollRef.current?.scrollLeft ?? 0) }), [seek, dateAt]);

  // The reels turn with the tape: read straight from the scroll position, no animation of their own.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const max = Math.max(1, el.scrollWidth - el.clientWidth);
    root.style.setProperty("--tape-x", String(Math.round(el.scrollLeft)));
    root.style.setProperty("--tape-p", String(el.scrollLeft / max));
    setFocus(dateAt(el.scrollLeft));
  }, [dateAt]);

  // Open with today under the play head.
  useLayoutEffect(() => {
    seek(today);
    onScroll();
    // Only when the view first appears; later changes shouldn't yank the tape around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={rootRef} className="view tp-view" aria-label="Timeline">
      <Reel side="left" />
      <Reel side="right" />

      <div className="tp-window">
        <div
          ref={scrollRef}
          className="tp-scroll"
          role="region"
          aria-label="Project timeline, shown as a strip of tape. Scrolls sideways."
          tabIndex={0}
          onScroll={onScroll}
        >
          <span className="tp-spacer" aria-hidden="true" />
          <div className="tp-tape" style={vars({ "--tp-days": range.days, "--tp-day": `${TAPE_DAY_PX}px`, "--tp-lanes": Math.max(laneCount, 3) })}>
            <div className="tp-ruler" aria-hidden="true">
              <div className="tp-months">
                {months.map((m) => (
                  <span key={m.offset} className="tp-month" style={vars({ "--off": m.offset })}>
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="tp-days">
                {dates.map((date) => (
                  <span key={date} className="tp-day" data-weekend={isWeekend(date) || undefined} data-today={date === today || undefined}>
                    {Number(date.slice(8))}
                  </span>
                ))}
              </div>
            </div>

            <div className="tp-layer" aria-hidden="true">
              {dates.map((date, i) => (isWeekend(date) ? <span key={date} className="tp-weekend" style={vars({ "--off": i })} /> : null))}
              <span className="tp-today" style={vars({ "--off": todayOffset })} />
            </div>

            <div className="tp-lanes">
              {Array.from({ length: laneCount }, (_, lane) => (
                <div key={lane} className="tp-lane">
                  {rows.map((project, i) => {
                    if (lanes[i] !== lane) return null;
                    const start = barStart(project);
                    const off = dayOffset(range, start);
                    const length = dayOffset(range, project.deadline) - off + 1;
                    const { done, total } = taskProgress(project);
                    const overdueCount = project.tasks.filter((t) => isTaskOverdue(t, today)).length;
                    const summary = `${project.name}: ${formatShort(start)} to ${formatMedium(project.deadline)}, ${done} of ${total} items done${
                      overdueCount > 0 ? `, ${overdueCount} overdue` : ""
                    }. Open project.`;
                    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
                    return (
                      <div
                        key={project.id}
                        className="tp-item"
                        style={vars({ "--off": off, "--len": length, "--project-color": project.color, "--progress": `${percent}%` })}
                        data-done={project.done || undefined}
                      >
                        <button type="button" className="tp-strip" aria-label={summary} title={summary} onClick={() => onOpenProject(project.id)}>
                          <span className="tp-name">{project.name}</span>
                          {total > 0 && (
                            <span className="tp-count">
                              {done}/{total}
                            </span>
                          )}
                          {project.tasks.map((task) =>
                            task.due === "" ? null : (
                              <span
                                key={task.id}
                                className="tp-flag"
                                style={vars({ "--at": dayOffset(range, task.due) - off + 0.5 })}
                                data-done={task.done || undefined}
                                data-overdue={isTaskOverdue(task, today) || undefined}
                                title={`${task.text} (${formatShort(task.due)})${task.done ? " – done" : ""}`}
                              >
                                <span aria-hidden="true">{task.done ? "✓" : isTaskOverdue(task, today) ? "!" : ""}</span>
                              </span>
                            ),
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {rows.length === 0 && (
              <p className="tp-empty">The tape is blank. Press the red record key to add your first project.</p>
            )}
          </div>
          <span className="tp-spacer" aria-hidden="true" />
        </div>

        <div className="tp-head" aria-hidden="true">
          <span className="tp-head-top" data-today={focus === today || undefined}>
            {focus === today ? "Today" : formatISO(focus, "EEE")}
          </span>
          <span className="tp-head-date">{formatISO(focus, "d MMM")}</span>
        </div>
      </div>
    </section>
  );
});

export default TapeTimeline;
