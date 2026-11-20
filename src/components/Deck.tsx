import { useMemo, useSyncExternalStore, type CSSProperties } from "react";
import { comingUp, dayLabel, dueCountsByDay, type AgendaItem } from "../lib/agenda";
import { formatISO, isoWeek } from "../lib/dates";
import { getLcdMessage, subscribeLcd } from "../lib/lcdMessage";
import type { ISODate, Project } from "../types";

// The "portable player" bits of the header, used by skins with chrome: "player".
// They show real data: the LCD is today and what's next, the keys move the calendar,
// and the equaliser is how busy the next two weeks are.

const NEXT_DAYS = 14;
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

  return (
    <div className="deck-lcd" role="group" aria-label="Today, and what's coming up next">
      <div className="lcd-row" aria-hidden="true">
        <span className="lcd-blink">{message ? "● REC" : "▶ PLAY"}</span>
        <span>WEEK {isoWeek(today)}</span>
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
      <span className="sr-only">
        {first ? `Next up: ${itemName(first)}, ${dayLabel(first.date, today)}.` : "Nothing is due. You're all caught up."}
      </span>
      <span className="sr-only" role="status">
        {message?.text ?? ""}
      </span>
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

interface DeckKeysProps {
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

/** Transport keys: previous month, today, next month. */
export function DeckKeys({ onPrev, onToday, onNext }: DeckKeysProps) {
  return (
    <div className="deck-keys" role="group" aria-label="Calendar month controls">
      <div className="deck-key">
        <button type="button" className="deck-cap" aria-label="Previous month" onClick={onPrev}>
          <Icon path="M4 5h2v14H4zM19 5v14L8 12z" />
        </button>
        <small aria-hidden="true">PREV</small>
      </div>
      <div className="deck-key">
        <button type="button" className="deck-cap" aria-label="Go to today" onClick={onToday}>
          <Icon path="M8 5v14l11-7z" />
          <span className="deck-led" aria-hidden="true" />
        </button>
        <small aria-hidden="true">TODAY</small>
      </div>
      <div className="deck-key">
        <button type="button" className="deck-cap" aria-label="Next month" onClick={onNext}>
          <Icon path="M5 5l11 7-11 7zM18 5h2v14h-2z" />
        </button>
        <small aria-hidden="true">NEXT</small>
      </div>
    </div>
  );
}

/** A little LCD equaliser: how many things are due on each of the next 14 days. */
export function DeckMeter({ projects, today }: { projects: Project[]; today: ISODate }) {
  const counts = useMemo(() => dueCountsByDay(projects, today, NEXT_DAYS), [projects, today]);
  const total = counts.reduce((sum, n) => sum + n, 0);
  return (
    <div
      className="deck-meter"
      role="img"
      aria-label={`${total} ${total === 1 ? "thing" : "things"} due in the next ${NEXT_DAYS} days`}
    >
      <div className="deck-bars" aria-hidden="true">
        {counts.map((n, i) => (
          <i key={i} style={{ "--n": Math.min(n, 8) } as CSSProperties} />
        ))}
      </div>
      <small aria-hidden="true">NEXT {NEXT_DAYS} DAYS</small>
    </div>
  );
}
