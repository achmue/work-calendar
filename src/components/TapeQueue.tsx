import { useMemo, type CSSProperties } from "react";
import { COMING_UP_DAYS, comingUp, dayLabel } from "../lib/agenda";
import { formatISO } from "../lib/dates";
import type { useProjects } from "../state/useProjects";
import type { ISODate, Project } from "../types";
import { agendaKey as itemKey, agendaText as itemText, tickItem, tickLabel } from "./agendaActions";
import { TRANSPORT, TransportIcon } from "./icons";

type ProjectsApi = ReturnType<typeof useProjects>;

interface TapeQueueProps {
  projects: Project[];
  today: ISODate;
  api: Pick<ProjectsApi, "updateProject" | "updateTask">;
}

/**
 * "Coming up", as a rack of cassettes standing on a shelf in date order: the date on top, the title
 * down the spine, and an eject button to tick it off. The first one is pulled out a little and
 * described on the display beside the rack.
 */
export default function TapeQueue({ projects, today, api }: TapeQueueProps) {
  const items = useMemo(() => comingUp(projects, today), [projects, today]);
  const first = items[0];

  const tick = (item: (typeof items)[number]) => tickItem(api, item);

  return (
    <section className="tp-rack" aria-labelledby="queue-title">
      <h2 id="queue-title" className="tp-rack-title">
        The queue · next {COMING_UP_DAYS} days
      </h2>

      {first ? (
        <div className="tp-next" role="group" aria-label="Next up" data-late={first.date < today || undefined}>
          <span className="tp-next-row" aria-hidden="true">
            ▶ NEXT UP · {dayLabel(first.date, today).toUpperCase()}
          </span>
          <strong className="tp-next-title">{itemText(first)}</strong>
          <span className="tp-next-sub">
            {first.kind === "deadline" ? "DEADLINE" : first.project.name.toUpperCase()}
            {first.kind === "task" ? "" : ` · ${formatISO(first.date, "d MMM").toUpperCase()}`}
          </span>
          <button type="button" className="tp-next-done" onClick={() => tick(first)} aria-label={tickLabel(first)}>
            <TransportIcon path={TRANSPORT.eject} /> Done
          </button>
        </div>
      ) : (
        <div className="tp-next tp-next-empty" role="status">
          <span className="tp-next-row">▶ ALL CAUGHT UP</span>
          <strong className="tp-next-title">Nothing is due in the next {COMING_UP_DAYS} days.</strong>
        </div>
      )}

      <ul className="tp-spines" aria-label="Things coming up, soonest first">
        {items.map((item, i) => (
          <li
            key={itemKey(item)}
            className="tp-spine"
            data-next={i === 0 || undefined}
            data-late={item.date < today || undefined}
            data-deadline={item.kind === "deadline" || undefined}
            style={{ "--project-color": item.project.color } as CSSProperties}
          >
            <span className="tp-spine-date">
              <b>{Number(item.date.slice(8))}</b>
              <small>{formatISO(item.date, "EEE")}</small>
            </span>
            <span className="tp-spine-label">
              <span title={`${itemText(item)} · ${dayLabel(item.date, today)}`}>{itemText(item)}</span>
            </span>
            <button type="button" className="tp-eject" onClick={() => tick(item)} aria-label={tickLabel(item)}>
              <TransportIcon path={TRANSPORT.eject} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
