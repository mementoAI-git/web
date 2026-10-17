import { useState, type ReactNode } from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { IMemory } from "@/utility/interface";
import { SearchMemoriesV2 } from "./search-modal-v2";

import { toast } from "sonner";
vi.mock("sonner", () => ({ toast: { error: vi.fn(() => "search-error"), dismiss: vi.fn() } }));

const closeModal = vi.fn();
afterEach(() => vi.useRealTimers());
const swrControl = vi.hoisted(() => ({
  isLoading: false,
  isValidating: false,
  isEmpty: false,
  error: undefined as Error | undefined,
  preparing: false,
  limited: false,
  mode: "hybrid",
  key: null as unknown,
  mutate: vi.fn(),
}));

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
  default: (
    key: unknown,
    _fetcher: unknown,
    options?: { keepPreviousData?: boolean },
  ) => {
    swrControl.key = key;
    return {
      data:
        swrControl.isLoading && !options?.keepPreviousData
          ? undefined
          : {
              data: {
                docs: swrControl.isEmpty ? [] : [matchingMemory],
                search: {
                  mode: swrControl.mode,
                  preparing: swrControl.preparing,
                  limited: swrControl.limited,
                },
              },
            },
      isLoading: swrControl.isLoading,
      isValidating: swrControl.isValidating,
      error: swrControl.error,
      mutate: swrControl.mutate,
    };
  },
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
  it("focuses the command input on open and restores its opener after Escape", async () => {
    function ControlledSearch() {
      const [open, setOpen] = useState(false);
      closeModal.mockImplementation(() => setOpen(false));
      return (
        <MemoryRouter>
          <button onClick={() => setOpen(true)}>Open search</button>
          <SearchMemoriesV2 open={open} />
        </MemoryRouter>
      );
    }
    render(<ControlledSearch />);
    const trigger = screen.getByRole("button", { name: "Open search" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(
      screen.getByRole("combobox", { name: "Search memories" }),
    ).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
    await act(async () => {});
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    closeModal.mockReset();
  });

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
    swrControl.isValidating = false;
    swrControl.isEmpty = false;
    swrControl.error = undefined;
    swrControl.preparing = false;
    swrControl.limited = false;
    swrControl.mode = "hybrid";
    swrControl.mutate.mockReset().mockResolvedValue(undefined);
    vi.mocked(toast.error).mockClear();
    vi.useRealTimers();
  });

  it("uses a shadcn command menu for memory navigation", async () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelector('[data-slot="command"]'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("combobox", { name: "Search memories" }),
    ).not.toHaveLength(0);
  });

  it("uses the solid neutral surface token across the desktop search surface", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelector('[data-slot="memory-search-panel"]'),
    ).toHaveClass("bg-bg-neutral-solid");
    expect(document.body.querySelector('[data-slot="command"]')).toHaveClass(
      "bg-bg-neutral-solid",
    );
    expect(document.body.querySelector(".bg-white")).not.toBeInTheDocument();
  });

  it("uses the solid neutral surface token across the mobile search surface", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 isMobile />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelector('[data-slot="sheet-container"]'),
    ).toHaveClass("bg-bg-neutral-solid");
    expect(
      document.body.querySelector('[data-slot="sheet-header"]'),
    ).toHaveClass("bg-bg-neutral-solid");
    expect(
      document.body.querySelector('[data-slot="sheet-content"]'),
    ).toHaveClass("bg-bg-neutral-solid");
    expect(document.body.querySelector('[data-slot="command"]')).toHaveClass(
      "bg-bg-neutral-solid",
    );
    expect(document.body.querySelector(".bg-white")).not.toBeInTheDocument();
  });

  it("mounts only the command menu for the active viewport", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelectorAll('[data-slot="command"]'),
    ).toHaveLength(1);
  });

  it("keeps a fixed responsive desktop shell while result counts change", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelector('[data-slot="memory-search-panel"]'),
    ).toHaveClass(
      "h-[min(520px,calc(100dvh-3rem))]",
      "w-[min(640px,calc(100vw-3rem))]",
    );
    expect(
      document.body.querySelector('[data-slot="command-list"]'),
    ).toHaveClass("min-h-0", "h-full");
  });

  it("renders an accessible dialog with its own backdrop", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    const panel = document.body.querySelector(
      '[data-slot="memory-search-panel"]',
    );

    expect(panel).toHaveAttribute("role", "dialog");
    expect(screen.getByRole("dialog", { name: "Search memories" })).toBe(panel);
    expect(
      document.querySelector(".memory-search-overlay"),
    ).toBeInTheDocument();
  });

  it("uses 12px result spacing and an 8px search-field radius", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelector('[data-slot="command-group"]'),
    ).toHaveClass("[&_[cmdk-group-items]]:gap-3");
    expect(
      document.body.querySelector('[data-slot="input-group"]'),
    ).toHaveClass("rounded-[8px]");
  });

  it("keeps result rows transparent until hover or keyboard selection", () => {
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const item = document.body.querySelector('[data-slot="command-item"]');

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
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );

    expect(
      document.body.querySelector('[data-slot="memory-search-header"]'),
    ).toHaveClass("px-3", "[&_[data-slot=command-input-wrapper]]:p-0");
    expect(
      document.body.querySelector('[data-slot="command-list"]'),
    ).toHaveClass("px-3");
  });

  it("keeps the same panel shell when a search has no results", async () => {
    vi.useFakeTimers();
    swrControl.isEmpty = true;
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const panel = document.body.querySelector(
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
    render(
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

    const item = document.body.querySelector(
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

  it("does not allow selecting stale results while a different query loads", async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const command = document.body.querySelector(
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
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No memories found")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("uses the description-search endpoint with an account-scoped cache", async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    const input = screen.getByRole("combobox", { name: "Search memories" });
    expect(input).toHaveAttribute("maxlength", "200");
    fireEvent.change(input, { target: { value: "our first home" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(swrControl.key).toEqual([
      "/memories/search?q=our%20first%20home",
      "reader@example.com",
    ]);
    vi.useRealTimers();
  });

  it("explains preparation and keyword fallback without claiming no memories exist", async () => {
    vi.useFakeTimers();
    swrControl.preparing = true;
    swrControl.mode = "keyword";
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "home" },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      screen.getByText(/Some memories are still being prepared/),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("explains when some sources can only be searched by words", async () => {
    vi.useFakeTimers();
    swrControl.limited = true;
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "home" },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      screen.getByText(
        "Some memories can only be searched by their words right now.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a retryable search error instead of an empty result", async () => {
    vi.useFakeTimers();
    swrControl.error = new Error("offline");
    render(
      <MemoryRouter>
        <SearchMemoriesV2 />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "home" },
    });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(screen.getByText("The City in the Sea")).toBeVisible();
    expect(screen.queryByText("No memories found")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry search" }));
    expect(swrControl.mutate).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

it("morphs from the header search trigger's bounds", async () => {
  function ControlledSearch() {
    const [open, setOpen] = useState(false);
    closeModal.mockImplementation(() => setOpen(false));
    return (
      <MemoryRouter>
        <button data-search-trigger onClick={() => setOpen(true)}>
          Header search
        </button>
        <SearchMemoriesV2 open={open} />
      </MemoryRouter>
    );
  }
  render(<ControlledSearch />);
  const trigger = screen.getByRole("button", { name: "Header search" });
  vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
    x: 800,
    y: 24,
    left: 800,
    top: 24,
    right: 1072,
    bottom: 60,
    width: 272,
    height: 36,
    toJSON: () => ({}),
  });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveAttribute("data-morph", "true");
  expect(dialog.style.getPropertyValue("--search-morph-x")).not.toBe("");
  expect(trigger).toHaveAttribute("data-search-morphing", "true");
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
  await waitFor(() =>
    expect(trigger).not.toHaveAttribute("data-search-morphing"),
  );
  expect(trigger).toHaveFocus();
});
