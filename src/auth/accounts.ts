// Signing in. The screens only know the AccountService interface, so the stand-in below can be
// swapped for a real service (planned: Supabase) without changing them.

import { normalizeEmail } from "../lib/authForm";

export type AuthResult = { ok: true; email: string } | { ok: false; message: string };

export interface AccountService {
  /** True while this is only a stand-in: nothing is checked, and the screens say so. */
  preview: boolean;
  logIn(email: string, password: string): Promise<AuthResult>;
  createAccount(email: string, password: string): Promise<AuthResult>;
  logOut(): Promise<void>;
}

/**
 * The stand-in used until there's a back end. It lets any email in. It never looks at the
 * password, stores it or sends it anywhere: it must not look safer than it is.
 */
export const previewAccounts: AccountService = {
  preview: true,
  logIn: async (email) => ({ ok: true, email: normalizeEmail(email) }),
  createAccount: async (email) => ({ ok: true, email: normalizeEmail(email) }),
  logOut: async () => {},
};

/** The service the app uses. Connecting a back end means changing this line. */
export const accounts: AccountService = previewAccounts;
