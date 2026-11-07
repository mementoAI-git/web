import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ModalProvider } from "@/hooks/use-modal";
import { DASHBOARD_RIGHT_COLUMN_ID } from "./chat-settings-inline";
import SidebarDetails from "./sidebar-details";

vi.mock("@/components/modal/chat-settings/chat-preferences-panel", () => ({
  ChatPreferencesPanel: () => <div data-testid="preferences" />,
}));

const originalWidth = window.innerWidth;

function setWidth(width: number) {
  act(() => {
    window.innerWidth = width;
    window.dispatchEvent(new Event("resize"));
  });
}

function Panel({ isOpen = true, onClose = () => {} }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <MemoryRouter>
      <ModalProvider>
        <SidebarDetails isOpen={isOpen} onClose={onClose} includeChatPreferences desktopLayout="inline" />
      </ModalProvider>
    </MemoryRouter>
  );
}

describe("inline chat settings", () => {
  afterEach(() => setWidth(originalWidth));

  it("sits beside the chat on wide windows without blocking it", () => {
    setWidth(1440);
    render(<Panel />);
    expect(screen.getByRole("complementary", { name: "Chat settings" })).toBeInTheDocument();
    expect(screen.getByTestId("preferences")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fills the dashboard's right column, beside the header rather than below it", () => {
    setWidth(1440);
    const column = document.createElement("div");
    column.id = DASHBOARD_RIGHT_COLUMN_ID;
    document.body.append(column);
    render(<Panel />);
    expect(column).toContainElement(screen.getByRole("complementary", { name: "Chat settings" }));
    column.remove();
  });

  it("falls back to the drawer on narrower windows", () => {
    setWidth(1100);
    render(<Panel />);
    expect(screen.getByRole("dialog", { name: "Chat settings" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("switches layout when the window crosses the width, staying open", () => {
    setWidth(1440);
    render(<Panel />);
    setWidth(1000);
    expect(screen.getByRole("dialog", { name: "Chat settings" })).toBeInTheDocument();
    setWidth(1440);
    expect(screen.getByRole("complementary", { name: "Chat settings" })).toBeInTheDocument();
  });

  it("closes from its button and with Escape", async () => {
    setWidth(1440);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Panel onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Close chat settings" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("moves focus in on open and hands it back on close", async () => {
    setWidth(1440);
    const { rerender } = render(<><button>Trigger</button><Panel isOpen={false} /></>);
    screen.getByRole("button", { name: "Trigger" }).focus();
    rerender(<><button>Trigger</button><Panel isOpen /></>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Close chat settings" })).toHaveFocus());
    rerender(<><button>Trigger</button><Panel isOpen={false} /></>);
    await waitFor(() => expect(screen.getByRole("button", { name: "Trigger" })).toHaveFocus());
  });
});
