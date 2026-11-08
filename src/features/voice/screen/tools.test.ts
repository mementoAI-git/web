import { describe, expect, it, vi } from "vitest";
import { createScreenControlHandlers, SCREEN_CONTROL_TOOLS } from "./tools";
import { webScreenName } from "./screen-names";

const fakeScreen = (names: string[] = ["Stories"]) => {
  let index = 0;
  return {
    screenName: vi.fn(() => names[Math.min(index, names.length - 1)]),
    advance: () => { index += 1; },
    describe: vi.fn(() => "Screen: Stories."),
    press: vi.fn(() => 'Pressed "Open".'),
    type: vi.fn(async () => "Typed."),
    scroll: vi.fn(async () => "Scrolled down."),
  };
};

describe("createScreenControlHandlers", () => {
  it("covers every screen tool the API declares", () => {
    expect(SCREEN_CONTROL_TOOLS).toEqual(["scroll", "go_back", "press_button", "look_at_screen", "type_text"]);
  });

  it("says where the host is after a press that changes the page", async () => {
    const screen = fakeScreen(["Stories", "a story"]);
    screen.press.mockImplementation(() => { screen.advance(); return 'Pressed "Open".'; });
    const handlers = createScreenControlHandlers({ screen, canGoBack: () => true, goBack: vi.fn(), settleMs: 0 });
    await expect(handlers.press_button({ label: "Open", which: 2, turn_on: true })).resolves.toBe('Pressed "Open". Now on a story.');
    expect(screen.press).toHaveBeenCalledWith("Open", true, 2);
  });

  it("asks which button when no label is given", async () => {
    const handlers = createScreenControlHandlers({ screen: fakeScreen(), canGoBack: () => true, goBack: vi.fn(), settleMs: 0 });
    await expect(handlers.press_button({})).resolves.toBe("Which button? Ask the host what it says.");
  });

  it("goes back and says where the host is now", async () => {
    const screen = fakeScreen(["a story", "Stories"]);
    const goBack = vi.fn(() => screen.advance());
    const handlers = createScreenControlHandlers({ screen, canGoBack: () => true, goBack, settleMs: 0 });
    await expect(handlers.go_back({})).resolves.toBe("Went back from a story. Now on Stories.");
  });

  it("says when there is nowhere to go back to", async () => {
    const handlers = createScreenControlHandlers({ screen: fakeScreen(), canGoBack: () => false, goBack: vi.fn(), settleMs: 0 });
    await expect(handlers.go_back({})).resolves.toBe("There is no screen to go back to; still on Stories.");
  });

  it("checks the scroll direction and the typed text", async () => {
    const screen = fakeScreen();
    const handlers = createScreenControlHandlers({ screen, canGoBack: () => true, goBack: vi.fn(), settleMs: 0 });
    expect(await handlers.scroll({ direction: "sideways" })).toBe("Scroll direction must be up, down, top or bottom.");
    expect(await handlers.type_text({ text: "  " })).toBe("What should be typed? Use the host's own words.");
    await handlers.type_text({ text: "Homecoming", field: "Title", mode: "replace", send: false });
    expect(screen.type).toHaveBeenCalledWith("Homecoming", { field: "Title", mode: "replace", send: false });
  });
});

describe("webScreenName", () => {
  it("names the pages the host can be on", () => {
    expect(webScreenName("/overview", "")).toBe("Home");
    expect(webScreenName("/stories", "")).toBe("Stories");
    expect(webScreenName("/stories/64b7f0c2a1b2c3d4e5f60718", "")).toBe("a story");
    expect(webScreenName("/chat/abc/voice", "")).toBe("a conversation");
    expect(webScreenName("/settings/billing", "")).toBe("Settings: Billing");
    expect(webScreenName("/settings/general", "?view=about")).toBe("Insights");
    expect(webScreenName("/explore", "")).toBe("Topics");
    expect(webScreenName("/explore/categories/who-i-am", "")).toBe("a topic category");
    expect(webScreenName("/somewhere/else", "")).toBe("a page in Memento");
  });
});
