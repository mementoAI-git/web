import { describe, expect, it, vi } from "vitest";
import {
  createServerToolHandlers,
  parseVoiceToolEffects,
  SERVER_TOOL_UNAVAILABLE,
  SERVER_TOOL_UNCERTAIN,
  serverToolNames,
} from "./server-tools";

const live = { callId: "call-1", isLive: () => true };

describe("serverToolNames", () => {
  it("leaves out the hidden time capsule tools, so a call can't start one", () => {
    expect(serverToolNames(["save_story", "draft_capsule", "schedule_capsule"])).toEqual(["save_story"]);
  });

  it("keeps only the tools the server runs, out of the token's tool list", () => {
    expect(serverToolNames(["search_memories", "end_call", "set_microphone", "open_screen", "rename_story", "undo_last_action", "scroll"]))
      .toEqual(["rename_story", "undo_last_action"]);
    expect(serverToolNames(undefined)).toEqual([]);
  });
});

describe("parseVoiceToolEffects", () => {
  it("keeps the open-one-insight effect", () => {
    expect(parseVoiceToolEffects([{ type: "open", destination: "insights" }, { type: "open_insight", id: "64b7f0c2a1b2c3d4e5f60aaa" }, { type: "open_insight", id: "../x" }])).toEqual([
      { type: "open", destination: "insights" },
      { type: "open_insight", id: "64b7f0c2a1b2c3d4e5f60aaa" },
    ]);
  });

  it("keeps only effects this build understands", () => {
    expect(parseVoiceToolEffects([
      { type: "refresh", what: "memories" },
      { type: "refresh", what: "bank_account" },
      { type: "open", destination: "stories" },
      { type: "open", destination: "nowhere" },
      { type: "open_story", id: "64b7f0c2a1b2c3d4e5f60718" },
      { type: "open_story", id: "../../admin" },
      { type: "teleport" },
      null,
    ])).toEqual([
      { type: "refresh", what: "memories" },
      { type: "open", destination: "stories" },
      { type: "open_story", id: "64b7f0c2a1b2c3d4e5f60718" },
    ]);
    expect(parseVoiceToolEffects("nope")).toEqual([]);
  });
});

describe("createServerToolHandlers", () => {
  it("returns the server's text and applies its effects", async () => {
    const run = vi.fn().mockResolvedValue({ data: { result: "Renamed to Homecoming.", effects: [{ type: "refresh", what: "memories" }] } });
    const applyEffects = vi.fn();
    const handlers = createServerToolHandlers(["rename_story"], { run, applyEffects });

    await expect(handlers.rename_story({ title: "Homecoming" }, live)).resolves.toBe("Renamed to Homecoming.");
    expect(run).toHaveBeenCalledWith("rename_story", { title: "Homecoming" }, live);
    expect(applyEffects).toHaveBeenCalledWith([{ type: "refresh", what: "memories" }]);
  });

  it("refreshes data but never navigates for a call that ended", async () => {
    const run = vi.fn().mockResolvedValue({ data: { result: "Opened.", effects: [{ type: "refresh", what: "profile" }, { type: "open", destination: "profile" }] } });
    const applyEffects = vi.fn();
    await createServerToolHandlers(["update_profile"], { run, applyEffects }).update_profile({}, { isLive: () => false });
    expect(applyEffects).toHaveBeenCalledWith([{ type: "refresh", what: "profile" }]);
  });

  it("says it may still go through when the request times out, so Memento does not retry", async () => {
    const handlers = createServerToolHandlers(["save_story"], { run: () => new Promise(() => {}), applyEffects: vi.fn(), timeoutMs: 10 });
    await expect(handlers.save_story({}, live)).resolves.toBe(SERVER_TOOL_UNCERTAIN);
  });

  it("says plainly that it did not work when the server refuses", async () => {
    const handlers = createServerToolHandlers(["save_story"], { run: vi.fn().mockRejectedValue({ status: 422 }), applyEffects: vi.fn() });
    await expect(handlers.save_story({}, live)).resolves.toBe(SERVER_TOOL_UNAVAILABLE);
  });

  it("treats an empty result as not done", async () => {
    const handlers = createServerToolHandlers(["save_story"], { run: vi.fn().mockResolvedValue({ data: { result: "  " } }), applyEffects: vi.fn() });
    await expect(handlers.save_story({}, live)).resolves.toBe(SERVER_TOOL_UNAVAILABLE);
  });
});
