import assert from "node:assert/strict";
import { test } from "node:test";

import type { EveMessagePart } from "eve/react";

import { hasVisibleMessageContent } from "../apps/web/app/message-display.ts";

void test("reasoning-only streaming messages keep the working indicator without a blank bubble", () => {
  const parts: EveMessagePart[] = [
    { type: "step-start" },
    { type: "reasoning", text: "Private model reasoning", state: "streaming" },
    { type: "text", text: "", state: "streaming" },
  ];
  assert.equal(hasVisibleMessageContent(parts), false);
});

void test("completed reasoning stays hidden and actual answer text becomes visible", () => {
  const reasoning: EveMessagePart = {
    type: "reasoning",
    text: "Private model reasoning",
    state: "done",
  };
  assert.equal(hasVisibleMessageContent([reasoning]), false);
  assert.equal(
    hasVisibleMessageContent([
      reasoning,
      { type: "text", text: "Your answer", state: "streaming" },
    ]),
    true
  );
  assert.equal(hasVisibleMessageContent([]), false);
});
