import type { ViewId } from "../types";

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "timeline", label: "Timeline" },
  { id: "projects", label: "Projects" },
];

interface HeaderProps {
  view: ViewId;
  onViewChange: (view: ViewId) => void;
}

export default function Header({ view, onViewChange }: HeaderProps) {
  return (
    <header className="app-header">
      <h1 className="app-title">Work Calendar</h1>
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
