import assert from "node:assert/strict";
import { test } from "node:test";

import { mayAccessSessionRoute } from "../agent/lib/session-access.ts";

void test("new session and info routes do not accept a caller-supplied session owner", async () => {
  assert.equal(
    await mayAccessSessionRoute(
      new Request("http://localhost/eve/v1/session", { method: "POST" }),
      "visitor:alice",
      async () => false
    ),
    true
  );
  assert.equal(
    await mayAccessSessionRoute(
      new Request("http://localhost/eve/v1/info"),
      "visitor:alice",
      async () => false
    ),
    true
  );
});

void test("every existing session route checks its owner", async () => {
  for (const suffix of [
    "",
    "/stream",
    "/cancel",
    "/compact",
    "/clear",
    "/reset",
  ]) {
    const request = new Request(
      `http://localhost/eve/v1/session/alice-session${suffix}`
    );
    assert.equal(
      await mayAccessSessionRoute(request, "visitor:bob", async () => false),
      false
    );
    assert.equal(
      await mayAccessSessionRoute(
        request,
        "visitor:alice",
        async (session, principal) =>
          session === "alice-session" && principal === "visitor:alice"
      ),
      true
    );
  }
});

void test("unsupported protected routes fail closed", async () => {
  for (const path of [
    "/eve/v1/tasks/task-1",
    "/eve/v1/session/a/other",
    "/eve/v1/session/%2Fstream",
    "/eve/v1/session/a/",
  ]) {
    assert.equal(
      await mayAccessSessionRoute(
        new Request(`http://localhost${path}`),
        "visitor:alice",
        async () => true
      ),
      false
    );
  }
});
