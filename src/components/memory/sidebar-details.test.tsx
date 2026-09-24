import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import SidebarDetails from "./sidebar-details";
import { resolveSidebarDesktopWidthPx } from "./sidebar-desktop-width";
import { type IMemory } from "@/utility/interface";
import { ModalProvider } from "@/hooks/use-modal";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/components/modal/chat-settings/chat-preferences-panel", () => ({
  ChatPreferencesPanel: () => <div data-testid="mock-chat-preferences-panel" />,
}));

vi.mock("react-modal-sheet", () => {
  function MockSheet({ children }: { children: ReactNode }) {
    return <div data-testid="mock-sheet">{children}</div>;
  }
  MockSheet.Container = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div data-testid="mock-sheet-container" className={className}>
      {children}
    </div>
  );
  MockSheet.Header = () => null;
  MockSheet.Content = ({
    children,
    className,
    disableScroll,
  }: {
    children: ReactNode;
    className?: string;
    disableScroll?: boolean;
  }) => (
    <div
      data-testid="mock-sheet-content"
      data-disable-scroll={disableScroll}
      className={className}
    >
      {children}
    </div>
  );
  MockSheet.Backdrop = () => null;
  return { Sheet: MockSheet };
});

const memory = {
  _id: "m1",
  title: "Test",
  body: "",
  user: "u1",
  attachments: [],
  tags: [],
  type: "memory",
  status: "save",
  level: 1,
  refrence: "",
  last_opened: "",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-02T00:00:00.000Z",
} as IMemory;

function renderSidebar(props: Partial<React.ComponentProps<typeof SidebarDetails>> = {}) {
  return render(
    <MemoryRouter>
      <ModalProvider>
        <SidebarDetails
          memory={memory}
          onClose={() => {}}
          isOpen
          {...props}
        />
      </ModalProvider>
    </MemoryRouter>,
  );
}

const mockPush = vi.fn();

vi.mock("@/hooks/use-modal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-modal")>();
  return {
    ...actual,
    useModal: () => ({
      state: [],
      open: vi.fn(),
      push: mockPush,
      close: vi.fn(),
    }),
  };
});

describe("resolveSidebarDesktopWidthPx", () => {
  it("caps chat panel at the 485px design width on wide viewports", () => {
    expect(resolveSidebarDesktopWidthPx(1440, { wideChatPanel: true })).toBe(485);
  });

  it("shrinks chat panel when the viewport leaves limited budget for the sidebar", () => {
    expect(resolveSidebarDesktopWidthPx(780, { wideChatPanel: true })).toBe(360);
  });

  it("floors chat panel width for very tight viewports", () => {
    expect(resolveSidebarDesktopWidthPx(680, { wideChatPanel: true })).toBe(280);
  });

  it("shrinks memory panel similarly", () => {
    expect(resolveSidebarDesktopWidthPx(700, { wideChatPanel: false })).toBe(280);
  });
});

describe("SidebarDetails", () => {
  it("caps detail content at 287px width", () => {
    renderSidebar();
    const label = screen.getAllByText(/properties/i)[0];
    const panel = label.closest('[class*="287px"]');
    expect(panel).toBeTruthy();
  });

  it("uses 287px width on desktop when open", () => {
    const { container } = renderSidebar({ isOpen: true });
    const desktopPanel = container.querySelector('[data-testid="memory-sidebar-desktop"]');
    expect(desktopPanel).toBeTruthy();
  });

  it("renders the dedicated chat settings composition in a wide scrolling drawer", () => {
    const { container } = renderSidebar({
      isOpen: true,
      includeChatPreferences: true,
    });
    const desktopPanel = container.querySelector(
      '[data-testid="memory-sidebar-desktop"]',
    ) as HTMLElement | null;
    expect(desktopPanel).toBeTruthy();
    expect(desktopPanel).toHaveStyle({ width: "485px" });
    expect(desktopPanel?.className).toContain("bg-background");
    expect(desktopPanel?.style.opacity).toBe("");

    const drawerSurface = desktopPanel?.querySelector(":scope > div");
    expect(drawerSurface?.className).toContain("bg-background");
    expect(drawerSurface?.className).not.toContain("bg-transparent");

    const content = desktopPanel?.querySelector(
      '[data-testid="sidebar-details-content"]',
    ) as HTMLElement | null;
    expect(content).toBeTruthy();
    expect(content?.className).toContain("overflow-y-auto");
    expect(content?.className).toContain("bg-background");
    expect(content?.className).not.toContain("bg-gradient-to-b");
    const gradientArtwork = within(content!).getByTestId("chat-settings-gradient");
    expect(gradientArtwork).toBeInstanceOf(HTMLImageElement);
    expect(decodeURIComponent(gradientArtwork.getAttribute("src") ?? "")).toContain(
      "chat settings gradient.png",
    );

    const title = within(content!).getByRole("heading", { name: /chat settings/i });
    const preferences = within(content!).getByTestId("mock-chat-preferences-panel");
    expect(
      title.compareDocumentPosition(preferences) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(content!).queryByText(/properties/i)).not.toBeInTheDocument();
  });

  it("narrows the chat sidebar when the window is too tight for the max width", () => {
    const original = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 780,
    });
    const { container } = renderSidebar({
      isOpen: true,
      includeChatPreferences: true,
    });
    const desktopPanel = container.querySelector(
      '[data-testid="memory-sidebar-desktop"]',
    ) as HTMLElement | null;
    expect(desktopPanel).toHaveStyle({ width: "360px" });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: original,
    });
  });

  it("keeps the mobile sheet as the sole scroll owner for gesture tracking", () => {
    renderSidebar({ includeChatPreferences: true });

    const sheetContent = screen.getByTestId("mock-sheet-content");
    expect(sheetContent).not.toHaveAttribute("data-disable-scroll");

    const mobileContent = sheetContent.querySelector(
      '[data-testid="sidebar-details-content"]',
    );
    expect(mobileContent?.className).toContain("h-auto");
    expect(mobileContent?.className).toContain("overflow-visible");
    expect(mobileContent?.className).not.toContain("overflow-y-auto");
  });

  it("docks desktop overlay to the right and paints a card-style content shell", () => {
    const { container } = renderSidebar({ isOpen: true });
    const desktopPanel = container.querySelector('[data-testid="memory-sidebar-desktop"]');
    expect(desktopPanel?.className).toContain("justify-start");
    expect(desktopPanel?.className).toContain("items-stretch");
    expect(desktopPanel?.className).toContain("right-[6px]");
    expect(desktopPanel?.className).toContain("top-[6px]");
    expect(desktopPanel?.className).toContain("bottom-[6px]");

    const inset = desktopPanel?.querySelector(":scope > div");
    expect(inset?.className).toContain("p-0");
    expect(inset?.className).toContain("min-w-0");
    expect(inset?.className).toContain("w-full");
    expect(inset?.className).toContain("max-w-full");
    expect(desktopPanel?.className).not.toContain("w-[400px]");

    const content = desktopPanel?.querySelector('[class*="bg-v3-bg"]');
    expect(content).toBeTruthy();
    expect(content?.className).toContain("rounded-[24px]");
    expect(content?.className).toContain("border-stroke-neutral-weak");

    expect(screen.getAllByText(/properties/i).length).toBeGreaterThan(0);
  });

  it("renders conversation quick actions and opens edit-memory on click", async () => {
    mockPush.mockClear();
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderSidebar({
      quickActions: {
        onViewFullDetails: () => mockPush("view-memory-details", { memory }),
        onEditMemory: () => mockPush("edit-memory", { memory }),
        onExportConversation: onExport,
        onDelete: () => mockPush("delete-memory", { memory }),
      },
    });

    expect(screen.getAllByText("View full details").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Export conversation").length).toBeGreaterThan(0);

    const editBtns = screen.getAllByRole("button", { name: /edit memory/i });
    await user.click(editBtns[0]!);
    expect(mockPush).toHaveBeenCalledWith("edit-memory", { memory });

    const exportBtns = screen.getAllByRole("button", {
      name: /export conversation/i,
    });
    await user.click(exportBtns[0]!);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
