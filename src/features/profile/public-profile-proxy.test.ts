import { afterEach, describe, expect, it, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import handler from "../../../api/profile/[token]";
const token = "f880209e-7c70-4e99-9ddf-ff180f220f21";
function response() {
  const headers = new Map<string, string>();
  const res = {
    statusCode: 200,
    setHeader: (name: string, value: string) => headers.set(name, value),
    end: vi.fn(),
  };
  return { headers, res, value: res as unknown as ServerResponse };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("public profile HTML proxy", () => {
  it("serves initial HTML and crawler metadata without forwarding credentials", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.memento.example");
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          '<html><meta property="og:image" content="https://memento.example/og/profile.png"></html>',
          {
            headers: {
              "content-type": "text/html",
              "content-security-policy": "default-src 'none'",
              "x-robots-tag": "noindex",
            },
          },
        ),
      );
    vi.stubGlobal("fetch", fetch);
    const out = response();
    await handler(
      {
        method: "GET",
        query: { token },
        headers: { authorization: "secret", cookie: "secret" },
      } as unknown as IncomingMessage,
      out.value,
    );
    expect(fetch).toHaveBeenCalledWith(
      `https://api.memento.example/public/profiles/${token}`,
      { signal: expect.any(AbortSignal), redirect: "error" },
    );
    expect(out.headers.get("Content-Type")).toBe("text/html");
    expect(out.headers.get("Cache-Control")).toBe("no-store");
    expect(out.res.end).toHaveBeenCalledWith(
      expect.stringContaining('property="og:image"'),
    );
  });
  it("rejects malformed tokens without contacting the API", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const out = response();
    await handler(
      {
        method: "GET",
        query: { token: "../../users" },
      } as unknown as IncomingMessage,
      out.value,
    );
    expect(out.res.statusCode).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("does not render the app shell for missing profiles or failed API requests", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.memento.example");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 404 })),
    );
    const out = response();
    await handler(
      { method: "GET", query: { token } } as unknown as IncomingMessage,
      out.value,
    );
    expect(out.res.statusCode).toBe(404);
    expect(out.res.end).toHaveBeenCalledWith("Profile not found");
  });
});
