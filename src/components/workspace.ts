import type { ProjectInput, useProjects } from "../state/useProjects";
import type { ISODate, Project, ViewId } from "../types";

/** Everything the board needs to show and drive the app. App owns the state; the layout only arranges it. */
export interface WorkspaceProps {
  projects: Project[];
  today: ISODate;
  api: ReturnType<typeof useProjects>;
  view: ViewId;
  onViewChange: (view: ViewId) => void;
  /** The month the calendar shows, and the day whose dialog is open. */
  month: ISODate;
  onMonthChange: (month: ISODate) => void;
  openDay: ISODate | null;
  onOpenDayChange: (day: ISODate | null) => void;
  highlightId: string | null;
  onHighlightDone: () => void;
  onNewProject: (defaults?: Partial<ProjectInput>) => void;
  onEditProject: (id: string) => void;
  onOpenProject: (id: string) => void;
  onOpenSkins: () => void;
  onOpenBackup: () => void;
  onOpenHelp: () => void;
  sound: { on: boolean; onToggle: () => void };
  /** Who is signed in, and the way out. */
  account: { demo: boolean; email: string; onLogOut: () => void };
  saveFailed: boolean;
  /** True while the skin editor is open beside the board. */
  editing: boolean;
}
