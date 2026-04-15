import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import RecentActivitiesModal from "./recent-activities-modal";

describe("RecentActivitiesModal", () => {
  it("renders with title", () => {
    renderWithProviders(<RecentActivitiesModal />, { route: "/overview", auth: true });
    expect(screen.getByRole("heading", { name: /recent activities/i })).toBeInTheDocument();
  });

  it("has a close button", () => {
    renderWithProviders(<RecentActivitiesModal />, { route: "/overview", auth: true });
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});
