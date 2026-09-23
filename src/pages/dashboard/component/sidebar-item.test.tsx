import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SideBarItem from "./sidebar-item";

describe("SideBarItem", () => {
  it("renders emoji in the icon column when emoji is set", () => {
    render(
      <MemoryRouter>
        <SideBarItem emoji="📝" title="Drop a feedback" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Drop a feedback")).toBeInTheDocument();
    expect(screen.getByText("📝")).toBeInTheDocument();
  });

  it("uses semantic colors for active navigation", () => {
    render(
      <MemoryRouter>
        <SideBarItem title="Overview" active />
      </MemoryRouter>,
    );

    const label = screen.getByText("Overview");
    expect(label).toHaveClass("text-foreground");
    expect(label.parentElement).toHaveClass("bg-accent", "border-border");
  });
});
