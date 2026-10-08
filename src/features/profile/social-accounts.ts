export const SOCIAL_PLATFORMS = [
  "bluesky",
  "x",
  "youtube",
  "linkedin",
  "facebook",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export interface SocialAccount {
  url: string;
  source: "user" | "ai";
  confirmed_at: string;
  evidence?: string;
  source_id?: string;
}
export type SocialAccounts = Partial<
  Record<SocialPlatform, SocialAccount | null>
>;

/** Only profile URLs, never redirects, posts, lookalike domains or executable schemes. */
export function normalizeSocialProfileUrl(
  platform: SocialPlatform,
  value: unknown,
): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      /%|\\/.test(value)
    )
      return null;
    const host = url.hostname.replace(/^(www|m|web)\./, "");
    const path = url.pathname.replace(/\/$/, "");
    switch (platform) {
      case "bluesky":
        return host === "bsky.app" &&
          /^\/profile\/(?:[a-z0-9][a-z0-9.-]*\.[a-z]{2,}|did:plc:[a-z0-9]+)$/i.test(
            path,
          )
          ? `https://bsky.app${path}`
          : null;
      case "x":
        return ["x.com", "twitter.com"].includes(host) &&
          /^\/[a-z0-9_]{1,15}$/i.test(path) &&
          !/^\/(home|search|explore|settings|notifications|messages|intent|i|compose|login|logout)$/i.test(
            path,
          )
          ? `https://x.com${path}`
          : null;
      case "youtube":
        return host === "youtube.com" &&
          /^\/(?:@[a-z0-9_.-]+|channel\/UC[a-z0-9_-]+|(?:c|user)\/[a-z0-9_.-]+)$/i.test(
            path,
          )
          ? `https://www.youtube.com${path}`
          : null;
      case "linkedin":
        return host === "linkedin.com" && /^\/in\/[a-z0-9_-]+$/i.test(path)
          ? `https://www.linkedin.com${path}`
          : null;
      case "facebook":
        if (host !== "facebook.com") return null;
        if (
          path === "/profile.php" &&
          /^\d+$/.test(url.searchParams.get("id") || "")
        )
          return `https://www.facebook.com/profile.php?id=${url.searchParams.get("id")}`;
        return /^\/[a-z0-9.]+$/i.test(path) &&
          !/^\/(groups|events|marketplace|watch|reel|stories|photo|photos|permalink|sharer|login|share|help|gaming|pages|profile\.php|l\.php|sharer\.php|share\.php|photo\.php|story\.php|permalink\.php|login\.php|dialog)$/i.test(
            path,
          )
          ? `https://www.facebook.com${path}`
          : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}
