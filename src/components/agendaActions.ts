import type { AgendaItem } from "../lib/agenda";
import type { useProjects } from "../state/useProjects";

type TickApi = Pick<ReturnType<typeof useProjects>, "updateProject" | "updateTask">;

/** Shared by every layout's "coming up": the words for an item, and ticking it off. */
export const agendaText = (item: AgendaItem) => (item.kind === "deadline" ? item.project.name : item.task.text);
export const agendaKey = (item: AgendaItem) => (item.kind === "deadline" ? `d-${item.project.id}` : `t-${item.task.id}`);
export const tickLabel = (item: AgendaItem) =>
  item.kind === "deadline" ? `Mark "${item.project.name}" as finished` : `Tick off "${item.task.text}"`;

export function tickItem(api: TickApi, item: AgendaItem): void {
  if (item.kind === "deadline") api.updateProject(item.project.id, { done: true });
  else api.updateTask(item.project.id, item.task.id, { done: true });
}
