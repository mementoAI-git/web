import { render, screen } from "@testing-library/react";
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

describe("SidebarDetails", () => {
  it("caps detail content at 249px width", () => {
    renderSidebar();
    const label = screen.getAllByText("properties")[0];
    const panel = label.closest('[class*="max-w-[249px]"]');
    expect(panel).toBeTruthy();
  });

  it("uses 249px width on desktop when open", () => {
    const { container } = renderSidebar({ isOpen: true });
    const desktopPanel = container.querySelector('[class*="w-[249px]"]');
    expect(desktopPanel).toBeTruthy();
  });
});
