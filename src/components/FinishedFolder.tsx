import { useId, type CSSProperties } from "react";
import type { Project } from "../types";

/** How many names are written on the front before the rest are counted. */
const SHOWN = 6;

interface FinishedFolderProps {
  projects: Project[];
  onOpen: (id: string) => void;
  onShowAll: () => void;
}

/** Finished projects come off the board and go into a folder. Click a name to see its card again. */
export default function FinishedFolder({ projects, onOpen, onShowAll }: FinishedFolderProps) {
  const headingId = useId();
  const more = projects.length - SHOWN;

  return (
    <section className="ck-folder" aria-labelledby={headingId}>
      <h2 id={headingId} className="ck-folder-tab">
        Finished
      </h2>
      <p className="ck-folder-title">Closed projects</p>
      <ul>
        {projects.slice(0, SHOWN).map((project) => (
          <li key={project.id}>
            <button
              type="button"
              className="ck-folder-item"
              style={{ "--project-color": project.color } as CSSProperties}
              onClick={() => onOpen(project.id)}
            >
              {project.name}
            </button>
          </li>
        ))}
        {more > 0 && (
          <li>
            <button type="button" className="ck-folder-item" onClick={onShowAll}>
              and {more} more
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
