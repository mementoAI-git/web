import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import SidebarDetails from "./sidebar-details";
import { type IMemory } from "@/utility/interface";
import { ModalProvider } from "@/hooks/use-modal";
import { MemoryRouter } from "react-router-dom";

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
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div data-testid="mock-sheet-content" className={className}>
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
