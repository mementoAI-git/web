import { CALL_ACTION_TOOLS, resolveWebDestination, type VoiceScreenDestination } from "./call-actions";
import { isDeadline, SEARCH_MEMORIES_TOOL, withDeadline, type VoiceToolHandler, type VoiceToolInvocation } from "./relay";

/**
 * Tools Memento runs on the server (save, rename, tag, capsules, profile,
 * undo, …). The token lists them; each call goes to POST
 * /ai/voice/tools/:name, which returns the text Gemini hears and effects for
 * the page to apply. Mirrors mobile's voice-server-tools.ts.
 */

/** Longest Memento waits on a server action before saying it may still go through. */
export const VOICE_SERVER_TOOL_TIMEOUT_MS = 8_000;

export const SERVER_TOOL_UNAVAILABLE =
  "That did not go through. Tell the host it did not work and that they can try again or do it in the app.";

/** A timeout does not mean the server did nothing, so the model must not retry. */
export const SERVER_TOOL_UNCERTAIN =
  "That is taking longer than usual and may still go through. Do not call it again. Tell the host it might take a moment and that they can check in the app.";

const SCREEN_TOOLS = ["scroll", "go_back", "press_button", "look_at_screen", "type_text"];
// Time capsules are hidden on web for now, so voice can't start one either.
const HIDDEN_TOOLS = ["draft_capsule", "schedule_capsule"];
const NOT_SERVER = new Set([SEARCH_MEMORIES_TOOL, ...CALL_ACTION_TOOLS, ...SCREEN_TOOLS, ...HIDDEN_TOOLS]);

/** The server-run tools out of the token's `tools` list. */
export function serverToolNames(tools: unknown): string[] {
  if (!Array.isArray(tools)) return [];
  return tools.filter((name): name is string => typeof name === "string" && !NOT_SERVER.has(name));
}

const REFRESHABLE = ["profile", "memories", "capsules", "beneficiaries", "observations"] as const;
export type VoiceRefreshable = (typeof REFRESHABLE)[number];

export type VoiceToolEffect =
  | { type: "refresh"; what: VoiceRefreshable }
  | { type: "open"; destination: VoiceScreenDestination }
  | { type: "open_story"; id: string };

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export function parseVoiceToolEffects(raw: unknown): VoiceToolEffect[] {
  if (!Array.isArray(raw)) return [];
  const effects: VoiceToolEffect[] = [];
  for (const item of raw) {
    const effect = item as Record<string, unknown> | null;
    if (!effect || typeof effect !== "object") continue;
    if (effect.type === "refresh" && REFRESHABLE.includes(effect.what as VoiceRefreshable)) {
      effects.push({ type: "refresh", what: effect.what as VoiceRefreshable });
    } else if (effect.type === "open" && resolveWebDestination(effect.destination)) {
      effects.push({ type: "open", destination: effect.destination as VoiceScreenDestination });
    } else if (effect.type === "open_story" && typeof effect.id === "string" && OBJECT_ID.test(effect.id)) {
      effects.push({ type: "open_story", id: effect.id });
    }
  }
  return effects;
}

const navigates = (effect: VoiceToolEffect) => effect.type === "open" || effect.type === "open_story";

export function createServerToolHandlers(
  names: readonly string[],
  deps: {
    run: (name: string, args: Record<string, unknown>, invocation: VoiceToolInvocation) => Promise<unknown>;
    applyEffects: (effects: VoiceToolEffect[]) => void;
    timeoutMs?: number;
  },
): Record<string, VoiceToolHandler> {
  const handlers: Record<string, VoiceToolHandler> = {};
  for (const name of names) {
    handlers[name] = async (args, invocation = { isLive: () => true }) => {
      try {
        const response = (await withDeadline(
          deps.run(name, args, invocation),
          deps.timeoutMs ?? VOICE_SERVER_TOOL_TIMEOUT_MS,
          "Voice tool timed out.",
        )) as { data?: { result?: unknown; effects?: unknown } } | undefined;
        const result = response?.data?.result;
        if (typeof result !== "string" || !result.trim()) return SERVER_TOOL_UNAVAILABLE;
        // The change happened either way, so data refreshes; but a call that
        // ended (or a newer one) must not move the host somewhere.
        const effects = parseVoiceToolEffects(response?.data?.effects);
        deps.applyEffects(invocation.isLive() ? effects : effects.filter(effect => !navigates(effect)));
        return result;
      } catch (error) {
        return isDeadline(error) ? SERVER_TOOL_UNCERTAIN : SERVER_TOOL_UNAVAILABLE;
      }
    };
  }
  return handlers;
}
