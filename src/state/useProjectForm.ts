import { useState, type FormEvent } from "react";
import { draftsToPlans, validatePlanDrafts, type PlanDraft } from "../lib/plans";
import { validateProjectForm, type ProjectFormErrors } from "../lib/projectForm";
import type { ProjectInput } from "./useProjects";

/**
 * The fields of a new project and their checking, shared by each layout's "add project" screen
 * (a blank tape, a blank index card): only the look differs.
 */
export function useProjectForm(
  defaults: Partial<ProjectInput> | undefined,
  suggestedColor: string,
  onSave: (result: Required<ProjectInput> & { done: boolean }) => void,
) {
  const [name, setNameValue] = useState(defaults?.name ?? "");
  const [details, setDetails] = useState(defaults?.details ?? "");
  const [color, setColor] = useState(defaults?.color ?? suggestedColor);
  const [start, setStartValue] = useState(defaults?.start ?? "");
  const [deadline, setDeadlineValue] = useState(defaults?.deadline ?? "");
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [planDrafts, setDrafts] = useState<PlanDraft[]>([]);
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});
  const setPlanDrafts = (next: PlanDraft[]) => {
    setDrafts(next);
    setPlanErrors({});
  };

  // A message goes away as soon as you change the field it is about.
  const change = (field: keyof ProjectFormErrors, set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors(({ [field]: _gone, ...rest }) => rest);
  };
  const setName = change("name", setNameValue);
  const setStart = change("start", setStartValue);
  const setDeadline = change("deadline", setDeadlineValue);

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateProjectForm({ name, start, deadline });
    const foundInPlans = validatePlanDrafts(planDrafts);
    setErrors(found);
    setPlanErrors(foundInPlans);
    if (Object.keys(found).length > 0 || Object.keys(foundInPlans).length > 0) return;
    onSave({ name: name.trim(), details, color, start, deadline, done: false, plans: draftsToPlans(planDrafts) });
  }

  return {
    name, setName, details, setDetails, color, setColor, start, setStart, deadline, setDeadline, errors, submit,
    planDrafts, setPlanDrafts, planErrors,
  };
}
