import assert from "node:assert/strict";
import { test } from "node:test";

import type { ConversationState, UseEveAgentHelpers } from "eve/react";

import { getChatMetrics } from "../apps/web/app/chat-metrics.ts";

type StreamEvent = UseEveAgentHelpers<ConversationState>["events"][number];
const meta = (id: string, at: string) => ({ id, at });
const start: StreamEvent = {
  type: "turn.started",
  data: { turnId: "turn_0", sequence: 0 },
  meta: meta("start", "2026-10-14T12:00:00.000Z"),
};
const completed: StreamEvent = {
  type: "turn.completed",
  data: { turnId: "turn_0", sequence: 0 },
  meta: meta("done", "2026-10-14T12:00:02.750Z"),
};
const step: StreamEvent = {
  type: "step.completed",
  data: {
    turnId: "turn_0",
    sequence: 0,
    stepIndex: 0,
    finishReason: "stop",
    usage: { inputTokens: 100, outputTokens: 20, costUsd: 0.003 },
  },
  meta: meta("step", "2026-10-14T12:00:02Z"),
};

void test("reports exact server elapsed time, real model identity, and step usage", () => {
  const events: StreamEvent[] = [
    start,
    {
      type: "step.started",
      data: {
        turnId: "turn_0",
        sequence: 0,
        stepIndex: 0,
        modelId: "reported/model",
      },
      meta: meta("model", "2026-10-14T12:00:00Z"),
    },
    step,
    completed,
  ];
  assert.deepEqual(getChatMetrics(events), {
    lastResponseMs: 2750,
    model: "reported/model",
    usage: { inputTokens: 100, outputTokens: 20, costUsd: 0.003 },
  });
});

void test("session snapshots replace step totals and later steps add only their new usage", () => {
  const events: StreamEvent[] = [
    step,
    {
      type: "session.waiting",
      data: {
        continuationToken: "private",
        wait: "next-user-message",
        usage: {
          inputTokens: 300,
          outputTokens: 40,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
          costUsd: 0.01,
        },
      },
      meta: meta("waiting", "2026-10-14T12:00:03Z"),
    },
    { ...step, meta: meta("next-step", "2026-10-14T12:01:03Z") },
  ];
  assert.deepEqual(getChatMetrics(events).usage, {
    inputTokens: 400,
    outputTokens: 60,
    costUsd: 0.01 + 0.003,
  });
});

void test("absent usage, pending turns, and unmatched or invalid timestamps stay unavailable", () => {
  assert.deepEqual(getChatMetrics([start]), {
    lastResponseMs: null,
    model: "deepseek-flash",
    usage: null,
  });
  assert.equal(getChatMetrics([completed]).lastResponseMs, null);
  assert.equal(
    getChatMetrics([
      { ...start, meta: meta("bad-start", "invalid") },
      completed,
    ]).lastResponseMs,
    null
  );
  assert.equal(getChatMetrics([completed, start]).lastResponseMs, null);
  assert.equal(
    getChatMetrics([
      start,
      completed,
      {
        ...start,
        data: { turnId: "turn_1", sequence: 1 },
        meta: meta("new-start", "2026-10-14T12:01:00Z"),
      },
    ]).lastResponseMs,
    2750
  );
  assert.equal(
    getChatMetrics([
      { ...step, data: { ...step.data, usage: { inputTokens: 4 } } },
    ]).usage?.costUsd,
    undefined
  );
});

void test("failed and cancelled turns use their matching start and duplicate steps do not inflate usage", () => {
  const failed: StreamEvent = {
    type: "turn.failed",
    data: {
      turnId: "turn_0",
      sequence: 0,
      code: "TEST",
      message: "Unavailable",
    },
    meta: meta("failed", "2026-10-14T12:00:01Z"),
  };
  assert.equal(getChatMetrics([start, failed]).lastResponseMs, 1000);
  const cancelled: StreamEvent = {
    type: "turn.cancelled",
    data: { turnId: "turn_0", sequence: 0 },
    meta: meta("cancelled", "2026-10-14T12:00:04Z"),
  };
  assert.equal(getChatMetrics([start, cancelled]).lastResponseMs, 4000);
  assert.deepEqual(getChatMetrics([step, step]).usage, {
    inputTokens: 100,
    outputTokens: 20,
    costUsd: 0.003,
  });
});
