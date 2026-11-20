import { useMemo, type CSSProperties } from "react";
import { buildDayIndex, itemsOn, monthGrid, type DayItem } from "../lib/calendar";
import { addMonthsISO, formatISO, formatLong, monthStartISO } from "../lib/dates";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import DayDialog from "./DayDialog";

type ProjectsApi = ReturnType<typeof useProjects>;

const MAX_ITEMS_PER_DAY = 3;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

      <table className="calendar-grid" aria-labelledby="calendar-title">
        <thead>
          <tr>
            {WEEKDAYS.map((day) => (
              <th key={day} scope="col" className="calendar-weekday">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((date) => {
                const items = itemsOn(index, date);
                const shown = items.slice(0, MAX_ITEMS_PER_DAY);
                const more = items.length - shown.length;
                const inMonth = date.slice(0, 7) === month.slice(0, 7);
                return (
                  <td key={date} className="calendar-cell">
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
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

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
