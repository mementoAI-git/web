import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import RecentActivitiesSection from "./recent-activities-section";

describe("RecentActivitiesSection", () => {
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
      "/stories"
    );
  });

  it("renders activity items when data is loaded", async () => {
    renderWithProviders(<RecentActivitiesSection />, {
      route: "/overview",
      auth: true,
    });
    expect(await screen.findByText("What are your thoughts on the...")).toBeInTheDocument();
    expect(screen.getByText("My trip to the United States ba...")).toBeInTheDocument();
    expect(screen.getByText("How do I make a paper plane...")).toBeInTheDocument();
    expect(screen.getByText('The one time i "woke up"')).toBeInTheDocument();
  });
});
