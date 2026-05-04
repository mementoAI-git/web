import { describe, expect, it, beforeEach } from "vitest";

import { dismissUpgradeGate, isUpgradeGateDismissed } from "./gate-session";

describe("gate-session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("tracks dismiss per feature", () => {
    expect(isUpgradeGateDismissed("voice_mode")).toBe(false);
    dismissUpgradeGate("voice_mode");
    expect(isUpgradeGateDismissed("voice_mode")).toBe(true);
    expect(isUpgradeGateDismissed("supermemory")).toBe(false);
  });
});
