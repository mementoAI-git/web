import { mutate } from "swr";
import endpoint from "@/api/endpoint";

/** Cached screens to refresh after a chat action, by what it changed. */
const REFRESH_PREFIXES: Record<string, string[]> = {
  profile: [endpoint.profile, endpoint.userStats],
  memories: [endpoint.memories],
  capsules: [endpoint.capsule],
  beneficiaries: [endpoint.beneficiaries],
  observations: [endpoint.personaObservations],
};

export function refreshAfterChatAction(effects: unknown) {
  if (!Array.isArray(effects)) return;
  for (const effect of effects) {
    const prefixes =
      effect && typeof effect === "object" && (effect as { type?: string }).type === "refresh"
        ? REFRESH_PREFIXES[String((effect as { what?: string }).what)]
        : undefined;
    if (prefixes) void mutate((key) => typeof key === "string" && prefixes.some((prefix) => key.startsWith(prefix)));
  }
}
