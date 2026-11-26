import type { RefObject } from "react";
import type { ShortcutAction } from "../lib/shortcuts";
import type { ProjectInput, useProjects } from "../state/useProjects";
import type { ISODate, Project, ViewId } from "../types";
import type { TapeTimelineHandle } from "./TapeTimeline";

/** Everything a layout needs to show and drive the app. App owns the state; layouts only arrange it. */
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
  /** A key used from the keyboard looks pressed for a moment. */
  pressed: ShortcutAction | null;
  /** The transport: previous/next month, today, and one week back/forward. */
  onNavigate: (action: NavigateAction) => void;
  timelineRef: RefObject<TapeTimelineHandle>;
  saveFailed: boolean;
  editing: boolean;
}

export type NavigateAction = "prev-month" | "next-month" | "today" | "week-back" | "week-forward";
