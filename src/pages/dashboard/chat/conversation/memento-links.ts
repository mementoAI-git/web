/**
 * Memento links in chat replies. The API only lets a reply keep links to the
 * host's own stories and conversations it was given, and share links for
 * stories visible to everyone, so these can be shown as cards.
 */

const OBJECT_ID = "[0-9a-fA-F]{24}";
const IN_APP = new RegExp(`^/(stories|chat)/(${OBJECT_ID})/?$`);
const POST = new RegExp(`^/post/(${OBJECT_ID})/?$`);
const SHARE_HOSTS = ["mymemento.io"];

export type MementoLink =
  | { kind: "story" | "conversation"; id: string; to: string }
  | { kind: "share"; id: string; url: string };

function isMementoHost(host: string) {
  const bare = host.replace(/^www\./, "");
  const here = typeof window === "undefined" ? "" : window.location.host.replace(/^www\./, "");
  return bare === here || SHARE_HOSTS.some((name) => bare === name || bare.endsWith(`.${name}`));
}

export function parseMementoLink(href?: string): MementoLink | null {
  if (!href) return null;
  const inApp = href.match(IN_APP);
  if (inApp) {
    return { kind: inApp[1] === "stories" ? "story" : "conversation", id: inApp[2], to: href.replace(/\/$/, "") };
  }
  try {
    const url = new URL(href);
    const post = url.pathname.match(POST);
    if (post && /^https?:$/.test(url.protocol) && isMementoHost(url.host)) return { kind: "share", id: post[1], url: url.href };
  } catch {
    return null;
  }
  return null;
}

/** The stories and conversations a reply links to, in order, once each. */
export function collectReplySources(text = ""): { kind: "story" | "conversation"; id: string; to: string; label: string }[] {
  const seen = new Set<string>();
  const sources: { kind: "story" | "conversation"; id: string; to: string; label: string }[] = [];
  for (const [, label, href] of text.matchAll(/\[([^\]\n]+)\]\(([^)\s]+)\)/g)) {
    const link = parseMementoLink(href);
    if (!link || link.kind === "share" || seen.has(link.id)) continue;
    seen.add(link.id);
    sources.push({ ...link, label: label.trim() });
  }
  return sources;
}
