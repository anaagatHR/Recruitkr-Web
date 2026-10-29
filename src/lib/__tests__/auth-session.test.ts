/**
 * Phase 8 (audit P1-6): the long-lived refresh token is never kept in
 * localStorage; it lives only in the httpOnly cookie. Run with: npm test
 */
import assert from "node:assert/strict";
import { before, beforeEach, describe, it } from "node:test";

const store = new Map<string, string>();
Object.assign(globalThis, {
  window: globalThis,
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
});

type AuthModule = typeof import("../auth");
let getSession: AuthModule["getSession"];
let setSession: AuthModule["setSession"];
let updateSessionTokens: AuthModule["updateSessionTokens"];
const KEY = "recruitkr.auth.session";
const user = { id: "u1", email: "priya@example.com", role: "candidate" as const };

// Imported after the localStorage stub above is installed.
before(async () => {
  ({ getSession, setSession, updateSessionTokens } = await import("../auth"));
});
beforeEach(() => store.clear());

describe("auth session storage", () => {
  it("setSession never writes the refresh token", () => {
    setSession({ accessToken: "a1", refreshToken: "r-secret", user });
    assert.doesNotMatch(store.get(KEY)!, /r-secret|refreshToken/);
    assert.equal(getSession()?.accessToken, "a1");
  });

  it("a legacy stored refresh token is scrubbed on first read", () => {
    store.set(KEY, JSON.stringify({ accessToken: "a1", refreshToken: "r-old", user }));
    const session = getSession();
    assert.equal(session?.refreshToken, undefined);
    assert.doesNotMatch(store.get(KEY)!, /r-old/);
  });

  it("token refresh updates only the access token", () => {
    setSession({ accessToken: "a1", user });
    updateSessionTokens("a2", "r-rotated");
    assert.equal(getSession()?.accessToken, "a2");
    assert.doesNotMatch(store.get(KEY)!, /r-rotated/);
  });
});
