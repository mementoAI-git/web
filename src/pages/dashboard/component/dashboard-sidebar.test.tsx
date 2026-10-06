import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { useLocation } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import { DashboardSideBar } from "./dashboard-sidebar";
import globeIcon from "@/assets/icon/sidebar/globe.svg";
import cardFileBoxIcon from "@/assets/icon/sidebar/card-file-box.svg";
import hourglassIcon from "@/assets/icon/sidebar/hourglass.svg";
import gearIcon from "@/assets/icon/sidebar/gear.svg";
import linkIcon from "@/assets/icon/sidebar/link.svg";
import lightBulbIcon from "@/assets/icon/sidebar/light-bulb.svg";
import upArrowIcon from "@/assets/icon/sidebar/up-arrow.svg";

function ModalState() {
  const { state } = useModal();
  return <output data-testid="modal-state">{state[0]?.name}</output>;
}

function CurrentLocation() {
  return (
    <output data-testid="current-location">{useLocation().pathname}</output>
  );
}

describe("DashboardSideBar", () => {
  it("opens People settings and marks the People item active", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DashboardSideBar />
        <CurrentLocation />
      </>,
      { route: "/overview", auth: true },
    );
    await user.click(screen.getByRole("button", { name: "People" }));
    expect(screen.getByTestId("current-location")).toHaveTextContent(
      "/settings/beneficiary",
    );
    expect(screen.getByRole("button", { name: "People" })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).not.toHaveAttribute("data-active");
  });

  it("opens Insights from the main navigation", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DashboardSideBar />
        <ModalState />
      </>,
      { route: "/overview", auth: true },
    );
    await user.click(screen.getByRole("button", { name: "Insights" }));
    expect(screen.getByTestId("modal-state")).toHaveTextContent(
      "memory-insights",
    );
  });

  it("keeps the time capsule entry on its existing route", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <DashboardSideBar />
        <CurrentLocation />
      </>,
      { route: "/overview", auth: true },
    );
    await user.click(screen.getByRole("button", { name: "Time capsule" }));
    expect(screen.getByTestId("current-location")).toHaveTextContent(
      "/capsule",
    );
  });

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

    for (const [title, asset] of [
      ["Overview", globeIcon],
      ["My Stories", cardFileBoxIcon],
      ["Time capsule", hourglassIcon],
      ["Settings", gearIcon],
      ["Invite friends", linkIcon],
      ["Feedback", lightBulbIcon],
      ["Upgrade plan", upArrowIcon],
    ]) {
      expect(
        screen.getByRole("button", { name: title }).querySelector("img"),
      ).toHaveAttribute("src", asset);
    }
    expect(screen.getByText("💬")).toBeInTheDocument();
    expect(screen.getByText("🧭")).toBeInTheDocument();
    for (const title of ["Insights", "People"]) {
      expect(
        screen.getByRole("button", { name: title }).querySelector("svg"),
      ).toHaveClass("text-icon-neutral-strong");
    }
    expect(screen.getByRole("button", { name: "Upgrade plan" })).toHaveClass(
      "text-text-brand-strong",
    );
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
