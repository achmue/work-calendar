import type { AgendaItem } from "../lib/agenda";
import type { useProjects } from "../state/useProjects";

type TickApi = Pick<ReturnType<typeof useProjects>, "updateProject" | "updateTask" | "updatePlan">;

/** Shared by every layout's "coming up": the words for an item, and ticking it off. */
export function agendaText(item: AgendaItem): string {
  if (item.kind === "deadline") return item.project.name;
  return item.kind === "plan" ? item.plan.name : item.task.text;
}

export function agendaKey(item: AgendaItem): string {
  if (item.kind === "deadline") return `d-${item.project.id}`;
  return item.kind === "plan" ? `p-${item.project.id}-${item.plan.id}` : `t-${item.project.id}-${item.task.id}`;
}

export function tickLabel(item: AgendaItem): string {
  if (item.kind === "deadline") return `Mark "${item.project.name}" as finished`;
  return item.kind === "plan" ? `Mark the small plan "${item.plan.name}" as finished` : `Tick off "${item.task.text}"`;
}

export function tickItem(api: TickApi, item: AgendaItem): void {
  if (item.kind === "deadline") api.updateProject(item.project.id, { done: true });
  else if (item.kind === "plan") api.updatePlan(item.project.id, item.plan.id, { done: true });
  else api.updateTask(item.project.id, item.task.id, { done: true });
}
