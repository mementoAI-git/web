import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import {
  DashboardHeaderActionsProvider,
  useDashboardHeaderActions,
} from "@/contexts/dashboard-header-actions";
import StoriesPage from "./index";

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();

  return {
    ...actual,
    default: (key: string | null) => ({
      data: key?.includes("/memories/stats")
        ? {
            data: {
              stories_count: 12,
              media_count: 7,
              bookmark_count: 3,
              storage: "1.2/5GB",
              stories_bookmarked_count: 3,
              stories_deleted_count: 1,
            },
          }
        : { data: [] },
      isLoading: false,
    }),
  };
});

describe("StoriesPage", () => {
  it("uses 16px horizontal padding for the memories workspace", () => {
    const { container } = renderWithProviders(<StoriesPage />, {
      route: "/stories",
      auth: true,
    });

    const workspace = container.querySelector(
      '[data-slot="stories-workspace"]',
    );
    const viewport = workspace?.parentElement;

    expect(workspace).toHaveClass("px-4");
    expect(workspace).toHaveClass("min-h-0", "overflow-y-auto");
    expect(workspace).not.toHaveClass("sm:px-6", "lg:px-8");
    expect(viewport).toHaveClass("overflow-hidden");
    expect(viewport).toHaveClass("max-w-[1900px]!");
  });

  it("keeps memory statistics permanently visible without collapse controls", () => {
    const { container } = renderWithProviders(<StoriesPage />, {
      route: "/stories",
      auth: true,
    });

    expect(screen.queryByText("At a glance")).not.toBeInTheDocument();
    expect(screen.getByText("Total Memories")).toBeVisible();
    expect(
      container.querySelector('[data-slot="memory-statistics"]'),
    ).toHaveAttribute("aria-label", "Memory statistics");
    expect(
      screen.queryByRole("button", { name: /memory statistics/i }),
    ).not.toBeInTheDocument();
  });

  it("uses 24px from statistics to filters and 16px from filters to results", () => {
    const { container } = renderWithProviders(<StoriesPage />, {
      route: "/stories",
      auth: true,
    });

    expect(
      container.querySelector('[data-slot="stories-filter-region"]'),
    ).toHaveClass("mt-6");
    expect(
      container.querySelector('[data-slot="stories-results"]'),
    ).toHaveClass("mt-4");
  });

  it("places memory filters below the at-a-glance cards", () => {
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });

    const finalStatCard = screen.getByText("Storage");
    const filters = screen.getByRole("tablist", { name: "Filter memories" });

    expect(
      finalStatCard.compareDocumentPosition(filters) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("promotes creation actions to the desktop navigation immediately", async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    function ActionsState() {
      const { actions } = useDashboardHeaderActions();
      return <output>{actions.showStoriesActions ? "shown" : "hidden"}</output>;
    }

    renderWithProviders(
      <DashboardHeaderActionsProvider>
        <StoriesPage />
        <ActionsState />
      </DashboardHeaderActionsProvider>,
      { route: "/stories", auth: true },
    );

    expect(await screen.findByText("shown")).toBeInTheDocument();
  });
});
