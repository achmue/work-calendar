import type { ViewId } from "../types";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "projects", label: "Projects" },
];

interface HeaderProps {
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  onOpenSkins: () => void;
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

export default function Header({ view, onViewChange, onOpenSkins }: HeaderProps) {
  return (
    <header className="app-header">
      <h1 className="app-title">Work Calendar</h1>
      <div className="header-tools">
        <button type="button" className="btn btn-icon" onClick={onOpenSkins}>
          <PaletteIcon />
          Skins
        </button>
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
    </header>
  );
}
