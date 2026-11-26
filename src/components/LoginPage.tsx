import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { MAX_EMAIL_LENGTH, MIN_PASSWORD_LENGTH, validateAuthForm, type AuthErrors, type AuthMode } from "../lib/authForm";
import { ACCOUNT_PAGES, isPlainClick, pagePath } from "../lib/pages";
import { BASE } from "../state/useRoute";

interface LoginPageProps {
  mode: AuthMode;
  /** True while accounts are only a stand-in (no back end yet). */
  preview: boolean;
  onModeChange: (mode: AuthMode) => void;
  /** Both give back what went wrong, or null when you're in. */
  onLogIn: (email: string, password: string) => Promise<string | null>;
  onCreateAccount: (email: string, password: string) => Promise<string | null>;
  onDemo: () => void;
}

/** Log in and create account: a card on the cork board, with a note beside it offering the demo. */
export default function LoginPage({ mode, preview, onModeChange, onLogIn, onCreateAccount, onDemo }: LoginPageProps) {
  const ids = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [showing, setShowing] = useState(false);
  const [errors, setErrors] = useState<AuthErrors>({});
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const signingUp = mode === "signup";

  // Moving between the two pages keeps the email, and forgets passwords and messages.
  useEffect(() => {
    setPassword("");
    setRepeat("");
    setErrors({});
    setProblem("");
  }, [mode]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validateAuthForm({ email, password, repeat }, mode);
    setErrors(found);
    setProblem("");
    const first = (["email", "password", "repeat"] as const).find((field) => found[field]);
    if (first) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    const message = await (signingUp ? onCreateAccount(email, password) : onLogIn(email, password));
    setBusy(false);
    if (message) setProblem(message);
  }

  /** One labelled field with its message. Typing in it clears the message. */
  function field(name: keyof AuthErrors, label: string, value: string, set: (value: string) => void, type: string, autoComplete: string, hint?: string) {
    const id = `${ids}-${name}`;
    const error = errors[name];
    const describedBy = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ");
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          maxLength={name === "email" ? MAX_EMAIL_LENGTH : 128}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(e) => {
            set(e.target.value);
            setErrors(({ [name]: _gone, ...rest }) => rest);
          }}
        />
        {hint && (
          <p id={`${id}-hint`} className="lg-hint">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="field-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  const changePage = (next: AuthMode) => (event: MouseEvent) => {
    if (!isPlainClick(event)) return;
    event.preventDefault();
    onModeChange(next);
  };

  return (
    <div className="app ck-app ck-login">
      <main className="lg">
        <div className="lg-note">
          <h1 className="ck-plate lg-plate">Work·Cal</h1>
          <p className="lg-lead">Plan your work on a cork board.</p>
          <ul className="lg-points">
            <li>Projects on index cards, with small plans and checklists</li>
            <li>A wall calendar and a timeline</li>
            <li>Your own colours and fonts</li>
          </ul>
          <button type="button" className="btn lg-demo" onClick={onDemo}>
            Try the demo
          </button>
          <p className="lg-small">No account needed. Sample projects, kept only in this browser.</p>
        </div>

        <section className="lg-card" aria-labelledby={`${ids}-title`}>
          <nav className="ck-tabs lg-tabs" aria-label="Account">
            {ACCOUNT_PAGES.map(({ id, label }) => (
              <a key={id} className="ck-tab" href={pagePath(id, BASE)} aria-current={mode === id ? "page" : undefined} onClick={changePage(id)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="lg-paper">
            <h2 id={`${ids}-title`}>{signingUp ? "A new account" : "Welcome back"}</h2>
            {preview && (
              <p className="lg-preview">
                <strong>Preview:</strong> accounts aren't connected yet. Any email and password gets in, and the password isn't
                checked or saved. Please don't type a real one.
              </p>
            )}
            <form ref={formRef} noValidate onSubmit={submit}>
              {field("email", "Email", email, setEmail, "email", "email")}
              {field(
                "password",
                "Password",
                password,
                setPassword,
                showing ? "text" : "password",
                signingUp ? "new-password" : "current-password",
                signingUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined,
              )}
              {signingUp && field("repeat", "Password again", repeat, setRepeat, showing ? "text" : "password", "new-password")}
              <label className="check lg-show">
                <input type="checkbox" checked={showing} onChange={(e) => setShowing(e.target.checked)} />
                Show password
              </label>
              {problem && (
                <p className="field-error" role="alert">
                  {problem}
                </p>
              )}
              <button type="submit" className="btn btn-primary lg-submit" disabled={busy}>
                {busy ? "One moment…" : signingUp ? "Create account" : "Log in"}
              </button>
            </form>
            <button type="button" className="link-button lg-demo-small" onClick={onDemo}>
              Just looking? Try the demo
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
