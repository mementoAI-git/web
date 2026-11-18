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

    expect(
      screen.getByRole("heading", { name: /used this month’s free voice minutes/i }),
    ).toBeInTheDocument();

    await user.click(
      (await screen.findAllByRole("button", { name: /upgrade to pro/i }))[0],
    );
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

    await user.click(
      screen.getByRole("button", { name: /let me think about it/i }),
    );

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(isUpgradeGateDismissed("voice_mode")).toBe(false);
  });

  it("reuses mobile plans without outdated lifetime offers", async () => {
    renderWithProviders(
      <UpgradePrompt feature="pro_plan" variant="modal" open />,
      { route: "/overview", auth: true },
    );
    expect(screen.getByRole("heading", { name: "Free" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Annual" }));
    expect(screen.getByText("$79.00")).toBeInTheDocument();
    expect(screen.queryByText(/lifetime/i)).not.toBeInTheDocument();
  });
});
