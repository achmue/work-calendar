import { summarize } from "../lib/agenda";
import { DUE_SOON_DAYS } from "../lib/status";
import type { ISODate, Project } from "../types";
import Odometer from "./Odometer";
import VuMeter from "./VuMeter";

interface SummaryBarProps {
  projects: Project[];
  today: ISODate;
  /** Skins with the player look get rolling counters and a VU meter. */
  player?: boolean;
}

export default function SummaryBar({ projects, today, player = false }: SummaryBarProps) {
  const { overdue, dueSoon, tasksDone, tasksTotal } = summarize(projects, today);
  const numbers = {
    overdue: String(overdue),
    dueSoon: String(dueSoon),
    done: `${tasksDone}/${tasksTotal}`,
  };

  return (
    <section className="summary" aria-label="Summary">
      <dl className="summary-tile" data-tone={overdue > 0 ? "danger" : undefined}>
        <dt>Overdue</dt>
        <dd className="readout">{player ? <Odometer value={numbers.overdue} /> : numbers.overdue}</dd>
      </dl>
      <dl className="summary-tile" data-vu={player || undefined}>
        <dt>Due in the next {DUE_SOON_DAYS} days</dt>
        <dd className="readout">{player ? <Odometer value={numbers.dueSoon} /> : numbers.dueSoon}</dd>
        {player && (
          <dd className="summary-vu" aria-hidden="true">
            <VuMeter value={dueSoon} />
          </dd>
        )}
      </dl>
      <dl className="summary-tile">
        <dt>Checklist items done</dt>
        <dd className="readout">{player ? <Odometer value={numbers.done} /> : numbers.done}</dd>
      </dl>
    </section>
  );
}
