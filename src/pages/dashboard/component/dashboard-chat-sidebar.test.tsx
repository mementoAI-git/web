import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { DashboardChatSidebar } from "./dashboard-chat-sidebar";

describe("DashboardChatSidebar", () => {
  it("renders with Chat heading", () => {
    renderWithProviders(
      <DashboardChatSidebar onClose={() => {}} />,
      { route: "/overview", auth: true },
    );
    expect(screen.getByRole("heading", { name: /^chat$/i })).toBeInTheDocument();
  });

  it("has a close button", () => {
    renderWithProviders(
      <DashboardChatSidebar onClose={() => {}} />,
      { route: "/overview", auth: true },
    );
    expect(screen.getByRole("button", { name: /close chat/i })).toBeInTheDocument();
  });

  it("keeps conversation in panel - shows user and AI messages inline", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <DashboardChatSidebar onClose={() => {}} />,
      { route: "/overview", auth: true },
    );
    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: /send message/i }));

    await screen.findByText("Hello");
    await screen.findByText(/reply to: hello/i);
  });
});
