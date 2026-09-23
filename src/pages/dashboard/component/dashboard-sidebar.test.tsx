import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { DashboardSideBar } from "./dashboard-sidebar";

describe("DashboardSideBar", () => {
  it("uses a semantic surface and readable logo and profile foreground", () => {
    const { container } = renderWithProviders(<DashboardSideBar />, {
      route: "/overview",
      auth: true,
    });

    const shell = container.firstElementChild;
    expect(shell).toHaveClass("bg-card", "border-border");
    expect(shell).not.toHaveClass("bg-white");
    expect(screen.getByText("memento.")).toHaveClass("text-foreground");
    expect(screen.getByText("User")).toHaveClass("text-foreground");
  });
});
