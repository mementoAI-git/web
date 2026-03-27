import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("shows the streak control in the default header", () => {
    renderWithProviders(
      <ConversationChromeProvider>
        <DashboardHeader />
      </ConversationChromeProvider>,
      { route: "/overview", auth: true },
    );

    expect(screen.getByAltText("Streak")).toBeTruthy();
  });

  it("resolves the dashboard title for /capsule like other sections", () => {
    renderWithProviders(
      <ConversationChromeProvider>
        <DashboardHeader />
      </ConversationChromeProvider>,
      { route: "/capsule", auth: true },
    );

    expect(screen.getByText(/time capsule/i)).toBeTruthy();
    expect(screen.getByAltText("Streak")).toBeTruthy();
  });
});
