import { mutate } from "swr";
import { toast } from "sonner";
import endpoint from "@/api/endpoint";
import { postFetcher } from "@/api/fetcher";
import { htmlFromQuickCaptureNote } from "@/lib/quick-capture-drafts";
import {
  clearWebsiteReflection,
  getWebsiteReflection,
  recordWebsiteReflectionAttempt,
  reflectionDayKey,
} from "./handoff";

const MAX_ATTEMPTS = 3;
let syncing = false;

/** Saves a reply written on the marketing site as a private reflection, once, for the signed-in user. */
export async function syncWebsiteReflection(save = postFetcher) {
  const draft = getWebsiteReflection();
  if (!draft || syncing) return false;
  if (draft.attempts >= MAX_ATTEMPTS) {
    clearWebsiteReflection();
    return false;
  }
  syncing = true;
  recordWebsiteReflectionAttempt();
  try {
    const result = (await save(endpoint.memoriesQuickCapture, {
      arg: {
        body: htmlFromQuickCaptureNote(draft.answer),
        prompt_type: "ai-generated",
        prompt_text: draft.question,
        reflection_day_key: reflectionDayKey(draft.capturedAt),
      },
    })) as { success?: boolean } | undefined;
    if (!result?.success) return false;
    clearWebsiteReflection();
    toast.success("Your reflection from the website is saved.");
    void mutate((key) => typeof key === "string" && key.startsWith(endpoint.stories)).catch(() => undefined);
    void mutate((key) => typeof key === "string" && key.split("?")[0] === endpoint.prompts).catch(() => undefined);
    void mutate(endpoint.userStats).catch(() => undefined);
    return true;
  } catch {
    // Kept for the next visit (up to MAX_ATTEMPTS), in case it was a network or session hiccup.
    return false;
  } finally {
    syncing = false;
  }
}
