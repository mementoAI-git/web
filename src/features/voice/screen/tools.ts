import type { VoiceToolHandler } from "../tools/relay";
import type { DomScreen, ScrollDirection } from "./dom-screen";

export const SCROLL_TOOL = "scroll";
export const GO_BACK_TOOL = "go_back";
export const PRESS_BUTTON_TOOL = "press_button";
export const LOOK_AT_SCREEN_TOOL = "look_at_screen";
export const TYPE_TEXT_TOOL = "type_text";
export const SCREEN_CONTROL_TOOLS = [SCROLL_TOOL, GO_BACK_TOOL, PRESS_BUTTON_TOOL, LOOK_AT_SCREEN_TOOL, TYPE_TEXT_TOOL];

/** Time for a page change to finish before saying where the host is now. */
export const SCREEN_SETTLE_MS = 500;

const DIRECTIONS: ScrollDirection[] = ["up", "down", "top", "bottom"];

type Screen = Pick<DomScreen, "screenName" | "describe" | "press" | "type" | "scroll">;

/** Voice control of the page in front of the host. Mirrors mobile's voice-control/tools.ts. */
export function createScreenControlHandlers(deps: {
  screen: Screen;
  canGoBack: () => boolean;
  goBack: () => void;
  settleMs?: number;
}): Record<string, VoiceToolHandler> {
  const settle = () => new Promise(resolve => setTimeout(resolve, deps.settleMs ?? SCREEN_SETTLE_MS));
  const { screen } = deps;
  return {
    [LOOK_AT_SCREEN_TOOL]: () => screen.describe(),
    [TYPE_TEXT_TOOL]: args => {
      const text = typeof args.text === "string" ? args.text : "";
      if (!text.trim()) return "What should be typed? Use the host's own words.";
      return screen.type(text.slice(0, 4_000), {
        field: typeof args.field === "string" && args.field.trim() ? args.field : undefined,
        mode: args.mode === "replace" ? "replace" : "append",
        send: args.send === true,
      });
    },
    [SCROLL_TOOL]: args => {
      const direction = args.direction as ScrollDirection;
      if (!DIRECTIONS.includes(direction)) return "Scroll direction must be up, down, top or bottom.";
      return screen.scroll(direction);
    },
    [GO_BACK_TOOL]: async () => {
      const from = screen.screenName();
      if (!deps.canGoBack()) return `There is no screen to go back to; still on ${from}.`;
      deps.goBack();
      await settle();
      const now = screen.screenName();
      return now === from ? `Went back. Still on ${now}.` : `Went back from ${from}. Now on ${now}.`;
    },
    [PRESS_BUTTON_TOOL]: async args => {
      const label = typeof args.label === "string" ? args.label.trim() : "";
      if (!label) return "Which button? Ask the host what it says.";
      const turnOn = typeof args.turn_on === "boolean" ? args.turn_on : undefined;
      const which = typeof args.which === "number" ? args.which : undefined;
      const from = screen.screenName();
      const result = screen.press(label.slice(0, 80), turnOn, which);
      if (!result.startsWith("Pressed")) return result;
      await settle();
      const now = screen.screenName();
      return now === from ? result : `${result} Now on ${now}.`;
    },
  };
}
