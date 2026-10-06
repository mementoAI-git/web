import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChatinput } from "./index";
import type { ChatReplyQuote } from "@/utility/chat-reply-prompt";

const DRAFT_KEY = "memento-chat-draft:test-m";

describe("ConversationChatinput", () => {
  afterEach(() => {
    localStorage.removeItem(DRAFT_KEY);
  });
  it("renders the chat textarea", () => {
    renderWithProviders(<ConversationChatinput onSend={() => {}} />, {
      auth: true,
    });
    expect(
      screen.getByPlaceholderText("Type text here... Type / for formatting"),
    ).toBeInTheDocument();
  });

  it("focuses the textarea when the composer background is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConversationChatinput onSend={() => {}} />, { auth: true });
    await user.click(screen.getByTestId("chat-composer-surface"));
    const input = screen.getByRole("textbox");
    expect(input).toHaveFocus();
    await user.keyboard("Writing from the whole box");
    expect(input).toHaveValue("Writing from the whole box");
  });

  it("does not steal focus from composer actions", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    renderWithProviders(<ConversationChatinput onSend={() => {}} replyQuote={{ role: "ai", text: "Earlier" }} onClearReplyQuote={onClear} />, { auth: true });
    const cancel = screen.getByRole("button", { name: "Cancel reply" });
    await user.click(cancel);
    expect(onClear).toHaveBeenCalledOnce();
    expect(cancel).toHaveFocus();
    expect(screen.getByRole("textbox")).not.toHaveFocus();
  });

  it("shows the microphone and swaps it for Send when there is content", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ConversationChatinput onSend={() => {}} memoryId="m1" />,
      { auth: true, route: "/chat/m1" },
    );
    expect(screen.getByRole("button", { name: /voice call/i })).toHaveClass("bg-fill-overview-voice");
    expect(
      screen.getByRole("button", { name: /record voice clip/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send$/i })).toBeNull();

    await user.type(
      screen.getByPlaceholderText("Type text here... Type / for formatting"),
      "x",
    );
    expect(screen.getByRole("button", { name: /^send$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /voice call/i })).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox"));
    expect(screen.getByRole("button", { name: /voice call/i })).toBeInTheDocument();
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

  it("uses the compact bordered composer surface from the chat design", () => {
    renderWithProviders(<ConversationChatinput onSend={() => {}} />, {
      auth: true,
    });
    expect(screen.getByTestId("chat-composer-surface")).toHaveClass(
      "rounded-3xl",
      "border-stroke-neutral-weak",
    );
  });

  it("shows reply strip and clears via Cancel reply", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const quote: ChatReplyQuote = { role: "ai", text: "Earlier message body" };
    renderWithProviders(
      <ConversationChatinput
        onSend={() => {}}
        replyQuote={quote}
        onClearReplyQuote={onClear}
      />,
      { auth: true },
    );
    expect(screen.getByText(/replying to memento/i)).toBeInTheDocument();
    expect(screen.getByText(/earlier message body/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /cancel reply/i }));
    expect(onClear).toHaveBeenCalled();
  });

  it("restores and persists draft text for draftStorageKey", async () => {
    const user = userEvent.setup();
    localStorage.setItem(DRAFT_KEY, "saved line");

    const onSend = vi.fn();
    renderWithProviders(
      <ConversationChatinput
        draftStorageKey={DRAFT_KEY}
        onSend={onSend}
      />,
      { auth: true },
    );

    const ta = screen.getByPlaceholderText("Type text here... Type / for formatting");
    expect(ta).toHaveValue("saved line");

    await user.clear(ta);
    await user.type(ta, "hello draft");
    await waitFor(() => {
      expect(localStorage.getItem(DRAFT_KEY)).toBe("hello draft");
    });

    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalled();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("prefills draft from ?starter= in the URL", async () => {
    localStorage.removeItem(DRAFT_KEY);
    renderWithProviders(
      <ConversationChatinput draftStorageKey={DRAFT_KEY} onSend={() => {}} memoryId="thread-99" />,
      { auth: true, route: "/chat/thread-99?starter=From%20URL" },
    );

    const ta = screen.getByPlaceholderText("Type text here... Type / for formatting");
    await waitFor(() => {
      expect(ta).toHaveValue("From URL");
    });
    expect(localStorage.getItem(DRAFT_KEY)).toBe("From URL");
  });
});
