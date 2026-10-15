import assert from "node:assert/strict";
import { test } from "node:test";

import { isTerminalSession } from "../apps/web/app/chat-retry.ts";

void test("terminal session failures and completion require a fresh retry session", () => {
  assert.equal(isTerminalSession([{ type: "session.failed" }]), true);
  assert.equal(isTerminalSession([{ type: "session.completed" }]), true);
});

void test("recoverable turn and transport failures preserve the session", () => {
  assert.equal(isTerminalSession([{ type: "turn.failed" }]), false);
  assert.equal(isTerminalSession([{ type: "step.failed" }]), false);
  assert.equal(isTerminalSession([{ type: "session.waiting" }]), false);
  assert.equal(isTerminalSession([]), false);
});
