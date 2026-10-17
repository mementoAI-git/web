import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { useLocation } from "react-router-dom";
import { useModal } from "@/hooks/use-modal";
import { DashboardSideBar } from "./dashboard-sidebar";
import globeIcon from "@/assets/icon/sidebar/globe.svg";
import cardFileBoxIcon from "@/assets/icon/sidebar/card-file-box.svg";
import gearIcon from "@/assets/icon/sidebar/gear.svg";
import linkIcon from "@/assets/icon/sidebar/link.svg";
import lightBulbIcon from "@/assets/icon/sidebar/light-bulb.svg";
import upArrowIcon from "@/assets/icon/sidebar/up-arrow.svg";

function ModalState() {
  const { state, close } = useModal();
  return <><output data-testid="modal-state">{state[0]?.name}</output><button onClick={() => close()}>Dismiss overlay</button></>;
}

function CurrentLocation() {
  const location = useLocation();
  return (
    <output data-testid="current-location">{location.pathname + location.search + location.hash}</output>
  );
}

describe("DashboardSideBar", () => {
  it.each([
    ["Insights", "memory-insights"],
    ["Invite friends", "invite-friends"],
    ["Feedback", "create-feedback"],
    ["Upgrade plan", "pricing"],
  ])("keeps the originating page when opening and closing %s", async (label, modalName) => {
    const route = "/stories?tab=bookmarked#saved";
    renderWithProviders(<><DashboardSideBar /><ModalState /><CurrentLocation /></>, { route, auth: true });
    await userEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
    expect(screen.getByTestId("modal-state")).toHaveTextContent(modalName);
    expect(screen.getByTestId("current-location")).toHaveTextContent(route);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss overlay" }));
    expect(screen.getByTestId("modal-state")).toBeEmptyDOMElement();
    expect(screen.getByTestId("current-location")).toHaveTextContent(route);
  });

  it("opens the reserved People page and marks the People item active", async () => {
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
      "/people",
    );
    expect(screen.getByRole("button", { name: "People" })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).not.toHaveAttribute("data-active");
  });

  it("keeps beneficiaries under Settings rather than People", () => {
    renderWithProviders(<DashboardSideBar />, { route: "/settings/beneficiary", auth: true });
    expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("button", { name: "People" })).not.toHaveAttribute("data-active");
  });

  it("opens the invite modal without navigating away", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><DashboardSideBar /><ModalState /><CurrentLocation /></>, {route: "/overview", auth: true});
    await user.click(screen.getByRole("button", {name: "Invite friends"}));
    expect(screen.getByTestId("modal-state")).toHaveTextContent("invite-friends");
    expect(screen.getByTestId("current-location")).toHaveTextContent("/overview");
  });

  it("opens pricing over the current screen", async () => {
    renderWithProviders(<><DashboardSideBar /><ModalState /><CurrentLocation /></>, { route: "/overview", auth: true });
    await userEvent.click(screen.getByRole("button", { name: "Upgrade plan" }));
    expect(screen.getByTestId("modal-state")).toHaveTextContent("pricing");
    expect(screen.getByTestId("current-location")).toHaveTextContent("/overview");
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

  it("omits the duplicate time capsule navigation entry", () => {
    renderWithProviders(<DashboardSideBar />, {
      route: "/overview",
      auth: true,
    });
    expect(screen.queryByRole("button", { name: "Time capsule" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overview" })).toBeInTheDocument();
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
      ["Settings", gearIcon],
      ["Invite friends", linkIcon],
      ["Insights", lightBulbIcon],
      ["Upgrade plan", upArrowIcon],
    ]) {
      expect(
        screen.getByRole("button", { name: title }).querySelector("img"),
      ).toHaveAttribute("src", asset);
    }
    expect(screen.getByText("💬")).toBeInTheDocument();
    expect(screen.getByText("🧭")).toBeInTheDocument();
    for (const [title, emoji] of [["People", "🫂"], ["Feedback", "📝"]]) {
      expect(screen.getByRole("button", { name: title })).toHaveTextContent(emoji);
    }
    expect(screen.getByRole("button", { name: "Upgrade plan" })).toHaveClass(
      "text-text-brand-strong",
    );
    expect(screen.queryByText("Unlock more with Pro")).not.toBeInTheDocument();
    expect(screen.getByText("Host user")).toBeInTheDocument();
  });

  it("opens Invite friends without navigating to settings", async () => {
    const user = userEvent.setup();
    renderWithProviders(<><DashboardSideBar /><ModalState /><CurrentLocation /></>, { route: "/overview", auth: true });
    await user.click(screen.getByRole("button", { name: "Invite friends" }));
    expect(screen.getByTestId("modal-state")).toHaveTextContent("invite-friends");
    expect(screen.getByTestId("current-location")).toHaveTextContent("/overview");
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
