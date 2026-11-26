import { Fragment, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import { formatMedium, formatShort } from "../lib/dates";
import { looseItems, planItems, sortPlans } from "../lib/plans";
import { isInFinishedPlan, isPlanDone, isPlanOverdue, isTaskOverdue, planProgress, taskProgress } from "../lib/status";
import {
  barStart,
  dayOffset,
  isWeekend,
  monthSegments,
  rangeDates,
  sortForTimeline,
  timelineRange,
} from "../lib/timeline";
import type { ISODate, Project, Task } from "../types";

/** Width of one day column. Matches --tl-day in base.css. */
const DAY_PX = 28;

interface TimelineViewProps {
  projects: Project[];
  today: ISODate;
  onOpenProject: (id: string) => void;
}

const vars = (values: Record<string, string | number>) => values as CSSProperties;

/** Checklist items as pins on their due dates. */
function Dots({ items, offset, late }: { items: Task[]; offset: (date: ISODate) => number; late: (task: Task) => boolean }) {
  return items.map((task) =>
    task.due === "" ? null : (
      <span
        key={task.id}
        className="tl-dot"
        style={vars({ "--off": offset(task.due) + 0.5 })}
        data-done={task.done || undefined}
        data-overdue={late(task) || undefined}
        title={`${task.text} (${formatShort(task.due)})${task.done ? " – done" : ""}`}
      />
    ),
  );
}

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
                  const late = (task: Task) => isTaskOverdue(task, today) && !isInFinishedPlan(project, task);
                  const overdueCount = project.tasks.filter(late).length;
                  const offset = (date: ISODate) => dayOffset(range, date);
                  const summary = `${project.name}: ${formatShort(start)} to ${formatMedium(project.deadline)}, ${done} of ${total} items done${
                    overdueCount > 0 ? `, ${overdueCount} overdue` : ""
                  }. Open project.`;
                  return (
                    <Fragment key={project.id}>
                    <div className="tl-row" style={vars({ "--project-color": project.color })}>
                      <div className="tl-label" title={project.name}>
                        <span className="tl-label-text">{project.name}</span>
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
                        <Dots items={looseItems(project)} offset={offset} late={late} />
                      </div>
                    </div>
                    {sortPlans(project.plans).map((plan) => {
                      const progress = planProgress(project, plan);
                      const planLate = isPlanOverdue(project, plan, today);
                      const finished = isPlanDone(project, plan);
                      const label =
                        plan.due === ""
                          ? ""
                          : `${plan.name}, part of ${project.name}: finish ${formatShort(plan.due)}${
                              progress.total > 0 ? `, ${progress.done} of ${progress.total} items done` : ""
                            }${finished ? ", finished" : planLate ? ", late" : ""}. Open project.`;
                      return (
                        <div key={plan.id} className="tl-row tl-row-plan" style={vars({ "--project-color": project.color })}>
                          <div className="tl-label" title={`${project.name}: ${plan.name}`}>
                            <span className="tl-label-text">{plan.name}</span>
                          </div>
                          <div className="tl-track">
                            {plan.due !== "" && (
                              <span
                                className="tl-lead"
                                aria-hidden="true"
                                style={vars({ "--off": Math.min(startOff, offset(plan.due)), "--len": Math.max(0, offset(plan.due) - startOff + 1) })}
                              />
                            )}
                            <Dots items={planItems(project, plan.id)} offset={offset} late={late} />
                            {plan.due !== "" && (
                              <button
                                type="button"
                                className="tl-flag"
                                style={vars({ "--off": offset(plan.due) + 1 })}
                                data-done={finished || undefined}
                                data-overdue={planLate || undefined}
                                aria-label={label}
                                title={label}
                                onClick={() => onOpenProject(project.id)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="muted tl-legend">
            Each bar runs from a project's start to its deadline; the solid part shows checklist
            progress. Under it, a flag marks the date you expect each small plan to be finished.
            Dots are checklist items, and red means late. Click a bar or a flag to open the project.
          </p>
        </>
      )}
    </section>
  );
}
