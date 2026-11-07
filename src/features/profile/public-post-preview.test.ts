import { afterEach, describe, expect, it, vi } from "vitest";
import type { ServerResponse } from "node:http";
import handler, { storyExcerpt, withStoryPreview } from "../../../api/post/[id]";

const ID = "64b7f0c2a1b2c3d4e5f60711";
const PAGE = `<html><head>
  <title>Memento - Your Personal AI Companion</title>
  <meta name="description"
    content="Generic" />
  <meta property="og:title" content="Memento" />
  <meta property="og:image" content="https://mymemento.io/android-chrome-512x512.png" />
  <meta name="twitter:card" content="summary_large_image" />
</head><body><div id="root"></div></body></html>`;

function response() {
  const headers = new Map<string, string>();
  const res = { statusCode: 200, setHeader: (name: string, value: string) => headers.set(name, value), end: vi.fn() };
  return { headers, res, value: res as unknown as ServerResponse };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("shared story link preview", () => {
  it("swaps the generic preview for the story's title, excerpt and cover", () => {
    const html = withStoryPreview(
      PAGE,
      { title: 'Lagos "at night"', body: "<p>We landed &amp; slept.</p>", attachments: [{ type: "image/jpeg", url: "https://cdn.example.com/a.jpg" }] },
      `https://mymemento.io/post/${ID}`,
      "https://mymemento.io",
    );
    expect(html).toContain("<title>Lagos &quot;at night&quot; · Memento</title>");
    expect(html).toContain('<meta property="og:description" content="We landed &amp; slept." />');
    expect(html).toContain('<meta property="og:image" content="https://cdn.example.com/a.jpg" />');
    expect(html).not.toContain("Generic");
    expect(html.match(/og:title/g)).toHaveLength(1);
    expect(html).toContain('<div id="root"></div>');
  });

  it("keeps a small card and the Memento image when the story has no picture", () => {
    const html = withStoryPreview(PAGE, { title: "Notes", body: "" }, "u", "https://mymemento.io");
    expect(html).toContain('content="summary"');
    expect(html).toContain("https://mymemento.io/android-chrome-512x512.png");
    expect(html).toContain("A story shared on Memento.");
  });

  it("shortens long stories", () => {
    expect(storyExcerpt("word ".repeat(100)).length).toBeLessThanOrEqual(180);
  });

  it("serves the app page with the public story's preview", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.memento.example/");
    const fetch = vi.fn(async (url: string) =>
      url.endsWith("/index.html")
        ? new Response(PAGE)
        : new Response(JSON.stringify({ data: { title: "Lagos", body: "Hi", attachments: [] } }), { headers: { "content-type": "application/json" } }),
    );
    vi.stubGlobal("fetch", fetch);
    const { res, value, headers } = response();
    await handler({ method: "GET", headers: { host: "mymemento.io" }, query: { id: ID } } as never, value);
    expect(fetch).toHaveBeenCalledWith(`https://api.memento.example/memories/public/${ID}`, expect.anything());
    expect(res.statusCode).toBe(200);
    expect(headers.get("Content-Type")).toContain("text/html");
    expect(res.end.mock.calls[0][0]).toContain("<title>Lagos · Memento</title>");
  });

  it("serves the plain page for a story that is not public", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.memento.example");
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url.endsWith("/index.html") ? new Response(PAGE) : new Response("", { status: 404 }))));
    const { res, value } = response();
    await handler({ method: "GET", headers: { host: "mymemento.io" }, query: { id: ID } } as never, value);
    expect(res.statusCode).toBe(200);
    expect(res.end.mock.calls[0][0]).toContain("Generic");
  });

  it("only fetches its page from Memento's own hosts", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { res, value } = response();
    await handler({ method: "GET", headers: { host: "evil.example" }, query: { id: ID } } as never, value);
    expect(res.statusCode).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
