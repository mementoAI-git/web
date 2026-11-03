import { describe, expect, it, vi } from "vitest";
import { MEMORY_SEARCH_UNAVAILABLE, SEARCH_MEMORIES_TOOL, VoiceToolRelay } from "./relay";

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
};

describe("VoiceToolRelay", () => {
  it("answers a slow and a fast call independently, so the fast one is not held back", async () => {
    const slow = deferred<string>();
    const send = vi.fn();
    const relay = new VoiceToolRelay(vi.fn(), send, {
      slow_tool: () => slow.promise,
      fast_tool: () => "done fast",
    });

    const handled = relay.handle([
      { id: "a", name: "slow_tool", args: {} },
      { id: "b", name: "fast_tool", args: {} },
    ]);
    await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    expect(send).toHaveBeenLastCalledWith([{ id: "b", name: "fast_tool", response: { result: "done fast" } }]);

    slow.resolve("done slow");
    await handled;
    expect(send).toHaveBeenLastCalledWith([{ id: "a", name: "slow_tool", response: { result: "done slow" } }]);
  });

  it("gives the handler the call id and whether the call still matters", async () => {
    const handler = vi.fn((_args: Record<string, unknown>, invocation?: { callId?: string; isLive: () => boolean }) => {
      expect(invocation?.callId).toBe("x");
      expect(invocation?.isLive()).toBe(true);
      return "ok";
    });
    await new VoiceToolRelay(vi.fn(), vi.fn(), { tool: handler }).handle([{ id: "x", name: "tool", args: {} }]);
    expect(handler).toHaveBeenCalled();
  });

  it("sends nothing once the call ended", async () => {
    const gate = deferred<string>();
    const send = vi.fn();
    const relay = new VoiceToolRelay(vi.fn(), send, { tool: () => gate.promise });
    const handled = relay.handle([{ id: "a", name: "tool", args: {} }]);
    relay.dispose();
    gate.resolve("late");
    await handled;
    expect(send).not.toHaveBeenCalled();
  });

  it("sends nothing for a call Gemini cancelled, and tells the handler", async () => {
    const gate = deferred<string>();
    let live: (() => boolean) | undefined;
    const send = vi.fn();
    const relay = new VoiceToolRelay(vi.fn(), send, {
      tool: (_args, invocation) => { live = invocation?.isLive; return gate.promise; },
    });
    const handled = relay.handle([{ id: "a", name: "tool", args: {} }]);
    relay.cancel(["a"]);
    expect(live?.()).toBe(false);
    gate.resolve("late");
    await handled;
    expect(send).not.toHaveBeenCalled();
  });

  it("answers a failing handler with a plain failure, not silence", async () => {
    const send = vi.fn();
    await new VoiceToolRelay(vi.fn(), send, { tool: () => { throw new Error("boom"); } })
      .handle([{ id: "a", name: "tool", args: {} }]);
    expect(send.mock.calls[0][0][0].response.result).toMatch(/did not work/);
  });

  it("answers an unknown tool instead of leaving Gemini waiting", async () => {
    const send = vi.fn();
    await new VoiceToolRelay(vi.fn(), send).handle([{ id: "a", name: "nope", args: {} }]);
    expect(send.mock.calls[0][0][0].response.result).toBe("Unknown tool nope.");
  });

  it("searches memories with a trimmed query and returns the result", async () => {
    const search = vi.fn().mockResolvedValue("Emeka is your brother.");
    const send = vi.fn();
    await new VoiceToolRelay(search, send).handle([
      { id: "a", name: SEARCH_MEMORIES_TOOL, args: { query: "  my brother  ", also: ["Emeka", 4] } },
    ]);
    expect(search).toHaveBeenCalledWith("my brother", ["Emeka"]);
    expect(send.mock.calls[0][0][0].response.result).toBe("Emeka is your brother.");
  });

  it("carries on without memory search when it fails or takes too long", async () => {
    const send = vi.fn();
    const relay = new VoiceToolRelay(() => new Promise(() => {}), send, {}, { searchTimeoutMs: 10 });
    await relay.handle([{ id: "a", name: SEARCH_MEMORIES_TOOL, args: { query: "farm" } }]);
    expect(send.mock.calls[0][0][0].response.result).toBe(MEMORY_SEARCH_UNAVAILABLE);
  });
});
