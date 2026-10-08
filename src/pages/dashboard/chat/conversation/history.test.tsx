import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import History from "./history";
import type { IMemory } from "@/utility/interface";

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
  default: () => null,
}));

vi.mock("@/hooks/use-fetcher", () => ({
  default: () => ({
    trigger: vi.fn().mockResolvedValue({ data: { messages: [], next: null } }),
    isMutating: false,
  }),
}));

vi.mock("@/hooks/use-intersection-observer", () => ({
  default: () => false,
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
    if (typeof HTMLElement.prototype.scrollTo !== "function") {
      HTMLElement.prototype.scrollTo = vi.fn();
    }
  });

  it("hides inline go-back and conversation header on /chat/:id (top nav handles chrome)", async () => {
    renderHistoryAt("/chat/m1");
    await waitFor(() => {
      expect(screen.queryByTestId("go-back")).toBeNull();
      expect(screen.queryByTestId("conversation-header")).toBeNull();
    });
    expect(
      document.querySelector(".min-w-0.space-y-6.px-0"),
    ).toBeTruthy();
  });

  it("shows the topic header on a question route without regular conversation chrome", async () => {
    renderHistoryAt("/chat/reply/r1");
    await waitFor(() => {
      expect(screen.getByTestId("topic-header")).toBeInTheDocument();
      expect(screen.queryByTestId("go-back")).not.toBeInTheDocument();
      expect(screen.queryByTestId("conversation-header")).not.toBeInTheDocument();
    });
    expect(document.querySelector(".space-y-2.px-4")).toBeTruthy();
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
