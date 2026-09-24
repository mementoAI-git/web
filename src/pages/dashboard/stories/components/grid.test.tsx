import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import type { IMemory, IPagination } from "@/utility/interface";
import StoriesGrid from "./grid";
import {
  TEXT_ONLY_CARD_SURFACES,
  getTextCardSurfaceClass,
} from "./grid-helpers";

const isIntersecting = vi.hoisted(() => ({ value: true }));
const renderedBodyLines = vi.hoisted(() => ({ value: 0 }));

vi.mock("@/hooks/use-intersection-observer", () => ({
  default: () => isIntersecting.value,
}));

const memory = {
  _id: "memory-1",
  title: "First memory",
  body: "A memory preview",
  user: "user-1",
  attachments: [],
  tags: [],
  type: "story",
  status: "published",
  level: 0,
  refrence: "",
  last_opened: "2026-09-23T00:00:00.000Z",
  created_at: "2026-09-23T00:00:00.000Z",
  updated_at: "2026-09-23T00:00:00.000Z",
} satisfies IMemory;

function pagination(hasNextPage: boolean): IPagination<IMemory> {
  return {
    docs: [memory],
    hasNextPage,
    hasPrevPage: false,
    limit: 20,
    nextPage: hasNextPage ? 2 : null,
    page: 1,
    pagingCounter: 1,
    prevPage: null,
    totalDocs: hasNextPage ? 40 : 1,
    totalPages: hasNextPage ? 2 : 1,
  };
}

describe("StoriesGrid", () => {
  beforeEach(() => {
    renderedBodyLines.value = 0;
    vi.spyOn(document, "createRange").mockReturnValue({
      selectNodeContents: vi.fn(),
      getClientRects: () =>
        Array.from({ length: renderedBodyLines.value }, (_, index) => ({
          top: index * 24,
          width: 120,
          height: 20,
        })),
    } as unknown as Range);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the load sentinel mounted during the initial request", () => {
    const { container } = renderWithProviders(
      <StoriesGrid
        {...({
          data: undefined,
          hasMore: false,
          isLoadingMore: true,
          onLoadMore: vi.fn(),
        } as React.ComponentProps<typeof StoriesGrid>)}
      />,
      { route: "/stories", auth: true },
    );

    expect(
      container.querySelector('[data-slot="stories-grid-load-more"]'),
    ).toBeInTheDocument();
  });

  it("loads the next page when the end sentinel enters view", () => {
    const onLoadMore = vi.fn();

    renderWithProviders(
      <StoriesGrid
        {...({
          data: pagination(true),
          hasMore: true,
          isLoadingMore: false,
          onLoadMore,
        } as React.ComponentProps<typeof StoriesGrid>)}
      />,
      { route: "/stories", auth: true },
    );

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("shows the end marker when every page has loaded", () => {
    renderWithProviders(
      <StoriesGrid
        {...({
          data: pagination(false),
          hasMore: false,
          isLoadingMore: false,
          onLoadMore: vi.fn(),
        } as React.ComponentProps<typeof StoriesGrid>)}
      />,
      { route: "/stories", auth: true },
    );

    expect(screen.getByText("End of items")).toBeVisible();
  });

  it("keeps media-card hover chrome minimal and shows the attachment count", () => {
    const multiMediaMemory: IMemory = {
      ...memory,
      attachments: Array.from({ length: 3 }, (_, index) => ({
        _id: `attachment-${index + 1}`,
        name: `photo-${index + 1}.jpg`,
        size: 1024,
        type: "image/jpeg",
        url: `/photo-${index + 1}.jpg`,
      })),
    };
    const data = {
      ...pagination(false),
      docs: [multiMediaMemory],
    };
    const { container } = renderWithProviders(<StoriesGrid data={data} />, {
      route: "/stories",
      auth: true,
    });

    expect(screen.getByText("1/3")).toBeVisible();
    expect(screen.queryByText("Open story")).not.toBeInTheDocument();

    const overlay = container.querySelector(
      '[data-slot="story-hover-overlay"]',
    );
    expect(overlay).toHaveClass("bg-black/20");
    expect(overlay).not.toHaveClass("bg-gradient-to-t");

    expect(
      container.querySelector('[data-slot="story-card-menu"]'),
    ).not.toHaveClass("shadow-lg");

    const captionRow = container.querySelector(
      '[data-slot="story-card-caption"]',
    );
    const caption = captionRow?.querySelector("p");
    const menu = captionRow?.querySelector('[data-slot="story-card-menu"]');
    const menuTrigger = screen.getByRole("button", { name: "Story actions" });

    expect(captionRow).toHaveClass("gap-8");
    expect(caption).toHaveClass("min-w-0", "flex-1", "truncate", "text-left");
    expect(menu).toBeInTheDocument();
    expect(menuTrigger).toHaveAttribute("data-variant", "ghost");
    expect(menuTrigger.querySelector(".lucide-ellipsis")).toBeInTheDocument();
  });

  it("shows text-only card body before tags without the AI summary", () => {
    const textMemory: IMemory = {
      ...memory,
      summary: "An AI-generated summary that should stay out of the preview.",
      topics: ["Family", "Tradition"],
    };
    const data = {
      ...pagination(false),
      docs: [textMemory],
    };
    renderWithProviders(<StoriesGrid data={data} />, {
      route: "/stories",
      auth: true,
    });

    const body = screen.getByText("A memory preview");
    const firstTag = screen.getByText("#Family");

    expect(
      screen.queryByText(/AI-generated summary that should stay out/),
    ).not.toBeInTheDocument();
    expect(
      body.compareDocumentPosition(firstTag) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("uses a 3:4 frame when the rendered body reaches five lines", () => {
    renderedBodyLines.value = 5;
    const { container } = renderWithProviders(
      <StoriesGrid data={pagination(false)} />,
      { route: "/stories", auth: true },
    );

    expect(
      container.querySelector('[data-slot="story-text-card"]'),
    ).toHaveClass("aspect-[3/4]");
  });

  it("keeps a text card compact when only its title pushes the card past five lines", () => {
    renderedBodyLines.value = 4;
    const data = {
      ...pagination(false),
      docs: [
        {
          ...memory,
          title:
            "A deliberately long title that wraps repeatedly without affecting body line measurement",
        },
      ],
    };
    const { container } = renderWithProviders(<StoriesGrid data={data} />, {
      route: "/stories",
      auth: true,
    });

    expect(
      container.querySelector('[data-slot="story-text-card"]'),
    ).not.toHaveClass("aspect-[3/4]");
  });

  it("uses the four approved light and dark text-card surfaces", () => {
    expect(TEXT_ONLY_CARD_SURFACES).toEqual([
      "bg-[#F7A21A]/20 dark:bg-[#F7A21A]/20",
      "bg-[#1A80F7]/20 dark:bg-[#1A80F7]/20",
      "bg-[#C7F71A]/20 dark:bg-[#C7F71A]/20",
      "bg-[#0F0700]/[0.04] dark:bg-[#FFFFFF]/[0.06]",
    ]);
  });

  it("uses the theme-aware weaker stroke on text-only cards", () => {
    const { container } = renderWithProviders(
      <StoriesGrid data={pagination(false)} />,
      { route: "/stories", auth: true },
    );

    expect(
      container.querySelector('[data-slot="story-text-card"]'),
    ).toHaveClass("border-stroke-neutral-weaker");
  });

  it("keeps a story's text-card surface stable", () => {
    expect(getTextCardSurfaceClass(memory, memory.title)).toBe(
      getTextCardSurfaceClass(memory, memory.title),
    );
  });
});
