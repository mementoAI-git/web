import { getPersonalProfile, getRecentPersonalMemories } from "./memories.ts";

/** Reads account facts and recent memories with independent failure handling.
 * @param token - The authenticated caller’s server-only account token.
 * @returns Available context, with explicit indicators for incomplete reads.
 */
export async function getPersonalContext(token: string) {
  const [profile, memories] = await Promise.allSettled([
    getPersonalProfile(token),
    getRecentPersonalMemories(token),
  ]);
  return {
    mode: "memento",
    profile: profile.status === "fulfilled" ? profile.value : null,
    memories: memories.status === "fulfilled" ? memories.value : [],
    profileAvailable: profile.status === "fulfilled",
    memoryOverviewAvailable: memories.status === "fulfilled",
    note: "Selected profile facts and a snapshot of at most five recent memories, not a complete account history. Missing or failed reads are unknown, not evidence of no personal information. Search memories for specific questions. Never infer identity facts from silence or reveal credentials.",
  };
}
