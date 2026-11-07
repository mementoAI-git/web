import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import Chatinput from "./index";

describe("Chatinput", () => {
  it("renders textarea without formatting instructions", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    expect(
      screen.getByPlaceholderText("Type text here..."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("chat-input-landing-shell")).toBeInTheDocument();
  });

  it("shows voice call as a button without a chat route; Send only after typing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });

    expect(
      screen.getByRole("button", { name: /voice call/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dictate a message/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send$/i })).toBeNull();

    const textarea = screen.getByPlaceholderText(
      "Type text here...",
    );
    await user.type(textarea, "hi");
    const sendBtn = screen.getByRole("button", { name: /^send$/i });
    expect(sendBtn).toBeInTheDocument();
    expect(sendBtn).not.toBeDisabled();
  });

  it("offers voice in the composer when memory id is set", () => {
    renderWithProviders(
      <Chatinput onSend={() => {}} memoryId="abc123" />,
      { auth: true, route: "/chat/abc123" },
    );
    expect(screen.getByRole("button", { name: /voice call/i })).toBeEnabled();
  });

  it("fills container width without a 680px max on the outer shell", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here...",
    );
    let el: HTMLElement | null = textarea;
    let max680layers = 0;
    while (el) {
      if (
        typeof el.className === "string" &&
        el.className.includes("max-w-[680px]")
      ) {
        max680layers += 1;
      }
      el = el.parentElement;
    }
    expect(max680layers).toBe(0);
  });

  it("treats slash-prefixed text as a normal message without a command menu", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(<Chatinput onSend={onSend} />, { auth: true });
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "/");
    expect(screen.queryByText("Heading 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Bold")).not.toBeInTheDocument();
    await user.type(textarea, "remember this");
    await user.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ text: "/remember this" }));
    expect(textarea).toHaveValue("");
  });

  it("keeps Shift+Enter available for multiline messages containing slashes", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProviders(<Chatinput onSend={onSend} />, { auth: true });
    await user.type(screen.getByRole("textbox"), "/first{Shift>}{Enter}{/Shift}second");
    expect(screen.getByRole("textbox")).toHaveValue("/first\nsecond");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("grows textarea height as content gains lines", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here...",
    ) as HTMLTextAreaElement;

    const setScrollHeight = (value: number) => {
      Object.defineProperty(textarea, "scrollHeight", {
        configurable: true,
        value,
      });
    };

    setScrollHeight(48);
    fireEvent.change(textarea, {
      target: { value: "one", selectionStart: 3 },
    });
    expect(textarea.style.height).toBe("48px");

    setScrollHeight(160);
    fireEvent.change(textarea, {
      target: {
        value: "one\ntwo\nthree\nfour",
        selectionStart: 20,
      },
    });
    expect(textarea.style.height).toBe("160px");
  });

  it("pastes an image from the clipboard and shows a preview above the textarea", async () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here...",
    );

    const file = new File([Uint8Array.from([137, 80, 78, 71])], "clip.png", {
      type: "image/png",
    });
    const clipboardData = {
      files: {
        length: 1,
        item: (i: number) => (i === 0 ? file : null),
      },
      items: [] as { kind: string; getAsFile: () => File }[],
    };

    fireEvent.paste(textarea, { clipboardData: clipboardData as never });

    await waitFor(() => {
      // It might be "clip.png" (local) or "mock-upload.png" (if MSW handler kicked in)
      expect(screen.getByAltText(/clip\.png|mock-upload\.png/)).toBeInTheDocument();
    });

    expect(textarea.compareDocumentPosition(screen.getByAltText(/clip\.png|mock-upload\.png/))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING,
    );
  });

  it("submits on Ctrl+Enter", () => {
    const onSend = vi.fn();
    renderWithProviders(<Chatinput onSend={onSend} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here...",
    );
    fireEvent.change(textarea, {
      target: { value: "send via shortcut", selectionStart: 17 },
    });
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ text: "send via shortcut" }),
    );
  });

});
