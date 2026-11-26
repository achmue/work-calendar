import type { ISODate, Project } from "../types";
import { addDaysISO } from "./dates";
import { PROJECT_COLORS } from "./projectColors";

const EXAMPLE_NOTE =
  "This is an example project so you can see how things look. Edit it or delete it whenever you like.";

/**
 * Two clearly labelled example projects, shown on first run only.
 * Dates are relative to `today` so the examples always look current.
 */
export function makeSampleProjects(today: ISODate, createdAt: string): Project[] {
  const day = (offset: number) => addDaysISO(today, offset);

  return [
    {
      id: "example-website-launch",
      name: "Example: Website launch",
      details: EXAMPLE_NOTE,
      color: PROJECT_COLORS[0],
      start: day(-14),
      deadline: day(5),
      done: false,
      createdAt,
      plans: [
        { id: "example-plan-content", name: "Content", due: day(-4), done: false },
        { id: "example-plan-publish", name: "Review and publish", due: day(5), done: false },
      ],
      tasks: [
        { id: "example-launch-1", text: "Draft the page outline", due: day(-10), done: true, planId: "example-plan-content" },
        { id: "example-launch-2", text: "Write the copy", due: day(-4), done: true, planId: "example-plan-content" },
        { id: "example-launch-3", text: "Get feedback from the team", due: day(-1), done: false, planId: "example-plan-publish" },
        { id: "example-launch-4", text: "Final checks", due: day(3), done: false, planId: "example-plan-publish" },
        { id: "example-launch-5", text: "Publish", due: day(5), done: false, planId: "example-plan-publish" },
      ],
    },
    {
      id: "example-team-offsite",
      name: "Example: Plan the team offsite",
      details: EXAMPLE_NOTE,
      color: PROJECT_COLORS[3],
      start: day(-3),
      deadline: day(25),
      done: false,
      createdAt,
      plans: [],
      tasks: [
        { id: "example-offsite-1", text: "Pick a date", due: day(2), done: false },
        { id: "example-offsite-2", text: "Book a venue", due: day(7), done: false },
        { id: "example-offsite-3", text: "Send invitations", due: day(14), done: false },
        { id: "example-offsite-4", text: "Plan the agenda", due: "", done: false },
      ],
    },
  ];
}
