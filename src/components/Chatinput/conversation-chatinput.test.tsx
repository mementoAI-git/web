import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { ConversationChatinput } from "./index";

describe("ConversationChatinput", () => {
  it("renders the chat textarea", () => {
    renderWithProviders(<ConversationChatinput onSend={() => {}} />, {
      auth: true,
    });
    expect(
      screen.getByPlaceholderText("Type text here... Type / for formatting"),
    ).toBeInTheDocument();
  });

  it("uses its own outer shell (full width, no landing max width)", () => {
    renderWithProviders(<ConversationChatinput onSend={() => {}} />, {
      auth: true,
    });
    const shell = screen.getByTestId("chat-input-conversation-shell");
    expect(shell.className).toMatch(/w-full/);
    expect(shell.className).toMatch(/min-w-0/);
    expect(shell.className).not.toMatch(/max-w-\[600px\]/);
    expect(shell.className).not.toMatch(/mx-auto/);
  });
});
