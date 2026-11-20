import { useEffect, useMemo, useReducer, useState } from "react";
import { todayISO } from "../lib/dates";
import { newId } from "../lib/id";
import { makeSampleProjects } from "../lib/sampleProjects";
import { loadProjects, saveProjects } from "../storage/storage";
import type { Project, Task } from "../types";

/** What you fill in to make a project. The rest (id, tasks...) is filled for you. */
export type ProjectInput = Pick<Project, "name" | "details" | "color" | "start" | "deadline">;
export type ProjectPatch = Partial<Omit<Project, "id" | "createdAt">>;
/** What you fill in to make a checklist item. */
export type TaskInput = Pick<Task, "text" | "due">;
export type TaskPatch = Partial<Omit<Task, "id">>;

export type ProjectsAction =
  | { type: "add"; project: Project }
  | { type: "update"; id: string; patch: ProjectPatch }
  | { type: "delete"; id: string }
  | { type: "addTask"; projectId: string; task: Task }
  | { type: "updateTask"; projectId: string; taskId: string; patch: TaskPatch }
  | { type: "deleteTask"; projectId: string; taskId: string }
  | { type: "replaceAll"; projects: Project[] };

function changeProject(
  projects: Project[],
  id: string,
  change: (project: Project) => Project,
): Project[] {
  return projects.map((project) => (project.id === id ? change(project) : project));
}

/**
 * Pure and free of side effects (ids and dates are made before dispatching),
 * so it behaves the same under React StrictMode and is easy to test.
 */
export function projectsReducer(projects: Project[], action: ProjectsAction): Project[] {
  switch (action.type) {
    case "add":
      return [...projects, action.project];
    case "update":
      return changeProject(projects, action.id, (p) => ({ ...p, ...action.patch }));
    case "delete":
      return projects.filter((p) => p.id !== action.id);
    case "addTask":
      return changeProject(projects, action.projectId, (p) => ({
        ...p,
        tasks: [...p.tasks, action.task],
      }));
    case "updateTask":
      return changeProject(projects, action.projectId, (p) => ({
        ...p,
        tasks: p.tasks.map((t) => (t.id === action.taskId ? { ...t, ...action.patch } : t)),
      }));
    case "deleteTask":
      return changeProject(projects, action.projectId, (p) => ({
        ...p,
        tasks: p.tasks.filter((t) => t.id !== action.taskId),
      }));
    case "replaceAll":
      return action.projects;
  }
}

/** Saved projects, or the example projects the very first time. */
function loadInitialProjects(): Project[] {
  return loadProjects() ?? makeSampleProjects(todayISO(), new Date().toISOString());
}

/** All projects + checklist items, saved to the browser whenever they change. */
export function useProjects() {
  const [projects, dispatch] = useReducer(projectsReducer, undefined, loadInitialProjects);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setSaveFailed(!saveProjects(projects));
  }, [projects]);

  const actions = useMemo(
    () => ({
      addProject(input: ProjectInput): Project {
        const project: Project = {
          ...input,
          id: newId(),
          done: false,
          tasks: [],
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "add", project });
        return project;
      },
      updateProject(id: string, patch: ProjectPatch): void {
        dispatch({ type: "update", id, patch });
      },
      deleteProject(id: string): void {
        dispatch({ type: "delete", id });
      },
      addTask(projectId: string, input: TaskInput): Task {
        const task: Task = { ...input, id: newId(), done: false };
        dispatch({ type: "addTask", projectId, task });
        return task;
      },
      updateTask(projectId: string, taskId: string, patch: TaskPatch): void {
        dispatch({ type: "updateTask", projectId, taskId, patch });
      },
      deleteTask(projectId: string, taskId: string): void {
        dispatch({ type: "deleteTask", projectId, taskId });
      },
      /** Swap the whole list (used when restoring a backup). */
      replaceAll(next: Project[]): void {
        dispatch({ type: "replaceAll", projects: next });
      },
    }),
    [],
  );

  return { projects, saveFailed, ...actions };
}
