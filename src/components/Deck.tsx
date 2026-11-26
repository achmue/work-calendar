import { useMemo, useSyncExternalStore, type CSSProperties } from "react";
import { comingUp, dayLabel, type AgendaItem } from "../lib/agenda";
import { clockText, dayProgress } from "../lib/dayProgress";
import { formatISO, isoWeek } from "../lib/dates";
import { getLcdMessage, subscribeLcd } from "../lib/lcdMessage";
import { useNow } from "../state/useClock";
import type { ISODate, Project } from "../types";

// The LCD of the tape deck. It shows real data: today, what's next, and a clock.

const pad = (n: number) => String(n).padStart(2, "0");

const itemName = (item: AgendaItem) => (item.kind === "deadline" ? `${item.project.name} deadline` : item.task.text);

export function DeckLcd({ projects, today }: { projects: Project[]; today: ISODate }) {
  const items = useMemo(() => comingUp(projects, today).slice(0, 6), [projects, today]);
  const lines = items.map((item, i) => `${pad(i + 1)} ${itemName(item)} · ${dayLabel(item.date, today)}`.toUpperCase());
  const ticker = lines.length > 0 ? lines.map((l) => `▶ ${l}`).join("     ") : "▶ ALL CAUGHT UP · NOTHING DUE";
  const seconds = Math.max(18, Math.round(ticker.length * 0.24));
  const first = items[0];
  // Other parts of the app flash short messages here ("TRACK DONE") for a moment
  const message = useSyncExternalStore(subscribeLcd, getLcdMessage);
  // The clock, and how far through the working day we are (the bar along the bottom of the display)
  const now = useNow();
  const dayPercent = Math.round(dayProgress(now) * 100);

  return (
    <div className="deck-lcd" role="group" aria-label="Today, and what's coming up next">
      <div className="lcd-row" aria-hidden="true">
        <span className="lcd-blink">{message ? "● REC" : "▶ PLAY"}</span>
        <span>
          WEEK {isoWeek(today)} · <span className="lcd-clock">{clockText(now)}</span>
        </span>
        <span>{formatISO(today, "yyyy")}</span>
      </div>
      <div className="lcd-big">{formatISO(today, "EEE d MMM").toUpperCase()}</div>
      {message ? (
        <div key={message.id} className="lcd-ticker lcd-flash" aria-hidden="true">
          ▶ {message.text}
        </div>
      ) : (
        <div className="lcd-ticker" aria-hidden="true">
          <span className="lcd-track" style={{ animationDuration: `${seconds}s` }}>
            <span>{ticker}</span>
            <span>{ticker}</span>
          </span>
        </div>
      )}
      <div className="lcd-seek" aria-hidden="true" data-day={dayPercent} style={{ "--day": `${dayPercent}%` } as CSSProperties} />
      <span className="sr-only">
        {first ? `Next up: ${itemName(first)}, ${dayLabel(first.date, today)}.` : "Nothing is due. You're all caught up."}
      </span>
      <span className="sr-only" role="status">
        {message?.text ?? ""}
      </span>
    </div>
  );
}
