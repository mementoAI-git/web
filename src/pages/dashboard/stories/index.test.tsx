import userEvent from "@testing-library/user-event";
import { act, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import {
  DashboardHeaderActionsProvider,
  useDashboardHeaderActions,
} from "@/contexts/dashboard-header-actions";
import StoriesPage from "./index";
import { storageKeys } from "@/utility/constant";

const state = vi.hoisted(() => ({
  docs: [] as unknown[],
  loading: false,
  error: undefined as Error | undefined,
  missingData: false,
  retry: vi.fn().mockResolvedValue(undefined),
  toastError: vi.fn(),
  open: vi.fn(),
  totalPages: 1,
  keys: [] as string[],
  emptyPage: null as number | null,
  refresh: () => {},
  gridHasNext: false,
  gridSize: 1,
  refreshGrid: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({ toast: { error: state.toastError, dismiss: vi.fn() } }));

vi.mock("swr/infinite", () => ({
  default: () => ({
    data: state.missingData ? undefined : [{ data: { docs: state.docs, page: 1, totalPages: 1, hasNextPage: state.gridHasNext } }],
    error: state.error,
    isLoading: state.loading,
    size: state.gridSize,
    setSize: vi.fn(),
    mutate: state.refreshGrid,
  }),
}));

vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));

vi.mock("@/hooks/use-modal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/use-modal")>();
  return { ...actual, useModal: () => ({ open: state.open }) };
});
vi.mock("@/contexts/subscription", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/subscription")>();
  return { ...actual, useSubscription: () => ({ summary: { tier: "free" }, isProOrAbove: false, usage: { storage_used_bytes: 0, storage_limit_bytes: 200 * 1024 ** 2 } }) };
});

vi.mock("swr", async (importOriginal) => {
  const actual = await importOriginal<typeof import("swr")>();
  const React = await import("react");

  return {
    ...actual,
    default: function useMockSWR(key: string | null) {
      const [, refresh] = React.useReducer((value) => value + 1, 0);
      if (key?.includes("/memories/stories")) state.refresh = refresh;
      if (key?.includes("/memories/stories")) state.keys.push(key);
      const page = Number(new URLSearchParams(key?.split("?")[1]).get("page") || 1);
      return ({
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
        : key?.includes("/memories/stories")
          ? state.missingData ? undefined : { data: { docs: page === state.emptyPage ? [] : state.docs, page, totalPages: state.totalPages, totalDocs: state.docs.length, hasNextPage: page < state.totalPages, nextPage: page + 1, hasPrevPage: page > 1, prevPage: page - 1 } }
          : { data: [] },
      error: key?.includes("/memories/stories") ? state.error : undefined,
      mutate: state.retry,
      isLoading: state.loading,
    }); },
  };
});

describe("StoriesPage", () => {
  beforeEach(() => {
    state.docs = [];
    state.error = undefined;
    state.missingData = false;
    state.gridHasNext = false;
    state.gridSize = 1;
    state.retry.mockClear();
    state.toastError.mockClear();
    state.loading = false;
    state.totalPages = 1;
    state.keys = [];
    state.emptyPage = null;
    state.open.mockReset();
    localStorage.setItem(storageKeys.listmode, "list");
  });

  it.each(["list", "grid"])("offers retry instead of an empty state after a failed %s first load", async (mode) => {
    localStorage.setItem(storageKeys.listmode, mode);
    state.error = new Error("Internal server error");
    state.missingData = true;
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    expect(screen.queryByText("No stories yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="stories-results"]')).toHaveAttribute("aria-busy", "false");
    await user.click(screen.getByRole("button", { name: "Retry loading stories" }));
    expect(mode === "grid" ? state.refreshGrid : state.retry).toHaveBeenCalled();
  });

  it("keeps cached stories visible and toasts once per failure episode", async () => {
    state.docs = [{ _id: "story-1", title: "My cached story", tags: [], attachments: [], created_at: "2026-10-07" }];
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    state.error = new Error("offline");
    act(() => state.refresh());
    expect(screen.getAllByText("My cached story").length).toBeGreaterThan(0);
    expect(state.toastError).toHaveBeenCalledTimes(1);
    state.error = new Error("still offline");
    act(() => state.refresh());
    expect(state.toastError).toHaveBeenCalledTimes(1);
    const options = state.toastError.mock.calls[0][1];
    await act(() => options.action.onClick());
    expect(state.retry).toHaveBeenCalled();
    state.error = undefined;
    state.docs = [];
    act(() => state.refresh());
    expect(screen.getByText("No stories yet")).toBeVisible();
  });

  it("keeps grid cards and stops load-more feedback after a later page fails", () => {
    localStorage.setItem(storageKeys.listmode, "grid");
    state.docs = [{ _id: "story-1", title: "My cached story", body: "Keep this", tags: [], attachments: [], created_at: "2026-10-07" }];
    state.error = new Error("offline");
    state.gridSize = 2;
    state.gridHasNext = true;
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    expect(screen.getByRole("link", { name: /My cached story/ })).toBeVisible();
    expect(screen.queryByText("Loading more items when visible")).not.toBeInTheDocument();
    const loadMore = document.querySelector('[data-slot="stories-grid-load-more"]')!;
    expect(loadMore.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: "Retry loading stories" })).toBeVisible();
    expect(screen.queryByText("End of items")).not.toBeInTheDocument();
    expect(state.toastError).toHaveBeenCalledTimes(1);
  });

  it("resets list pagination when changing filters", async () => {
    state.docs = [{ _id: "story-1", title: "My story", tags: [], attachments: [], created_at: "2026-10-07" }];
    state.totalPages = 3;
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    await user.click(screen.getAllByRole("button", { name: "Next" })[0]);
    expect(state.keys.at(-1)).toContain("page=2");
    await user.click(screen.getByRole("tab", { name: "Bookmarked 3" }));
    expect(state.keys.at(-1)).toContain("page=1&bookmarked=true");
  });

  it("uses a bookmarked empty state with a way back to all stories", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    await user.click(screen.getByRole("tab", { name: "Bookmarked 3" }));
    expect(screen.getByRole("heading", { name: "No bookmarked stories" })).toBeVisible();
    const empty = screen.getByRole("heading", { name: "No bookmarked stories" }).closest('[data-slot="empty"]') as HTMLElement;
    expect(within(empty).queryByRole("button", { name: "Add memory" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View all stories" }));
    expect(screen.getByRole("tab", { name: "All 12" })).toHaveAttribute("aria-selected", "true");
  });

  it("recovers to the last available page when the current page becomes empty", async () => {
    state.docs = [{ _id: "story-1", title: "My story", tags: [], attachments: [], created_at: "2026-10-07" }];
    state.totalPages = 3;
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    await user.click(screen.getAllByRole("button", { name: "Next" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Next" })[0]);
    expect(state.keys.at(-1)).toContain("page=3");
    state.emptyPage = 3;
    state.totalPages = 2;
    act(() => state.refresh());
    expect(state.keys.at(-1)).toContain("page=2");
  });

  it("uses deleted-specific guidance in grid view", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    await user.click(screen.getByRole("radio", { name: "Grid view" }));
    await user.click(screen.getByRole("tab", { name: "Deleted 1" }));
    expect(screen.getByRole("heading", { name: "No deleted stories" })).toBeVisible();
    expect(screen.getByRole("button", { name: "View all stories" })).toBeInTheDocument();
    expect(screen.queryByText("No stories yet")).not.toBeInTheDocument();
  });

  it("replaces an empty table with a centered creation action and no table chrome", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    const empty = container.querySelector('[data-slot="empty"]') as HTMLElement;
    expect(within(empty).getByRole("heading", { name: "No stories yet" })).toBeVisible();
    expect(within(empty).getByText("🍄")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
    await user.click(within(empty).getByRole("button", { name: "Add memory" }));
    expect(state.open).toHaveBeenCalledWith("create-memory");
  });

  it("restores table headers and pagination when a filter returns memories", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    state.docs = [{ _id: "story-1", title: "My story", tags: [], attachments: [], created_at: "2026-10-07" }];
    await user.click(screen.getByRole("tab", { name: "Bookmarked 3" }));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /topic/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Next" }).length).toBeGreaterThan(0);
    expect(screen.queryByText("No stories yet")).not.toBeInTheDocument();
  });

  it("uses the same mushroom empty surface for grid and restores normal cards when results arrive", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    await user.click(screen.getByRole("radio", { name: "Grid view" }));
    const empty = container.querySelector('[data-slot="empty"]') as HTMLElement;
    expect(empty).toHaveClass("stories-list-surface", "stories-empty-surface");
    expect(within(empty).getByText("🍄")).toBeVisible();
    await user.click(within(empty).getByRole("button", { name: "Add memory" }));
    expect(state.open).toHaveBeenCalledWith("create-memory");

    state.docs = [{ _id: "story-1", title: "My story", body: "A first memory", tags: [], attachments: [], created_at: "2026-10-07" }];
    await user.click(screen.getByRole("tab", { name: "Bookmarked 3" }));
    expect(container.querySelector('[data-slot="empty"]')).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /My story/ })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="stories-grid-load-more"]')).toBeInTheDocument();
  });

  it("keeps loading placeholders rather than prematurely showing the empty state", () => {
    state.loading = true;
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("No stories yet")).not.toBeInTheDocument();
  });

  it("shows authoritative billing storage instead of the legacy stats allowance", () => {
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    expect(screen.getByText("0 B / 200 MB")).toBeInTheDocument();
    expect(screen.queryByText("1.2/5GB")).not.toBeInTheDocument();
  });
  it("keeps filter focus and the search trigger mounted when results change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    const search = screen.getByRole("button", { name: "Search memories" });
    const bookmarked = screen.getByRole("tab", { name: "Bookmarked 3" });
    await user.click(bookmarked);
    expect(bookmarked).toHaveAttribute("aria-selected", "true");
    expect(bookmarked).toHaveFocus();
    expect(screen.getByRole("button", { name: "Search memories" })).toBe(search);
    expect(document.querySelector('[data-slot="stories-results"]')).toHaveAttribute("aria-busy", "false");
  });

  it("opens the Bookmarked tab from ?filter=bookmarked, as voice links to it", () => {
    renderWithProviders(<StoriesPage />, { route: "/stories?filter=bookmarked", auth: true });
    expect(screen.getByRole("tab", { name: "Bookmarked 3" })).toHaveAttribute("aria-selected", "true");
  });

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

  it("hides memory statistics without collapse controls", () => {
    const { container } = renderWithProviders(<StoriesPage />, {
      route: "/stories",
      auth: true,
    });

    expect(screen.queryByText("At a glance")).not.toBeInTheDocument();
    expect(screen.getByText("Total Memories")).not.toBeVisible();
    expect(
      container.querySelector('[data-slot="memory-statistics"]'),
    ).toHaveAttribute("aria-label", "Memory statistics");
    expect(
      screen.queryByRole("button", { name: /memory statistics/i }),
    ).not.toBeInTheDocument();
  });

  it("removes the hidden statistics spacing and keeps 16px from filters to results", () => {
    const { container } = renderWithProviders(<StoriesPage />, {
      route: "/stories",
      auth: true,
    });

    expect(
      container.querySelector('[data-slot="stories-filter-region"]'),
    ).not.toHaveClass("mt-6");
    expect(
      container.querySelector('[data-slot="stories-results"]'),
    ).toHaveClass("mt-4");
  });

  it("keeps memory filters visible while statistics are hidden", () => {
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });

    const finalStatCard = screen.getByText("Storage");
    const filters = screen.getByRole("tablist", { name: "Filter memories" });

    expect(finalStatCard).not.toBeVisible();
    expect(filters).toBeVisible();

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
  it("refreshes the infinite grid after a memory lifecycle change", async () => {
    renderWithProviders(<StoriesPage />, { route: "/stories", auth: true });
    act(() => window.dispatchEvent(new Event("memento:memory-changed")));
    expect(state.refreshGrid).toHaveBeenCalled();
  });

});
