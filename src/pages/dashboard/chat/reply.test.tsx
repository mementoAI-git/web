import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { server } from "@/test/mocks/server";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import ReplyPage from "./reply";

const send = vi.hoisted(() => vi.fn());
vi.mock("swr/mutation", () => ({
  default: () => ({ trigger: send, isMutating: false }),
}));
vi.mock("@/features/enrichment", () => ({
  useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }),
}));
vi.mock("@/components/memory/sidebar-details", () => ({ default: () => null }));
vi.mock("./conversation/history", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: vi.fn() });
});

const draftKey = "memento-chat-draft:topic-memory";
afterEach(() => {
  localStorage.removeItem(draftKey);
  send.mockReset();
});

it("uses the standard chat composer on the reply route and sends its restored draft to the topic conversation", async () => {
  server.use(
    http.get("http://localhost:3000/api/memories/prompt/:id", () =>
      HttpResponse.json({
        data: {
          _id: "topic-memory",
          title: "What makes your friends special?",
        },
      }),
    ),
  );
  localStorage.setItem(draftKey, "A memory of my friends");
  const user = userEvent.setup();
  renderWithProviders(
    <ConversationChromeProvider>
      <Routes>
        <Route path="/chat/reply/:id" element={<ReplyPage />} />
      </Routes>
    </ConversationChromeProvider>,
    { auth: true, route: "/chat/reply/question-1" },
  );

  const input = await screen.findByPlaceholderText(
    "Type text here...",
  );
  expect(input).toHaveValue("A memory of my friends");
  expect(screen.getByTestId("chat-composer-surface")).toHaveClass(
    "rounded-3xl",
    "bg-fill-neutral-weak",
  );
  expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() =>
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "A memory of my friends",
        memory: "topic-memory",
        attachments: [],
      }),
    ),
  );
  expect(input).toHaveValue("");
  expect(localStorage.getItem(draftKey)).toBeNull();
  expect(
    screen.getByRole("button", { name: "Dictate a message" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Voice call" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Send" }),
  ).not.toBeInTheDocument();
});
