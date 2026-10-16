import { streamlineFetcher } from "./fetcher";
afterEach(() => vi.unstubAllGlobals());
it("rejects HTTP failures so the caller can retain the message for retry", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Unavailable" }), { status: 503 })));
  const onChunk = vi.fn();
  await expect(streamlineFetcher("/ai/prompt", { arg: { onChunk } })).rejects.toThrow("Unavailable");
  expect(onChunk).not.toHaveBeenCalled();
});
it("propagates interruption after delivering partial text", async () => {
  let reads = 0;
  const reader = { cancel: vi.fn().mockResolvedValue(undefined), releaseLock: vi.fn(), read: vi.fn(async () => { if (reads++) throw new Error("Disconnected"); return { value: new TextEncoder().encode("Partial reply"), done: false }; }) };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: new Headers(), body: { getReader: () => reader } }));
  const onChunk = vi.fn();
  await expect(streamlineFetcher("/ai/prompt", { arg: { onChunk } })).rejects.toThrow("Disconnected");
  expect(onChunk).toHaveBeenCalledWith("Partial reply");
});
