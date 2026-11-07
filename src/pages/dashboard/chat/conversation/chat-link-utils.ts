import { parseMementoLink } from "./memento-links";

export function sameUrl(a: string, b: string) {
  const trim = (value: string) => value.trim().replace(/\/+$/, "").toLowerCase();
  return trim(a) === trim(b);
}

export function shortUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return parsed.pathname.length > 1 ? `${host}${parsed.pathname.replace(/\/+$/, "")}` : host;
  } catch {
    return url;
  }
}

// Bare URLs only: skips markdown links `[x](url)`, `<url>` and code spans.
const BARE_URL = /(?<![(<[`])https?:\/\/[^\s<>)\]}`]+/gi;

/**
 * Pulls pasted URLs out of message text so they can be shown as cards above
 * the bubble, like other media. Memento links stay inline as chips.
 */
export function pullSharedLinks(text: string): { body: string; urls: string[] } {
  const urls: string[] = [];
  const body = text.replace(BARE_URL, (match) => {
    const url = match.replace(/[.,!?;:]+$/, "");
    if (parseMementoLink(url)) return match;
    if (!urls.some((seen) => sameUrl(seen, url))) urls.push(url);
    return match.slice(url.length);
  });
  if (!urls.length) return { body: text, urls };
  return {
    body: body
      .replace(/[ \t]{2,}/g, " ")
      .replace(/[ \t]+([.,!?;:])/g, "$1")
      .replace(/^[ \t]+|[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    urls,
  };
}
