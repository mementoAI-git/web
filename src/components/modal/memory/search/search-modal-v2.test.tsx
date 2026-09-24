import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { IMemory } from "@/utility/interface";
import { SearchMemoriesV2 } from "./search-modal-v2";

const closeModal = vi.fn();
const swrControl = vi.hoisted(() => ({ isLoading: false, isEmpty: false }));

const matchingMemory = {
  _id: "memory-1",
  title: "The City in the Sea",
  body: "A sea-bound memory from a distant city.",
  attachments: [
    {
      _id: "file-1",
      name: "city.jpg",
      url: "https://example.com/city.jpg",
    },
  ],
  category: "travel",
  created_at: "2026-08-18T12:00:00.000Z",
} as IMemory;

vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({ close: closeModal }),
}));

vi.mock("@/hooks/use-store", () => ({
  useStore: () => ({ user: { email: "reader@example.com" } }),
}));

vi.mock("@/utility", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utility")>();
  return {
    ...actual,
    getRecentMemories: () => [matchingMemory],
  };
});

vi.mock("swr", () => ({
  default: (_key: string | null, options?: { keepPreviousData?: boolean }) => ({
    data:
      swrControl.isLoading && !options?.keepPreviousData
        ? undefined
        : { data: { docs: swrControl.isEmpty ? [] : [matchingMemory] } },
    isLoading: swrControl.isLoading,
    isValidating: swrControl.isLoading,
  }),
}));

vi.mock("react-modal-sheet", () => ({
  Sheet: Object.assign(
    ({ children }: { children: ReactNode }) => <div>{children}</div>,
    {
      Container: ({
        children,
        className,
      }: {
        children: ReactNode;
        className?: string;
      }) => (
        <div data-slot="sheet-container" className={className}>
          {children}
        </div>
      ),
      Header: ({ className }: { className?: string }) => (
        <div data-slot="sheet-header" className={className} />
      ),
      Content: ({
        children,
        className,
      }: {
        children: ReactNode;
        className?: string;
      }) => (
        <div data-slot="sheet-content" className={className}>
          {children}
        </div>
      ),
      Backdrop: () => null,
    },
  ),
}));

describe("SearchMemoriesV2", () => {
  beforeAll(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    swrControl.isLoading = false;
    swrControl.isEmpty = false;
    vi.useRealTimers();
  });

  it("uses a shadcn command menu for memory navigation", async () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('[data-slot="command"]'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("combobox", { name: "Search memories" }),
    ).not.toHaveLength(0);
  });

  it("uses the theme background token across the desktop search surface", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('[data-slot="memory-search-panel"]'),
    ).toHaveClass("bg-background");
    expect(container.querySelector('[data-slot="command"]')).toHaveClass(
      "bg-background",
    );
    expect(container.querySelector(".bg-white")).not.toBeInTheDocument();
  });

  it("uses the theme background token across the mobile search surface", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 isMobile />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-slot="sheet-container"]')).toHaveClass(
      "bg-background",
    );
    expect(container.querySelector('[data-slot="sheet-header"]')).toHaveClass(
      "bg-background",
    );
    expect(container.querySelector('[data-slot="sheet-content"]')).toHaveClass(
      "bg-background",
    );
    expect(container.querySelector('[data-slot="command"]')).toHaveClass(
      "bg-background",
    );
    expect(container.querySelector(".bg-white")).not.toBeInTheDocument();
  });

  it("mounts only the command menu for the active viewport", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(container.querySelectorAll('[data-slot="command"]')).toHaveLength(1);
  });

  it("keeps a fixed responsive desktop shell while result counts change", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('[data-slot="memory-search-panel"]'),
    ).toHaveClass(
      "h-[min(520px,calc(100dvh-3rem))]",
      "w-[min(640px,calc(100vw-3rem))]",
    );
    expect(container.querySelector('[data-slot="command-list"]')).toHaveClass(
      "min-h-0",
      "h-full",
    );
  });

  it("renders the desktop search panel directly inside its backdrop", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    const panel = container.querySelector('[data-slot="memory-search-panel"]');

    expect(panel?.parentElement).toHaveAttribute(
      "data-slot",
      "memory-search-backdrop",
    );
  });

  it("uses 12px result spacing and an 8px search-field radius", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(container.querySelector('[data-slot="command-group"]')).toHaveClass(
      "[&_[cmdk-group-items]]:gap-3",
    );
    expect(container.querySelector('[data-slot="input-group"]')).toHaveClass(
      "rounded-[8px]",
    );
  });

  it("keeps result rows transparent until hover or keyboard selection", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const item = container.querySelector('[data-slot="command-item"]');

    expect(item).toHaveClass(
      "rounded-lg",
      "px-3",
      "py-2",
      "hover:bg-muted",
      "data-[selected=true]:bg-muted",
    );
    expect(item).toHaveAttribute("data-selected", "false");
    expect(item).not.toHaveClass(
      "min-h-17",
      "rounded-xl",
      "py-2.5",
      "data-[selected=true]:bg-v3-fill-weak",
      "data-selected:bg-muted",
    );
  });

  it("aligns the search field edges with the result rows", () => {
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('[data-slot="memory-search-header"]'),
    ).toHaveClass(
      "px-3",
      "[&_[data-slot=command-input-wrapper]]:p-0",
    );
    expect(container.querySelector('[data-slot="command-list"]')).toHaveClass(
      "px-3",
    );
  });

  it("keeps the same panel shell when a search has no results", async () => {
    vi.useFakeTimers();
    swrControl.isEmpty = true;
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const panel = container.querySelector(
      '[data-slot="memory-search-panel"]',
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Search memories" }),
      { target: { value: "missing" } },
    );
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("No memories found")).toBeInTheDocument();
    expect(panel).toHaveClass(
      "h-[min(520px,calc(100dvh-3rem))]",
      "w-[min(640px,calc(100vw-3rem))]",
    );
    vi.useRealTimers();
  });

  it("renders matched title and preview text as highlighted command items", async () => {
    vi.useFakeTimers();
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    fireEvent.change(
      screen.getAllByRole("combobox", { name: "Search memories" })[0],
      { target: { value: "sea" } },
    );
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const item = container.querySelector(
      '[data-slot="command-item"]',
    ) as HTMLElement;
    const highlights = item.querySelectorAll("mark");

    expect(item).toBeInTheDocument();
    expect(highlights).toHaveLength(2);
    expect(highlights[0]).toHaveTextContent(/sea/i);
    expect(highlights[1]).toHaveTextContent(/sea/i);
    expect(item).toHaveTextContent("Aug 18, 2026");
    vi.useRealTimers();
  });

  it("keeps the current results visible while the next query loads", async () => {
    vi.useFakeTimers();
    const { container } = render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const command = container.querySelector(
      '[data-slot="command"]',
    ) as HTMLElement;
    const input = screen.getAllByRole("combobox", {
      name: "Search memories",
    })[0];

    fireEvent.change(input, { target: { value: "sea" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      command.querySelector('[data-slot="command-item"]'),
    ).toHaveTextContent("The City in the Sea");

    swrControl.isLoading = true;
    fireEvent.change(input, { target: { value: "city" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(
      command.querySelector('[data-slot="command-item"]'),
    ).toHaveTextContent("The City in the Sea");
    vi.useRealTimers();
  });
});
