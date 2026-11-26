import { useMemo, type CSSProperties } from "react";
import { COMING_UP_DAYS, comingUp, dayLabel } from "../lib/agenda";
import { formatISO } from "../lib/dates";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import { agendaKey, agendaText, tickItem, tickLabel } from "./agendaActions";

type ProjectsApi = ReturnType<typeof useProjects>;

interface ClotheslineProps {
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "updateProject" | "updateTask">;
}

/** "Coming up", as paper tags pegged on a line in date order. Tick one and it comes off the line. */
export default function Clothesline({ projects, today, api }: ClotheslineProps) {
  const items = useMemo(() => comingUp(projects, today), [projects, today]);

  return (
    <section className="ck-line" aria-labelledby="line-title">
      <h2 id="line-title" className="ck-line-title">
        Coming up · next {COMING_UP_DAYS} days
      </h2>
      {items.length === 0 ? (
        <p className="ck-line-empty" role="status">
          All caught up: nothing is due in the next {COMING_UP_DAYS} days.
        </p>
      ) : (
        <ul className="ck-tags" aria-label="Things coming up, soonest first">
          {items.map((item) => (
            <li
              key={agendaKey(item)}
              className="ck-tag"
              data-late={item.date < today || undefined}
              data-deadline={item.kind === "deadline" || undefined}
              style={{ "--project-color": item.project.color } as CSSProperties}
            >
              <span className="ck-peg" aria-hidden="true" />
              <span className="ck-tag-date">
                {formatISO(item.date, "EEE d")}
                {item.date < today ? " · late" : ""}
                {item.kind === "deadline" ? " ◆" : ""}
              </span>
              <span className="ck-tag-text" title={`${agendaText(item)} · ${dayLabel(item.date, today)}`}>
                {agendaText(item)}
              </span>
              <button type="button" className="ck-tag-tick" aria-label={tickLabel(item)} onClick={() => tickItem(api, item)}>
                <span aria-hidden="true">✓</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
