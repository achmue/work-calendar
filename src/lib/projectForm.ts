import { isISODate } from "./dates";

export interface ProjectFormValues {
  name: string;
  start: string;
  deadline: string;
}

export interface ProjectFormErrors {
  name?: string;
  start?: string;
  deadline?: string;
}

/** Name and deadline are required; the start can't be after the deadline. */
export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  if (values.name.trim() === "") errors.name = "Give your project a name.";
  if (!isISODate(values.deadline)) errors.deadline = "Choose a deadline.";
  if (values.start !== "" && !isISODate(values.start)) {
    errors.start = "That start date isn't valid.";
  } else if (values.start !== "" && !errors.deadline && values.start > values.deadline) {
    errors.start = "The start date can't be after the deadline.";
  }
  return errors;
}
