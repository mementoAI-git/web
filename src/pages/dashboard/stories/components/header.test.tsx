import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test";
import StoriesHeader, { StoriesFilters } from "./header";

const openModal = vi.fn();

vi.mock("@/hooks/use-modal", () => ({
  initialStates: { state: [] },
  ModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useModal: () => ({
    state: [],
    open: openModal,
    close: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("StoriesHeader", () => {
  it("renders a sticky semantic search trigger with the shared shortcut", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <StoriesHeader onChangeMode={vi.fn()} />,
      { route: "/stories", auth: true },
    );

    const search = screen.getByRole("button", { name: "Search memories" });
    expect(search).toHaveClass(
      "border-stroke-neutral-weak",
      "bg-fill-neutral-weak",
    );
    expect(search.closest('[data-slot="stories-sticky-search"]')).toHaveClass(
      "sticky",
      "top-4",
      "z-40",
      "pb-3",
      "before:-top-4",
      "before:h-4",
      "before:bg-background",
    );
    expect(search.closest('[data-slot="stories-sticky-search"]')).not.toHaveClass(
      "z-20",
    );
    const shortcut = search.querySelector(
      '[data-slot="search-command-shortcut"]',
    );
    expect(shortcut).toBeInTheDocument();
    expect(shortcut?.querySelectorAll("kbd")).toHaveLength(2);

    await user.click(search);

    expect(openModal).toHaveBeenCalledWith("search-memory");
  });

  it("uses pill-shaped mode toggle items (100px radius) so spacing=0 does not square corners", () => {
    renderWithProviders(
      <StoriesHeader onChangeMode={vi.fn()} />,
      { route: "/stories", auth: true },
    );

    const gridToggle = screen.getByRole("radio", { name: "Grid view" });
    const listToggle = screen.getByRole("radio", { name: "List view" });

    expect(gridToggle).toHaveClass(
      "rounded-[100px]",
      "text-icon-neutral-weak",
      "data-[state=on]:bg-fill-neutral-weak",
      "data-[state=on]:text-icon-neutral-strong",
    );
    expect(listToggle).toHaveClass(
      "rounded-[100px]",
      "text-icon-neutral-weak",
      "data-[state=on]:bg-fill-neutral-weak",
      "data-[state=on]:text-icon-neutral-strong",
    );
  });

  it("uses shadcn line tabs without a full-width border and sends filter changes", async () => {
    const user = userEvent.setup();
    const onChangeFilter = vi.fn();
    renderWithProviders(
      <StoriesFilters
        filter="all"
        onChangeFilter={onChangeFilter}
        count={3}
        bookmarkedCount={2}
        deletedCount={1}
      />,
      { route: "/stories", auth: true },
    );

    const tabList = screen.getByRole("tablist", { name: "Filter memories" });
    expect(tabList).toHaveAttribute("data-slot", "tabs-list");
    expect(tabList).not.toHaveClass("border-b");

    const activeTab = screen.getByRole("tab", { name: "All 3" });
    expect(activeTab).toHaveAttribute("data-active");
    expect(activeTab).not.toHaveAttribute("data-state");
    expect(activeTab).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(activeTab).toHaveStyle({ color: "var(--text-neutral-strong)" });
    expect(activeTab).toHaveClass(
      "data-active:after:opacity-100",
      "after:w-6",
    );
    expect(screen.getByRole("tab", { name: "Bookmarked 2" })).toHaveStyle({
      color: "var(--text-neutral-weak)",
    });

    await user.click(screen.getByRole("tab", { name: "Bookmarked 2" }));

    expect(onChangeFilter).toHaveBeenCalledWith("bookmarked");
  });
});
