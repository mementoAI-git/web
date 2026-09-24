import { describe, expect, it } from "vitest";
import { resolveSidebarDesktopWidthPx } from "./sidebar-desktop-width";

describe("resolveSidebarDesktopWidthPx", () => {
  it("matches the wide chat settings drawer from the desktop design", () => {
    expect(
      resolveSidebarDesktopWidthPx(1440, { wideChatPanel: true }),
    ).toBe(485);
  });

  it("protects the main chat column on smaller screens", () => {
    expect(
      resolveSidebarDesktopWidthPx(768, { wideChatPanel: true }),
    ).toBe(348);
  });
});
