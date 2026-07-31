import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "@/test";

import { isUpgradeGateDismissed } from "./gate-session";
import { UpgradePrompt } from "./upgrade-prompt";

describe("UpgradePrompt", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders modal copy and triggers upgrade", async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    const onDismiss = vi.fn();

    renderWithProviders(
      <UpgradePrompt
        feature="voice_mode"
        variant="modal"
        open
        onUpgrade={onUpgrade}
        onDismiss={onDismiss}
      />,
      { route: "/overview", auth: true },
    );

    expect(screen.getByRole("heading", { name: /voice mode is a pro feature/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /upgrade to pro/i }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("does not suppress future modal prompts when choosing maybe later", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <UpgradePrompt
        feature="voice_mode"
        variant="modal"
        open
        onOpenChange={onOpenChange}
      />,
      { route: "/overview", auth: true },
    );

    await user.click(screen.getByRole("button", { name: /let me think about it/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(isUpgradeGateDismissed("voice_mode")).toBe(false);
  });

  it("keeps the desktop modal layout constrained so the content column does not collapse", () => {
    renderWithProviders(
      <UpgradePrompt
        feature="pro_plan"
        variant="modal"
        open
      />,
      { route: "/overview", auth: true },
    );

    const dialog = document.querySelector('[data-slot="dialog-content"]');
    expect(dialog?.className).toContain("md:w-[min(92vw,1040px)]");
    expect(dialog?.className).toContain("md:h-[min(720px,calc(100dvh-2rem))]");

    const contentColumn = screen.getByRole("button", { name: /close upgrade modal/i }).parentElement;
    expect(contentColumn?.className).toContain("md:min-w-[420px]");
    expect(contentColumn?.className).toContain("md:overflow-y-auto");
  });
});
