import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { DashboardSideBar } from "./dashboard-sidebar";
import inviteFriendsIcon from "@/assets/icon/noto_link.svg";
import feedbackIcon from "@/assets/icon/noto_light-bulb.svg";
import upgradePlanIcon from "@/assets/icon/emojione_up-arrow.svg";

describe("DashboardSideBar", () => {
  it("composes the approved shadcn sidebar structure", () => {
    const { container } = renderWithProviders(<DashboardSideBar />, {
      route: "/chat",
      auth: true,
    });

    expect(
      container.querySelector('[data-slot="sidebar"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="sidebar-header"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="sidebar-content"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="sidebar-footer"]'),
    ).toBeInTheDocument();

    expect(screen.getByText("memento.")).toHaveClass("text-foreground");
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeInTheDocument();

    const chatItem = screen.getByRole("button", { name: "Chat" });
    expect(chatItem).toHaveAttribute("data-active", "true");

    const inviteButton = screen.getByRole("button", { name: "Invite friends" });
    const feedbackButton = screen.getByRole("button", { name: "Feedback" });
    const upgradeButton = screen.getByRole("button", { name: "Upgrade plan" });

    expect(
      within(inviteButton).getByRole("presentation", { hidden: true }),
    ).toHaveAttribute("src", inviteFriendsIcon);
    expect(
      within(feedbackButton).getByRole("presentation", { hidden: true }),
    ).toHaveAttribute("src", feedbackIcon);
    expect(
      within(upgradeButton).getByRole("presentation", { hidden: true }),
    ).toHaveAttribute("src", upgradePlanIcon);
    expect(screen.queryByText("Unlock more with Pro")).not.toBeInTheDocument();
    expect(screen.getByText("Host user")).toBeInTheDocument();
  });

  it("calls the supplied collapse handler", async () => {
    const user = userEvent.setup();
    const onCollapse = vi.fn();

    renderWithProviders(<DashboardSideBar onCollapse={onCollapse} />, {
      route: "/overview",
      auth: true,
    });

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });
});
