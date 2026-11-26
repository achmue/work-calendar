import type { ReactNode } from "react";
import CalendarView from "./components/CalendarView";
import TimelineView from "./components/TimelineView";
import type { WorkspaceProps } from "./components/workspace";
import type { ViewId } from "./lib/pages";

// What each page puts on the board. Every page listed in lib/pages.ts needs an entry here
// (the type check fails until it has one).

export interface PageContent {
  /** Drawn on the paper sheet. Leave it out for a page that is only the project cards. */
  sheet?: (props: WorkspaceProps) => ReactNode;
  /** Show the project cards, "coming up" and the drawer: beside the sheet, or on their own. */
  cards: boolean;
}

export const PAGE_CONTENT: Record<ViewId, PageContent> = {
  calendar: {
    cards: true,
    sheet: (props) => (
      <CalendarView
        projects={props.projects}
        today={props.today}
        api={props.api}
        month={props.month}
        onMonthChange={props.onMonthChange}
        openDay={props.openDay}
        onOpenDayChange={props.onOpenDayChange}
        onNewProject={(deadline) => props.onNewProject({ deadline })}
        showSpans
      />
    ),
  },
  timeline: {
    cards: true,
    sheet: (props) => <TimelineView projects={props.projects} today={props.today} onOpenProject={props.onOpenProject} />,
  },
  projects: {
    cards: true,
  },
};
