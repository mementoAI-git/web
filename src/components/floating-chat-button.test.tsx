import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test";
import { ChatSidebarProvider } from "@/contexts/chat-sidebar";
import { FloatingChatButton } from "./floating-chat-button";

function renderFloatingChat() {
  return renderWithProviders(
    <ChatSidebarProvider>
      <div className="relative min-h-[120px] w-full">
        <FloatingChatButton />
      </div>
    </ChatSidebarProvider>,
    { route: "/overview", auth: true },
  );
}

describe("FloatingChatButton", () => {
  it("toggles between open and close chat labels", async () => {
    const user = userEvent.setup();
    renderFloatingChat();

    const openBtn = screen.getByRole("button", { name: /open chat/i });
    expect(openBtn).toBeInTheDocument();
    await user.click(openBtn);

    expect(screen.getByRole("button", { name: /close chat/i })).toBeInTheDocument();
  });
});
