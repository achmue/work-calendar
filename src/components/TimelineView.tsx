import { useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { formatMedium, formatShort } from "../lib/dates";
import { isTaskOverdue, taskProgress } from "../lib/status";
import {
  barStart,
  dayOffset,
  isWeekend,
  monthSegments,
  rangeDates,
  sortForTimeline,
  timelineRange,
} from "../lib/timeline";
import type { ISODate, Project } from "../types";

/** Width of one day column. Matches --tl-day in base.css. */
const DAY_PX = 28;

interface TimelineViewProps {
  projects: Project[];
  today: ISODate;
  onOpenProject: (id: string) => void;
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;

export default function TimelineView({ projects, today, onOpenProject }: TimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => timelineRange(projects, today), [projects, today]);
  const dates = useMemo(() => rangeDates(range), [range]);
  const months = useMemo(() => monthSegments(range), [range]);
  const rows = useMemo(() => sortForTimeline(projects), [projects]);
  const todayOffset = dayOffset(range, today);

  function scrollToToday(smooth: boolean) {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const label = scroller.querySelector<HTMLElement>(".tl-label");
    const labelWidth = label?.offsetWidth ?? 0;
    const visibleTrack = scroller.clientWidth - labelWidth;
    // Put today's column in the middle of the part of the track that isn't under the sticky labels.
    const target = (todayOffset + 0.5) * DAY_PX - visibleTrack / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  }

  // Open scrolled to today.
  useLayoutEffect(() => {
    scrollToToday(false);
    // Only when the view first appears; later changes shouldn't yank the scroll position.
  }, []);

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="view" aria-labelledby="timeline-title">
      <div className="view-toolbar">
        <h2 id="timeline-title" className="panel-title">
          Timeline
        </h2>
        <button type="button" className="btn" onClick={() => scrollToToday(!reducedMotion())}>
          Jump to today
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted empty">
          Your projects will appear here as bars once you add one.
        </p>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="tl-scroll"
            role="region"
            aria-label="Project timeline. Scrolls sideways."
            tabIndex={0}
          >
            <div className="tl" style={vars({ "--tl-days": range.days, "--tl-day": `${DAY_PX}px` })}>
              <div className="tl-head">
                <div className="tl-label tl-corner">Project</div>
                <div className="tl-track">
                  <div className="tl-months">
                    {months.map((m) => (
                      <span key={m.offset} className="tl-month" style={vars({ "--off": m.offset, "--len": m.days })}>
                        <span className="tl-month-text">{m.label}</span>
                      </span>
                    ))}
                  </div>
                  <div className="tl-days">
                    {dates.map((date) => (
                      <span
                        key={date}
                        className="tl-day num"
                        data-weekend={isWeekend(date) || undefined}
                        data-today={date === today || undefined}
                      >
                        {Number(date.slice(8))}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="tl-body">
                <div className="tl-layer" aria-hidden="true">
                  {dates.map((date, i) =>
                    isWeekend(date) ? (
                      <span key={date} className="tl-weekend" style={vars({ "--off": i })} />
                    ) : null,
                  )}
                  <span className="tl-today" style={vars({ "--off": todayOffset + 0.5 })} />
                </div>

                {rows.map((project) => {
                  const start = barStart(project);
                  const startOff = dayOffset(range, start);
                  const length = dayOffset(range, project.deadline) - startOff + 1;
                  const { done, total } = taskProgress(project);
                  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
                  const overdueCount = project.tasks.filter((t) => isTaskOverdue(t, today)).length;
                  const summary = `${project.name}: ${formatShort(start)} to ${formatMedium(project.deadline)}, ${done} of ${total} items done${
                    overdueCount > 0 ? `, ${overdueCount} overdue` : ""
                  }. Open project.`;
                  return (
                    <div key={project.id} className="tl-row" style={vars({ "--project-color": project.color })}>
                      <div className="tl-label" title={project.name}>
                        {project.name}
                      </div>
                      <div className="tl-track">
                        <button
                          type="button"
                          className="tl-bar"
                          style={vars({ "--off": startOff, "--len": length, "--progress": `${percent}%` })}
                          aria-label={summary}
                          title={summary}
                          onClick={() => onOpenProject(project.id)}
                        >
                          <span className="tl-bar-fill" />
                        </button>
                        {project.tasks.map((task) =>
                          task.due === "" ? null : (
                            <span
                              key={task.id}
                              className="tl-dot"
                              style={vars({ "--off": dayOffset(range, task.due) + 0.5 })}
                              data-done={task.done || undefined}
                              data-overdue={isTaskOverdue(task, today) || undefined}
                              title={`${task.text} (${formatShort(task.due)})${task.done ? " – done" : ""}`}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="muted tl-legend">
            Each bar runs from a project's start to its deadline; the solid part shows checklist
            progress. Dots are checklist items on their due date, and a red ring means overdue.
            Click a bar to open the project.
          </p>
        </>
      )}
    </section>
  );
}
