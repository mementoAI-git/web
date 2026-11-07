type OutsidePointerEvent = {
  detail: { originalEvent: Event };
  preventDefault: () => void;
};

/** Using the floating voice call doesn't count as clicking away from a dialog. */
export function keepOpenForVoiceCall(event: OutsidePointerEvent) {
  const target = event.detail.originalEvent.target;
  if (target instanceof Element && target.closest("[data-voice-ignore]")) {
    event.preventDefault();
  }
}
