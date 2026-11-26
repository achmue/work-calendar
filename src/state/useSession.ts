import { useCallback, useEffect, useState } from "react";
import { accounts, type AccountService, type AuthResult } from "../auth/accounts";
import { STORAGE_KEYS, clearDemoProjects, loadSession, saveSession } from "../storage/storage";
import type { Session } from "../types";

const TRY_AGAIN = "Something went wrong. Please try again.";

/**
 * Who is using the app: signed in with an account, trying the demo, or nobody. It's remembered, so
 * a reload keeps you in until you log out.
 */
export function useSession(service: AccountService = accounts) {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  useEffect(() => {
    saveSession(session);
  }, [session]);

  // Logging out (or in) in another tab applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.session) setSession(loadSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Sign in with the answer from the service. Gives back what went wrong, or null. */
  const signIn = useCallback(async (asking: Promise<AuthResult>): Promise<string | null> => {
    try {
      const result = await asking;
      if (!result.ok) return result.message;
      setSession({ kind: "account", email: result.email });
      return null;
    } catch {
      return TRY_AGAIN;
    }
  }, []);

  const logIn = useCallback((email: string, password: string) => signIn(service.logIn(email, password)), [service, signIn]);
  const createAccount = useCallback((email: string, password: string) => signIn(service.createAccount(email, password)), [service, signIn]);

  /** The demo always starts fresh, with the sample projects. */
  const startDemo = useCallback(() => {
    clearDemoProjects();
    setSession({ kind: "demo" });
  }, []);

  const logOut = useCallback(() => {
    if (session?.kind === "demo") clearDemoProjects();
    else void service.logOut().catch(() => {});
    setSession(null);
  }, [service, session]);

  return { session, preview: service.preview, logIn, createAccount, startDemo, logOut };
}
