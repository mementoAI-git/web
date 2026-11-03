import { describe, expect, it, vi } from "vitest";
import { createCallActionHandlers, resolveWebDestination, VOICE_SCREEN_DESTINATIONS, WEB_VOICE_DESTINATIONS } from "./call-actions";

const controls = () => ({ endAfterGoodbye: vi.fn(), setMuted: vi.fn(), navigate: vi.fn() });

describe("web voice destinations", () => {
  it("has an entry, a route or an honest gap, for every screen the API lets Memento open", () => {
    expect(Object.keys(WEB_VOICE_DESTINATIONS).sort()).toEqual([...VOICE_SCREEN_DESTINATIONS].sort());
  });

  it("maps screens to real web routes", () => {
    expect(resolveWebDestination("stories")?.href).toBe("/stories");
    expect(resolveWebDestination("plan_and_billing")?.href).toBe("/settings/billing");
    expect(resolveWebDestination("new_story")?.href).toBeNull();
    expect(resolveWebDestination("toString")).toBeUndefined();
    expect(resolveWebDestination(42)).toBeUndefined();
  });
});

describe("createCallActionHandlers", () => {
  it("ends the call after Memento's goodbye", async () => {
    const c = controls();
    expect(await createCallActionHandlers(c).end_call({})).toMatch(/after your goodbye/);
    expect(c.endAfterGoodbye).toHaveBeenCalledWith();
  });

  it("mutes, but never unmutes, the host", async () => {
    const c = controls();
    const handlers = createCallActionHandlers(c);
    expect(await handlers.set_microphone({ muted: false })).toMatch(/cannot unmute/);
    expect(c.setMuted).not.toHaveBeenCalled();
    await handlers.set_microphone({ muted: true });
    expect(c.setMuted).toHaveBeenCalledWith(true);
  });

  it("opens a screen and keeps talking", async () => {
    const c = controls();
    expect(await createCallActionHandlers(c).open_screen({ destination: "stories", keep_talking: true })).toMatch(/call continues/);
    expect(c.navigate).toHaveBeenCalledWith("/stories");
    expect(c.endAfterGoodbye).not.toHaveBeenCalled();
  });

  it("opens the screen only after the goodbye when the host is leaving", async () => {
    const c = controls();
    await createCallActionHandlers(c).open_screen({ destination: "stories", keep_talking: false });
    expect(c.navigate).not.toHaveBeenCalled();
    c.endAfterGoodbye.mock.calls[0][0]();
    expect(c.navigate).toHaveBeenCalledWith("/stories");
  });

  it("says honestly when a screen is not on the web", async () => {
    const c = controls();
    const handlers = createCallActionHandlers(c);
    expect(await handlers.open_screen({ destination: "new_story", keep_talking: true })).toMatch(/not on the web/);
    expect(await handlers.open_screen({ destination: "moon", keep_talking: true })).toMatch(/isn't available/);
    expect(c.navigate).not.toHaveBeenCalled();
  });
});
