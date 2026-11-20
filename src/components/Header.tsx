import type { ISODate, Project, ViewId } from "../types";
import { DeckKeys, DeckLcd, DeckMeter } from "./Deck";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "projects", label: "Projects" },
];

/** Extra data for the "player" header (LCD, keys, equaliser). Left out for plain skins. */
export interface DeckProps {
  projects: Project[];
  today: ISODate;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

interface HeaderProps {
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  onOpenSkins: () => void;
  onOpenBackup: () => void;
  deck?: DeckProps;
  /** The optional sound effects switch (shown with the player look). */
  sound?: { on: boolean; onToggle: () => void };
}

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.5-1.9-.4-1.2.4-2.1 1.6-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7" r="1" />
    </svg>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6m0-6-5 6" />}
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function Header({ view, onViewChange, onOpenSkins, onOpenBackup, deck, sound }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <h1 className="app-title">Work Calendar</h1>
        {deck && <DeckLcd projects={deck.projects} today={deck.today} />}
        {deck && <DeckKeys onPrev={deck.onPrev} onToday={deck.onToday} onNext={deck.onNext} />}
        <div className="header-tools">
          <button type="button" className="btn btn-icon" title="Skins" data-skins-button onClick={onOpenSkins}>
            <PaletteIcon />
            <span className="btn-label">Skins</span>
          </button>
          <button type="button" className="btn btn-icon" title="Backup" data-backup-button onClick={onOpenBackup}>
            <DownloadIcon />
            <span className="btn-label">Backup</span>
          </button>
          {sound && (
            <button
              type="button"
              className="btn btn-icon"
              title="Sound effects"
              aria-pressed={sound.on}
              data-sound-button
              onClick={sound.onToggle}
            >
              <SpeakerIcon on={sound.on} />
              <span className="btn-label">Sound effects</span>
            </button>
          )}
        </div>
        <nav className="view-tabs" aria-label="Views">
          {VIEWS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className="view-tab"
              aria-current={view === id ? "page" : undefined}
              onClick={() => onViewChange(id)}
            >
              {label}
            </button>
          ))}
        </nav>
        {deck && <DeckMeter projects={deck.projects} today={deck.today} />}
      </div>
      {deck && (
        <p className="deck-engrave" aria-hidden="true">
          WORK·CAL · PORTABLE PLANNER · MODEL PL-90 · STEREO
        </p>
      )}
      {deck && (
        <div className="deck-badges" aria-hidden="true">
          <span>HI-FI STEREO</span>
          <span>AUTO REVERSE</span>
          <span>NOISE REDUCTION</span>
        </div>
      )}
    </header>
  );
}
