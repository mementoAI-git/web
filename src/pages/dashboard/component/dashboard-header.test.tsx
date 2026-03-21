import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("uses a home icon for the chat toggle when closed (no AI orb image)", () => {
    renderWithProviders(
      <ConversationChromeProvider>
        <DashboardHeader chatOpen={false} onChatToggle={() => {}} />
      </ConversationChromeProvider>,
      { route: "/chat", auth: true },
    );

    const toggle = screen.getByRole("button", { name: /open chat/i });
    expect(toggle.querySelector("svg")).toBeTruthy();
    expect(toggle.querySelector('img[alt="AI"]')).toBeNull();
  });

  it("uses a home icon for the chat toggle when open (no AI orb image)", () => {
    renderWithProviders(
      <ConversationChromeProvider>
        <DashboardHeader chatOpen onChatToggle={() => {}} />
      </ConversationChromeProvider>,
      { route: "/chat", auth: true },
    );

    const toggle = screen.getByRole("button", { name: /close chat/i });
    expect(toggle.querySelector("svg")).toBeTruthy();
    expect(toggle.querySelector('img[alt="AI"]')).toBeNull();
  });

  it("shows the streak control in the default header", () => {
    renderWithProviders(
      <ConversationChromeProvider>
        <DashboardHeader chatOpen={false} onChatToggle={() => {}} />
      </ConversationChromeProvider>,
      { route: "/overview", auth: true },
    );

    expect(screen.getByAltText("Streak")).toBeTruthy();
  });

  it("resolves the dashboard title for /capsule like other sections", () => {
    renderWithProviders(
      <ConversationChromeProvider>
        <DashboardHeader chatOpen={false} onChatToggle={() => {}} />
      </ConversationChromeProvider>,
      { route: "/capsule", auth: true },
    );

    expect(screen.getByText(/time capsule/i)).toBeTruthy();
    expect(screen.getByAltText("Streak")).toBeTruthy();
  });
});
