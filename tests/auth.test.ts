import { describe, expect, it, vi } from "vitest";
import { previewAccounts } from "../src/auth/accounts";
import { MIN_PASSWORD_LENGTH, normalizeEmail, validateAuthForm } from "../src/lib/authForm";

const values = (email: string, password: string, repeat = "") => ({ email, password, repeat });

describe("checking the log in form", () => {
  it("accepts a sensible email and any password", () => {
    expect(validateAuthForm(values("a@example.com", "x"), "login")).toEqual({});
    expect(validateAuthForm(values("  A@Example.COM ", "x"), "login")).toEqual({});
  });

  it("asks for both", () => {
    expect(validateAuthForm(values("", ""), "login")).toEqual({ email: "Enter your email address.", password: "Enter your password." });
  });

  it("refuses things that aren't email addresses", () => {
    for (const bad of ["acha", "a@b", "a @example.com", "@example.com", "a@@example.com", `${"a".repeat(260)}@example.com`]) {
      expect(validateAuthForm(values(bad, "x"), "login").email, bad).toBe("That doesn't look like an email address.");
    }
  });
});

describe("checking the create account form", () => {
  it(`wants a password of at least ${MIN_PASSWORD_LENGTH} characters, typed the same twice`, () => {
    expect(validateAuthForm(values("a@example.com", "longenough", "longenough"), "signup")).toEqual({});
    expect(validateAuthForm(values("a@example.com", "short", "short"), "signup")).toEqual({ password: "Use at least 8 characters." });
    expect(validateAuthForm(values("a@example.com", "longenough", "different1"), "signup")).toEqual({ repeat: "The two passwords don't match." });
    expect(validateAuthForm(values("a@example.com", "longenough"), "signup")).toEqual({ repeat: "Type the password again." });
  });
});

describe("the stand-in accounts", () => {
  it("say that they are one", () => {
    expect(previewAccounts.preview).toBe(true);
  });

  it("let an email in, tidied up, and never keep or send the password", async () => {
    const send = vi.fn();
    vi.stubGlobal("fetch", send);
    expect(await previewAccounts.logIn(" A@Example.com ", "secret-words")).toEqual({ ok: true, email: "a@example.com" });
    const created = await previewAccounts.createAccount("b@example.com", "secret-words");
    expect(JSON.stringify(created)).not.toContain("secret-words");
    expect(send).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("tidies an email the same way everywhere", () => {
    expect(normalizeEmail("  Name@Site.ORG ")).toBe("name@site.org");
  });
});
