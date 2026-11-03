import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { VoiceAvatar } from "./voice-avatar";
import { MOBILE_VOICE_CATALOG } from "@/features/voice/mobile-voice-catalog";

it("uses mobile's gradient placeholders for Maya and Leo without a user avatar", () => {
  const {container} = render(<>{MOBILE_VOICE_CATALOG.slice(4).map((voice) => <VoiceAvatar key={voice.id} artwork={voice.artwork} title={voice.title} />)}</>);
  expect(screen.getByRole("img", {name: "Maya voice avatar"})).toHaveStyle({backgroundImage: MOBILE_VOICE_CATALOG[4].artwork});
  expect(screen.getByRole("img", {name: "Leo voice avatar"})).toHaveStyle({backgroundImage: MOBILE_VOICE_CATALOG[5].artwork});
  expect(container.querySelector('.user-avatar')).toBeNull();
  expect(container.querySelector('img[src*="dicebear"]')).toBeNull();
});
