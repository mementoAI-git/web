const DISMISSED_NUDGES_KEY = "memento_host_chat_dismissed_nudges_v1";

export function getDismissedHostChatNudges(): string[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(DISMISSED_NUDGES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function dismissHostChatNudge(dimensionKey: string): void {
  if (typeof sessionStorage === "undefined") return;
  const cur = getDismissedHostChatNudges();
  if (cur.includes(dimensionKey)) return;
  sessionStorage.setItem(DISMISSED_NUDGES_KEY, JSON.stringify([...cur, dimensionKey]));
}
