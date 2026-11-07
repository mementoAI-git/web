import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * A shared story's page (/post/:id) with its own link preview: the app's
 * index.html, with the story's title, excerpt and cover in the Open Graph and
 * Twitter tags, so chat apps and social sites show the story rather than the
 * Memento logo. The app then loads as usual. Only stories visible to everyone
 * are public, and the API enforces that; anything else gets the plain page.
 */

const idPattern = /^[0-9a-f]{24}$/i;
/** Hosts this deployment answers on; the base page is fetched from the same one. */
const hostPattern = /^(?:[a-z0-9-]+\.)*(?:mymemento\.io|vercel\.app)$|^localhost(?::\d+)?$/i;
const DESCRIPTION_LENGTH = 180;

type PostRequest = IncomingMessage & { query?: { id?: string | string[] } };

type PublicStory = {
  title?: string;
  body?: string;
  attachments?: { url?: string; thumbnail?: string | null; type?: string }[];
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function storyExcerpt(body = "", max = DESCRIPTION_LENGTH): string {
  const text = body
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** The page's preview tags, swapped for the story's. */
export function withStoryPreview(html: string, story: PublicStory, pageUrl: string, origin: string): string {
  const title = `${story.title?.trim() || "A story"} · Memento`;
  const description = storyExcerpt(story.body) || "A story shared on Memento.";
  const cover = story.attachments?.find((file) => file.thumbnail || file.type?.startsWith("image"));
  const image = cover?.thumbnail || cover?.url || `${origin}/android-chrome-512x512.png`;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Memento" />`,
    `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="${cover ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ].join("\n  ");
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+(?:property="og:[^"]*"|name="(?:twitter:[^"]*|description)")[\s\S]*?\/?>/gi, "")
    .replace(/<\/head>/i, `  ${tags}\n</head>`);
}

export default async function handler(req: PostRequest, res: ServerResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    return res.end("Method not allowed");
  }
  const host = String(req.headers.host || "");
  if (!hostPattern.test(host)) {
    res.statusCode = 400;
    return res.end("Unknown host");
  }
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  let html: string;
  try {
    const page = await fetch(`${origin}/index.html`, { signal: AbortSignal.timeout(5000), redirect: "error" });
    if (!page.ok) throw new Error(String(page.status));
    html = await page.text();
  } catch {
    res.statusCode = 503;
    return res.end("This page is temporarily unavailable");
  }

  const id = req.query?.id;
  const base = process.env.VITE_API_BASE_URL;
  if (typeof id === "string" && idPattern.test(id) && base) {
    try {
      const response = await fetch(`${base.replace(/\/$/, "")}/memories/public/${id}`, {
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      const story = response.ok ? ((await response.json()) as { data?: PublicStory }).data : undefined;
      if (story) html = withStoryPreview(html, story, `${origin}/post/${id}`, origin);
    } catch {
      // The plain page still opens the story; only the preview is generic.
    }
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.statusCode = 200;
  return res.end(req.method === "HEAD" ? undefined : html);
}
