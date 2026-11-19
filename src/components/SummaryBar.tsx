import { summarize } from "../lib/agenda";
import { DUE_SOON_DAYS } from "../lib/status";
import type { ISODate, Project } from "../types";

interface SummaryBarProps {
  projects: Project[];
  today: ISODate;
}

export default function SummaryBar({ projects, today }: SummaryBarProps) {
  const { overdue, dueSoon, tasksDone, tasksTotal } = summarize(projects, today);
  return (
    <section className="summary" aria-label="Summary">
      <dl className="summary-tile" data-tone={overdue > 0 ? "danger" : undefined}>
        <dt>Overdue</dt>
        <dd className="readout">{overdue}</dd>
      </dl>
      <dl className="summary-tile">
        <dt>Due in the next {DUE_SOON_DAYS} days</dt>
        <dd className="readout">{dueSoon}</dd>
      </dl>
      <dl className="summary-tile">
        <dt>Checklist items done</dt>
        <dd className="readout">
          {tasksDone}/{tasksTotal}
        </dd>
      </dl>
    </section>
  );
}
