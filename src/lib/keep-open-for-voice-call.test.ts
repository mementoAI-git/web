import { expect, it, vi } from "vitest";
import { keepOpenForVoiceCall } from "./keep-open-for-voice-call";

function outsideEvent(target: Element) {
  return { detail: { originalEvent: { target } as unknown as Event }, preventDefault: vi.fn() };
}

it("keeps a dialog open when the floating voice call is used", () => {
  const call = document.createElement("div");
  call.dataset.voiceIgnore = "";
  const button = call.appendChild(document.createElement("button"));
  const event = outsideEvent(button);
  keepOpenForVoiceCall(event);
  expect(event.preventDefault).toHaveBeenCalled();
});

it("lets a click anywhere else dismiss the dialog", () => {
  const event = outsideEvent(document.createElement("button"));
  keepOpenForVoiceCall(event);
  expect(event.preventDefault).not.toHaveBeenCalled();
});
