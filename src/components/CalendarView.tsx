import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { buildDayIndex, itemsOn, monthGrid, type DayItem } from "../lib/calendar";
import { addMonthsISO, formatISO, formatLong, monthStartISO } from "../lib/dates";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import DayDialog from "./DayDialog";

type ProjectsApi = ReturnType<typeof useProjects>;

/** The most events a day shows before "+N more" (CLAUDE.md 6.2). */
const MAX_ITEMS_PER_DAY = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Fallback heights (px) for working out how many events fit in a day cell, used until real ones can be measured.
const DAY_NUMBER_HEIGHT = 30;
const EVENT_LINE_HEIGHT = 21;
const CELL_PADDING = 8;

interface CalendarViewProps {
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "addTask" | "updateTask" | "updateProject">;
  /** The month on show (the 1st of it) and the open day dialog are owned by App, so the sidebar and deck can drive them. */
  month: ISODate;
  onMonthChange: (month: ISODate) => void;
  openDay: ISODate | null;
  onOpenDayChange: (date: ISODate | null) => void;
  onNewProject: (deadline: ISODate) => void;
}

function itemText(item: DayItem): string {
  return item.kind === "deadline" ? item.project.name : item.task.text;
}

function describeDay(date: ISODate, items: DayItem[]): string {
  const deadlines = items.filter((i) => i.kind === "deadline").length;
  const tasks = items.length - deadlines;
  const parts: string[] = [];
  if (deadlines > 0) parts.push(`${deadlines} ${deadlines === 1 ? "deadline" : "deadlines"}`);
  if (tasks > 0) parts.push(`${tasks} checklist ${tasks === 1 ? "item" : "items"}`);
  return `${formatLong(date)}, ${parts.length > 0 ? parts.join(" and ") : "nothing due"}`;
}

/**
 * How many lines of events a day cell has room for. The calendar stretches to fit the
 * window, so on a short screen the cells are short and show fewer events (then "+N more").
 */
function useLineCapacity(gridRef: React.RefObject<HTMLDivElement | null>, deps: unknown[]): number {
  const [lines, setLines] = useState(MAX_ITEMS_PER_DAY + 1);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const cell = grid.querySelector<HTMLElement>(".calendar-day");
      if (!cell) return;
      // Use the real heights of a day number and an event pill, so it stays right whatever the skin's text size.
      const numberHeight = cell.querySelector<HTMLElement>(".calendar-num")?.offsetHeight ?? DAY_NUMBER_HEIGHT;
      const pill = grid.querySelector<HTMLElement>(".calendar-item");
      const lineHeight = pill ? pill.getBoundingClientRect().height + 2 : EVENT_LINE_HEIGHT;
      const fits = Math.floor((cell.clientHeight - numberHeight - CELL_PADDING) / lineHeight);
      setLines(Math.max(1, Math.min(MAX_ITEMS_PER_DAY + 1, fits)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
    // Measure again whenever the number of weeks (and so the cell height) changes.
  }, deps);
  return lines;
}

export default function CalendarView({
  projects,
  today,
  api,
  month,
  onMonthChange,
  openDay,
  onOpenDayChange,
  onNewProject,
}: CalendarViewProps) {
  const setMonth = onMonthChange;
  const setOpenDay = onOpenDayChange;

  const index = useMemo(() => buildDayIndex(projects), [projects]);
  const weeks = useMemo(() => monthGrid(month), [month]);
  const gridRef = useRef<HTMLDivElement>(null);
  const lines = useLineCapacity(gridRef, [weeks.length]);

  return (
    <section className="view" aria-labelledby="calendar-title">
      <div className="view-toolbar">
        <h2 id="calendar-title" className="panel-title calendar-title">
          <strong>{formatISO(month, "MMMM")}</strong> <span className="calendar-year">{formatISO(month, "yyyy")}</span>
        </h2>
        <div className="calendar-nav" role="group" aria-label="Change month">
          <button type="button" className="btn" onClick={() => setMonth(addMonthsISO(month, -1))}>
            <span aria-hidden="true">‹</span> Previous
          </button>
          <button type="button" className="btn" onClick={() => setMonth(monthStartISO(today))}>
            Today
          </button>
          <button type="button" className="btn" onClick={() => setMonth(addMonthsISO(month, 1))}>
            Next <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div
        ref={gridRef}
        className="calendar-grid"
        role="table"
        aria-labelledby="calendar-title"
        style={{ "--weeks": weeks.length } as CSSProperties}
      >
        <div className="calendar-head" role="row">
          {WEEKDAYS.map((day) => (
            <div key={day} role="columnheader" className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} className="calendar-week" role="row">
            {week.map((date) => {
              const items = itemsOn(index, date);
              // Show everything if it fits; otherwise leave room for the "+N more" line.
              const room = Math.min(lines, MAX_ITEMS_PER_DAY);
              const shown = items.length <= room ? items : room >= 2 ? items.slice(0, room - 1) : [];
              const more = items.length - shown.length;
              const inMonth = date.slice(0, 7) === month.slice(0, 7);
              return (
                <div key={date} role="cell" className="calendar-cell">
                  <button
                    type="button"
                    className="calendar-day"
                    data-today={date === today || undefined}
                    data-outside={!inMonth || undefined}
                    aria-label={describeDay(date, items)}
                    aria-current={date === today ? "date" : undefined}
                    onClick={() => setOpenDay(date)}
                  >
                    <span className="calendar-num num">{Number(date.slice(8))}</span>
                    <span className="calendar-items">
                      {shown.map((item) => (
                        <span
                          key={item.kind === "deadline" ? `d-${item.project.id}` : `t-${item.task.id}`}
                          className="calendar-item"
                          data-kind={item.kind}
                          data-done={(item.kind === "task" && item.task.done) || undefined}
                          style={{ "--project-color": item.project.color } as CSSProperties}
                        >
                          <span className="calendar-mark" aria-hidden="true" />
                          <span className="calendar-text">{itemText(item)}</span>
                        </span>
                      ))}
                      {more > 0 && (
                        <span className="calendar-more">
                          +{more}
                          <span className="calendar-more-word"> more</span>
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {openDay && (
        <DayDialog
          date={openDay}
          projects={projects}
          today={today}
          api={api}
          onNewProject={() => {
            const date = openDay;
            setOpenDay(null);
            onNewProject(date);
          }}
          onClose={() => setOpenDay(null)}
        />
      )}
    </section>
  );
}
