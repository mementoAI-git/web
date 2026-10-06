import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import Chatinput from "./index";

describe("Chatinput", () => {
  it("renders textarea with slash-command placeholder", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    expect(
      screen.getByPlaceholderText("Type text here... Type / for formatting"),
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
      screen.getByRole("button", { name: /record voice clip/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^send$/i })).toBeNull();

    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
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
      "Type text here... Type / for formatting",
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

  it("shows slash command menu when user types /", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Heading 1")).toBeInTheDocument();
    expect(screen.getByText("Bold")).toBeInTheDocument();
  });

  it("hides slash command menu when user deletes the slash", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Heading 1")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "", selectionStart: 0 } });
    fireEvent.select(textarea);
    expect(screen.queryByText("Heading 1")).not.toBeInTheDocument();
  });

  it("applies format when user selects a command from the menu", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    const heading1 = screen.getByText("Heading 1");
    fireEvent.click(heading1);

    expect(textarea).toHaveValue("# ");
  });

  it("applies format when user presses Enter with menu open", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Heading 1")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Enter" });
    expect(textarea).toHaveValue("# ");
  });

  it("navigates menu with arrow keys and applies with Enter", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });

    fireEvent.keyDown(document, { key: "ArrowDown" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(textarea).toHaveValue("## ");
  });

  it("grows textarea height as content gains lines", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
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
      "Type text here... Type / for formatting",
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
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, {
      target: { value: "send via shortcut", selectionStart: 17 },
    });
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });
    expect(onSend).toHaveBeenCalledWith(
      expect.objectContaining({ text: "send via shortcut" }),
    );
  });

  it("does not apply slash command when document receives Ctrl+Enter", () => {
    renderWithProviders(<Chatinput onSend={() => {}} />, { auth: true });
    const textarea = screen.getByPlaceholderText(
      "Type text here... Type / for formatting",
    );
    fireEvent.change(textarea, { target: { value: "/", selectionStart: 1 } });
    expect(screen.getByText("Heading 1")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Enter", ctrlKey: true });
    expect(textarea).toHaveValue("/");
  });
});
