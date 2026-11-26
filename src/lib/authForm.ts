// Checking what's typed on the log in and create account pages.

export const MIN_PASSWORD_LENGTH = 8;
/** The longest address email allows. */
export const MAX_EMAIL_LENGTH = 254;

export type AuthMode = "login" | "signup";

export interface AuthValues {
  email: string;
  password: string;
  /** The password typed a second time (create account only). */
  repeat: string;
}

export type AuthErrors = Partial<Record<keyof AuthValues, string>>;

/** Spaces around an address, and capitals in it, don't make it a different one. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuthForm(values: AuthValues, mode: AuthMode): AuthErrors {
  const errors: AuthErrors = {};
  const email = normalizeEmail(values.email);
  if (email === "") errors.email = "Enter your email address.";
  else if (email.length > MAX_EMAIL_LENGTH || !LOOKS_LIKE_EMAIL.test(email)) {
    errors.email = "That doesn't look like an email address.";
  }

  if (values.password === "") errors.password = "Enter your password.";
  // Only a new password has to be long enough: an old one is whatever it is.
  else if (mode === "signup" && values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (mode === "signup") {
    if (values.repeat === "") errors.repeat = "Type the password again.";
    else if (values.repeat !== values.password) errors.repeat = "The two passwords don't match.";
  }
  return errors;
}
