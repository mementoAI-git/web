import type { VoiceToolHandler } from "./relay";

export const END_CALL_TOOL = "end_call";
export const SET_MICROPHONE_TOOL = "set_microphone";
export const OPEN_SCREEN_TOOL = "open_screen";
export const CALL_ACTION_TOOLS = [END_CALL_TOOL, SET_MICROPHONE_TOOL, OPEN_SCREEN_TOOL];

// Keep in sync with VOICE_SCREEN_DESTINATIONS in
// api/src/module/api/ai/live-session-config.ts.
export const VOICE_SCREEN_DESTINATIONS = [
  "home", "chat", "stories", "new_story", "quick_note", "time_capsules", "explore_prompts",
  "insights", "account", "settings", "profile", "plan_and_billing", "upgrade", "privacy",
  "beneficiaries", "feedback", "activity", "two_factor",
] as const;

export type VoiceScreenDestination = (typeof VOICE_SCREEN_DESTINATIONS)[number];

/** A null href is a screen mobile has but web does not, so Memento says so. */
type WebDestination = { href: string | null; label: string };

export const WEB_VOICE_DESTINATIONS: Record<VoiceScreenDestination, WebDestination> = {
  home: { href: "/overview", label: "home" },
  chat: { href: "/chat", label: "chat" },
  stories: { href: "/stories", label: "your stories" },
  new_story: { href: null, label: "a new story" },
  quick_note: { href: null, label: "a quick note" },
  // Capsules live on the overview on web (/capsule redirects there).
  time_capsules: { href: "/overview", label: "your time capsules on the overview" },
  explore_prompts: { href: "/explore", label: "explore prompts" },
  insights: { href: "/settings/general?view=about", label: "your insights" },
  account: { href: "/settings/general", label: "your account" },
  settings: { href: "/settings/general", label: "settings" },
  profile: { href: "/settings/general", label: "your profile" },
  plan_and_billing: { href: "/settings/billing", label: "plan and billing" },
  upgrade: { href: "/pricing", label: "plans" },
  privacy: { href: "/settings/privacy", label: "privacy settings" },
  beneficiaries: { href: "/settings/beneficiary", label: "beneficiaries" },
  feedback: { href: null, label: "feedback" },
  activity: { href: null, label: "your activity" },
  two_factor: { href: "/settings/security", label: "two-factor settings" },
};

export function resolveWebDestination(value: unknown): WebDestination | undefined {
  if (typeof value !== "string" || !Object.prototype.hasOwnProperty.call(WEB_VOICE_DESTINATIONS, value)) return undefined;
  return WEB_VOICE_DESTINATIONS[value as VoiceScreenDestination];
}

/** What the call actions need from the voice screen. */
export interface CallControls {
  /** Hang up once Memento's goodbye has played, then run `then`. */
  endAfterGoodbye(then?: () => void): void;
  setMuted(muted: boolean): void;
  /** Open a page while the call keeps going. */
  navigate(href: string): void;
}

export function createCallActionHandlers(controls: CallControls): Record<string, VoiceToolHandler> {
  return {
    [END_CALL_TOOL]: () => {
      controls.endAfterGoodbye();
      return "Ending the call after your goodbye.";
    },
    [SET_MICROPHONE_TOOL]: args => {
      if (args.muted === false) return "You cannot unmute the host. They tap the screen to unmute.";
      controls.setMuted(true);
      return "Microphone muted. The host will tap to unmute.";
    },
    [OPEN_SCREEN_TOOL]: args => {
      const target = resolveWebDestination(args.destination);
      if (!target) return "That screen isn't available. Tell the host you can't open it.";
      const { href } = target;
      if (!href) return `${target.label} is not on the web yet. Tell the host it is in the Memento app.`;
      if (args.keep_talking === true) {
        controls.navigate(href);
        return `Opened ${target.label}. The call continues.`;
      }
      controls.endAfterGoodbye(() => controls.navigate(href));
      return `Opening ${target.label} after your goodbye.`;
    },
  };
}
