import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SideBarItem from "./sidebar-item";
import { SidebarMenu, SidebarProvider } from "@/components/ui/sidebar";

function TestSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarMenu>{children}</SidebarMenu>
    </SidebarProvider>
  );
}

describe("SideBarItem", () => {
  it("renders emoji in the icon column when emoji is set", () => {
    render(
      <MemoryRouter>
        <TestSidebar>
          <SideBarItem emoji="📝" title="Drop a feedback" />
        </TestSidebar>
      </MemoryRouter>,
    );

    expect(screen.getByText("Drop a feedback")).toBeInTheDocument();
    expect(screen.getByText("📝")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drop a feedback" })).not.toHaveAttribute(
      "data-active",
    );
  });

  it("uses semantic colors for active navigation", () => {
    render(
      <MemoryRouter>
        <TestSidebar>
          <SideBarItem title="Overview" active />
        </TestSidebar>
      </MemoryRouter>,
    );

    const label = screen.getByText("Overview");
    expect(label.closest("button")).toHaveAttribute("data-active", "true");
  });
});
