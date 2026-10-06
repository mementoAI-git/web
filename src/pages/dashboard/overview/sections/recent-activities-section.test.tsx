import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import RecentActivitiesSection from "./recent-activities-section";

describe("RecentActivitiesSection", () => {
  it("dismisses its containing panel when opening all stories", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderWithProviders(<RecentActivitiesSection onNavigate={onNavigate} />, {
      route: "/overview",
      auth: true,
    });
    await user.click(screen.getByRole("link", { name: /see all/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders header with See all link", async () => {
    renderWithProviders(<RecentActivitiesSection />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByRole("heading", { name: /recent activities/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see all/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /see all/i })).toHaveAttribute(
      "href",
      "/stories",
    );
  });

  it("renders activity items when data is loaded", async () => {
    renderWithProviders(<RecentActivitiesSection />, {
      route: "/overview",
      auth: true,
    });
    expect(
      await screen.findByText("What are your thoughts on the..."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("My trip to the United States ba..."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("How do I make a paper plane..."),
    ).toBeInTheDocument();
    expect(screen.getByText('The one time i "woke up"')).toBeInTheDocument();
  });
});
