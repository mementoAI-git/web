import type { VoiceToolHandler } from "./relay";

export const END_CALL_TOOL = "end_call";
export const SET_MICROPHONE_TOOL = "set_microphone";
export const OPEN_SCREEN_TOOL = "open_screen";
export const CALL_ACTION_TOOLS = [END_CALL_TOOL, SET_MICROPHONE_TOOL, OPEN_SCREEN_TOOL];

// Keep in sync with VOICE_SCREEN_DESTINATIONS in
// api/src/module/api/ai/live-session-config.ts, apart from time_capsules, which is hidden on web for now.
export const VOICE_SCREEN_DESTINATIONS = [
  "home", "chat", "stories", "bookmarks", "people", "new_story", "quick_note", "explore_prompts",
  "insights", "account", "settings", "profile", "plan_and_billing", "upgrade", "privacy",
  "beneficiaries", "feedback", "activity", "two_factor",
] as const;

export type VoiceScreenDestination = (typeof VOICE_SCREEN_DESTINATIONS)[number];

/** A page (href), or one of the app's modals (modal: a useModal name) where mobile has a screen. */
export type WebDestination = { href: string; modal?: never; label: string } | { href?: never; modal: string; label: string };

export const WEB_VOICE_DESTINATIONS: Record<VoiceScreenDestination, WebDestination> = {
  home: { href: "/overview", label: "home" },
  chat: { href: "/chat", label: "chat" },
  stories: { href: "/stories", label: "your stories" },
  bookmarks: { href: "/stories?filter=bookmarked", label: "your bookmarked stories" },
  people: { href: "/chat?people=1", label: "your people" },
  new_story: { modal: "create-memory", label: "a new story" },
  quick_note: { modal: "quick-capture", label: "a quick note" },
  explore_prompts: { href: "/explore", label: "explore prompts" },
  insights: { href: "/settings/general?view=about", label: "your insights" },
  account: { href: "/settings/general", label: "your account" },
  settings: { href: "/settings/general", label: "settings" },
  profile: { href: "/settings/general", label: "your profile" },
  plan_and_billing: { href: "/settings/billing", label: "plan and billing" },
  upgrade: { href: "/pricing", label: "plans" },
  privacy: { href: "/settings/privacy", label: "privacy settings" },
  beneficiaries: { href: "/settings/beneficiary", label: "beneficiaries" },
  feedback: { modal: "create-feedback", label: "feedback" },
  activity: { modal: "recent-activities", label: "your activity" },
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
  /** Open one of the app's modals (new story, quick note, feedback, activity). */
  openModal(name: string): void;
}

/** Shows a destination: a page or a modal. */
export function showWebDestination(target: WebDestination, controls: Pick<CallControls, "navigate" | "openModal">): void {
  if (target.modal) controls.openModal(target.modal);
  else controls.navigate(target.href);
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
      if (args.keep_talking === true) {
        showWebDestination(target, controls);
        return `Opened ${target.label}. The call continues.`;
      }
      controls.endAfterGoodbye(() => showWebDestination(target, controls));
      return `Opening ${target.label} after your goodbye.`;
    },
  };
}
