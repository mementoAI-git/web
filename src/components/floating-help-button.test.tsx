import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { ChatSidebarProvider } from "@/contexts/chat-sidebar";
import { FloatingHelpButton } from "./floating-help-button";

function renderHelp() {
  return renderWithProviders(
    <ChatSidebarProvider>
      <div className="relative min-h-[120px] w-full">
        <FloatingHelpButton />
      </div>
    </ChatSidebarProvider>,
    { route: "/overview", auth: true },
  );
}

describe("FloatingHelpButton", () => {
  it("uses an emoji and an accessible label for opening feedback", () => {
    renderHelp();

    expect(
      screen.getByRole("button", { name: /drop a feedback/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("📝")).toBeInTheDocument();
  });
});
