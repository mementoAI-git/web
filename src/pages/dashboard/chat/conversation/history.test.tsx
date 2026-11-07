import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useRef, useState } from "react";
import { vi } from "vitest";
import History from "./history";
import type { IMemory, IMessage } from "@/utility/interface";

const historyState = vi.hoisted(() => ({ fetch: vi.fn(), toastError: vi.fn(), intersecting: false }));
vi.mock("sonner", () => ({ toast: { error: historyState.toastError, dismiss: vi.fn() } }));

vi.mock("@/components/go-back", () => ({
  default: () => <div data-testid="go-back">Back</div>,
}));

vi.mock("./header", () => ({
  default: () => <div data-testid="conversation-header">Header</div>,
}));
vi.mock("./topic-header", () => ({
  default: () => <div data-testid="topic-header">Topic</div>,
}));

vi.mock("./bubble", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({
    trigger: historyState.fetch,
    isMutating: false,
  }),
}));

vi.mock("@/hooks/use-intersection-observer", () => ({
  default: () => historyState.intersecting,
}));

const memory: IMemory = {
  _id: "m1",
  title: "Test",
} as IMemory;

function renderHistoryAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <History
              memory={memory}
              messages={[]}
              setMessages={() => {}}
              scrollContainerRef={{ current: null }}
              onViewDetails={() => {}}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("History", () => {
  beforeEach(() => {
    historyState.fetch.mockReset().mockResolvedValue({ data: { messages: [], next: null } });
    historyState.toastError.mockClear();
    historyState.intersecting = false;
    if (typeof HTMLElement.prototype.scrollTo !== "function") {
      HTMLElement.prototype.scrollTo = vi.fn();
    }
  });

  it("shows retry and a toast on history failure without retrying in a loop", async () => {
    historyState.fetch.mockRejectedValueOnce(new Error("Internal server error"));
    renderHistoryAt("/chat/m1");
    const retry = await screen.findByRole("button", { name: "Retry loading messages" });
    expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
    expect(historyState.fetch).toHaveBeenCalledTimes(1);
    expect(historyState.toastError).toHaveBeenCalledTimes(1);
    fireEvent.click(retry);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Retry loading messages" })).not.toBeInTheDocument());
    expect(historyState.fetch).toHaveBeenCalledTimes(2);
  });

  it("ignores a request that finishes after leaving a conversation", async () => {
    let finish!: (value: unknown) => void;
    historyState.fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const setMessages = vi.fn();
    const { unmount } = render(<MemoryRouter><History memory={memory} messages={[]} setMessages={setMessages} scrollContainerRef={{ current: null }} onViewDetails={() => {}} /></MemoryRouter>);
    unmount();
    finish({ data: { messages: [{ _id: "old", text: "Old conversation" }], next: null } });
    await Promise.resolve();
    expect(setMessages).not.toHaveBeenCalled();
  });

  it("preserves loaded messages when an older page fails and avoids duplicates on retry", async () => {
    historyState.intersecting = true;
    historyState.fetch
      .mockResolvedValueOnce({ data: { messages: [{ _id: "latest", text: "Loaded message" }], next: "older" } })
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ data: { messages: [{ _id: "old", text: "Older message" }, { _id: "latest", text: "Loaded message" }], next: null } });
    function StatefulHistory() {
      const [messages, setMessages] = useState<Partial<IMessage>[]>([]);
      const scrollContainerRef = useRef<HTMLDivElement>(null);
      return <History memory={memory} messages={messages} setMessages={setMessages} scrollContainerRef={scrollContainerRef} onViewDetails={() => {}} />;
    }
    render(<MemoryRouter><StatefulHistory /></MemoryRouter>);
    const retry = await screen.findByRole("button", { name: "Retry loading messages" });
    expect(screen.getByText("Loaded message")).toBeVisible();
    expect(historyState.fetch).toHaveBeenCalledTimes(2);
    fireEvent.click(retry);
    expect(await screen.findByText("Older message")).toBeVisible();
    expect(screen.getAllByText("Loaded message")).toHaveLength(1);
    expect(historyState.fetch).toHaveBeenCalledTimes(3);
  });

  it("hides inline go-back and conversation header on /chat/:id (top nav handles chrome)", async () => {
    renderHistoryAt("/chat/m1");
    await waitFor(() => {
      expect(screen.queryByTestId("go-back")).toBeNull();
      expect(screen.queryByTestId("conversation-header")).toBeNull();
    });
    expect(
      document.querySelector(".min-w-0.space-y-1.px-0"),
    ).toBeTruthy();
  });

  it("shows the topic header on a question route without regular conversation chrome", async () => {
    renderHistoryAt("/chat/reply/r1");
    await waitFor(() => {
      expect(screen.getByTestId("topic-header")).toBeInTheDocument();
      expect(screen.queryByTestId("go-back")).not.toBeInTheDocument();
      expect(screen.queryByTestId("conversation-header")).not.toBeInTheDocument();
    });
    expect(document.querySelector(".space-y-1.px-4")).toBeTruthy();
  });
});


it("places voice start and end dividers in the conversation and keeps them when older messages load", () => {
  const lastMessage = { _id: "last", text: "Hello", role: "user" };
  const voiceEvents = [
    { id: "start", active: true, afterMessage: lastMessage },
    { id: "end", active: false, afterMessage: lastMessage },
  ];
  const view = (messages: typeof lastMessage[]) => <MemoryRouter><History memory={memory} messages={messages} voiceEvents={voiceEvents} setMessages={() => {}} scrollContainerRef={{ current: null }} onViewDetails={() => {}} /></MemoryRouter>;
  const { rerender } = render(view([lastMessage]));
  expect(screen.getAllByRole("separator").map(node => node.getAttribute("aria-label"))).toEqual(["Voice conversation started", "Voice conversation ended"]);
  rerender(view([{ _id: "older", text: "Earlier", role: "ai" }, lastMessage]));
  expect(screen.getAllByRole("separator")).toHaveLength(2);
});

it("uses the topic header when reopening a daily reflection and preserves its original answer", async () => {
  render(
    <MemoryRouter initialEntries={["/chat/reflection/m1"]}>
      <History
        memory={{
          ...memory,
          prompt_type: "ai-generated",
          prompt_text: "What brought you joy?",
          body: "<p>My original reflection.</p>",
        }}
        messages={[]}
        setMessages={() => {}}
        scrollContainerRef={{ current: null }}
        onViewDetails={() => {}}
      />
    </MemoryRouter>,
  );
  expect(screen.getByTestId("topic-header")).toBeInTheDocument();
  expect(screen.getByText("My original reflection.")).toBeVisible();
});
