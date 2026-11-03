/** What the host would call the page they are on, for voice results ("Now on a story."). */
const SETTINGS_TABS: Record<string, string> = {
  general: "Settings: Personal info",
  security: "Settings: Security",
  beneficiary: "Settings: Beneficiaries",
  privacy: "Settings: Privacy",
  billing: "Settings: Billing",
};

export function webScreenName(pathname: string, search: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/overview") return "Home";
  if (path === "/stories") return "Stories";
  if (path.startsWith("/stories/")) return "a story";
  if (path === "/chat" || path === "/chat/new") return "Chat";
  if (path.startsWith("/chat/")) return "a conversation";
  if (path === "/explore" || path === "/explore/categories") return "Explore prompts";
  if (path.startsWith("/explore/categories/")) return "an Explore category";
  if (path === "/pricing") return "Plans";
  if (path === "/people") return "People";
  const settings = path.match(/^\/settings\/([^/]+)/);
  if (settings) {
    if (settings[1] === "general" && new URLSearchParams(search).get("view") === "about") return "Insights";
    return SETTINGS_TABS[settings[1]] ?? "Settings";
  }
  return "a page in Memento";
}
