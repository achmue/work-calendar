import { useState } from "react";
import Header from "./components/Header";
import { useSkin } from "./state/useSkin";
import type { ViewId } from "./types";

const PLACEHOLDERS: Record<ViewId, { title: string; text: string }> = {
  calendar: {
    title: "Calendar",
    text: "Your month calendar will show up here.",
  },
  timeline: {
    title: "Timeline",
    text: "Your projects will be laid out as bars on a timeline here.",
  },
  projects: {
    title: "Projects",
    text: "Your projects and their checklists will show up here.",
  },
};

export default function App() {
  useSkin();
  const [view, setView] = useState<ViewId>("calendar");
  const placeholder = PLACEHOLDERS[view];

  return (
    <div className="app">
      <Header view={view} onViewChange={setView} />
      <div className="app-body">
        <main className="panel main-panel" aria-labelledby="view-title">
          <h2 id="view-title" className="panel-title">
            {placeholder.title}
          </h2>
          <p className="muted">{placeholder.text}</p>
        </main>
        <aside className="panel side-panel" aria-labelledby="coming-up-title">
          <h2 id="coming-up-title" className="panel-title">
            Coming up
          </h2>
          <p className="muted">
            Deadlines and checklist items due soon will appear here.
          </p>
        </aside>
      </div>
    </div>
  );
}
