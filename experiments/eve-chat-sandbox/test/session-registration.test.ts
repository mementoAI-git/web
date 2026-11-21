import assert from "node:assert/strict";
import { test } from "node:test";

import { recordSessionBeforeReply } from "../agent/lib/session-registration.ts";

void test("ownership is written before an accepted session ID reaches the browser", async () => {
  const response = Response.json(
    { ok: true, sessionId: "wrun_sample" },
    { status: 202, headers: { "x-eve-session-id": "wrun_sample" } }
  );
  let owner: string | undefined;
  const result = await recordSessionBeforeReply(
    response,
    "visitor:alice",
    async (id, principal) => {
      assert.equal(id, "wrun_sample");
      owner = principal;
      await Promise.resolve();
    }
  );
  assert.equal(owner, "visitor:alice");
  assert.equal(result, response);
});

void test("message-free creation records ownership without waiting for session.started", async () => {
  let saved = false;
  await recordSessionBeforeReply(
    Response.json(
      {},
      { status: 202, headers: { "x-eve-session-id": "wrun_empty" } }
    ),
    "visitor:alice",
    async () => {
      saved = true;
      await Promise.resolve();
    }
  );
  assert.equal(saved, true);
});

void test("failed dispatches do not create ownership and missing IDs fail closed", async () => {
  const response = Response.json({ error: "failed" }, { status: 500 });
  assert.equal(
    await recordSessionBeforeReply(response, "visitor:alice", async () => {
      throw new Error("must not run");
    }),
    response
  );
  await assert.rejects(
    recordSessionBeforeReply(
      Response.json({}, { status: 202 }),
      "visitor:alice",
      async () => {
        await Promise.resolve();
      }
    ),
    /session ID/u
  );
  await assert.rejects(
    recordSessionBeforeReply(
      Response.json(
        {},
        { status: 202, headers: { "x-eve-session-id": "wrun_sample" } }
      ),
      "visitor:alice",
      async () => {
        throw new Error("disk failure");
      }
    ),
    /disk failure/u
  );
});
