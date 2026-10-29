/**
 * Phase 5 (audit P0-5): the API client must never blind-retry a write.
 * One click on Apply used to send three POSTs. Run with: npm test
 */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { apiGet, apiPatch, apiPost } from "../api";

const realFetch = globalThis.fetch;
const realError = console.error;

// Every attempt fails at the network layer, so any retry shows up as an extra call.
const countingFailingFetch = () => {
  const calls: string[] = [];
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(String(init?.method || "GET"));
    throw new TypeError("network down");
  }) as typeof fetch;
  console.error = () => {};
  return calls;
};

afterEach(() => {
  globalThis.fetch = realFetch;
  console.error = realError;
});

describe("api client retry policy", () => {
  it("POST is sent exactly once even when it fails", async () => {
    const calls = countingFailingFetch();
    await assert.rejects(apiPost("/jobs/apply", { jobId: "x" }, { retries: 5 }));
    assert.deepEqual(calls, ["POST"]);
  });

  it("PATCH is sent exactly once even when it fails", async () => {
    const calls = countingFailingFetch();
    await assert.rejects(apiPatch("/users/candidate/me", { summary: "x" }));
    assert.deepEqual(calls, ["PATCH"]);
  });

  it("GET is still retried (safe method)", async () => {
    const calls = countingFailingFetch();
    await assert.rejects(apiGet("/ping", { retries: 1 }));
    assert.deepEqual(calls, ["GET", "GET"]);
  });

  it("a caller-aborted GET is not retried", async () => {
    const calls = countingFailingFetch();
    const controller = new AbortController();
    controller.abort();
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(String(init?.method || "GET"));
      throw new DOMException("aborted", "AbortError");
    }) as typeof fetch;
    await assert.rejects(apiGet("/ping", { retries: 3, signal: controller.signal }));
    assert.deepEqual(calls, ["GET"]);
  });

  it("user-facing failure text never names infrastructure", async () => {
    countingFailingFetch();
    const error = await apiPost("/jobs/apply", { jobId: "x" }).catch((e: Error) => e);
    assert.ok(error instanceof Error);
    assert.doesNotMatch(error.message, /mongo|backend|server and|NEXT_PUBLIC/i);
  });
});
