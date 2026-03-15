import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import { DashboardChatInput } from "./dashboard-chat-input";

describe("DashboardChatInput", () => {
  it("renders textarea and send button", () => {
    renderWithProviders(<DashboardChatInput />, { route: "/overview", auth: true });
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
  });

  it("send button is disabled when empty", () => {
    renderWithProviders(<DashboardChatInput />, { route: "/overview", auth: true });
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("calls onSend when text entered and send clicked", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(<DashboardChatInput onSend={onSend} />, {
      route: "/overview",
      auth: true,
    });
    const input = screen.getByPlaceholderText(/type a message/i);
    await user.type(input, "Hello");
    await user.click(screen.getByRole("button", { name: /send message/i }));
    expect(onSend).toHaveBeenCalledWith({ text: "Hello", attachments: [] });
  });
});
