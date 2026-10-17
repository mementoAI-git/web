import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Routes, Route, useLocation } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { streamlineFetcher } from "@/api/fetcher";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import HostChatEntry from "./main";
import ChatPage from "./index";

// Keep the routed page, composer, history and SWR hooks real. Only hold the network stream.
vi.mock("@/api/fetcher", async original => ({ ...await original<typeof import("@/api/fetcher")>(), streamlineFetcher: vi.fn() }));
vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));
vi.mock("@/features/enrichment", () => ({ useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }) }));

it("leaves and returns to the same Host Chat, ignores the old stream and reloads saved history", async () => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), configurable: true });
  let saved = false;
  server.use(
    http.get("http://localhost:3000/api/users/profile", () => HttpResponse.json({ data: { primary_conversation_id: "host-chat" } })),
    http.get("http://localhost:3000/api/memories/host-chat", () => HttpResponse.json({ data: { _id: "host-chat", title: "Host chat", tags: [], attachments: [] } })),
    http.get("http://localhost:3000/api/ai/prompt/messages/host-chat", () => HttpResponse.json({ data: { messages: saved ? [
      { _id: "user-1", role: "user", text: "Remember this moment", created_at: "2026-10-16T10:00:00Z" },
      { _id: "reply-1", role: "ai", text: "Saved server reply", created_at: "2026-10-16T10:00:01Z" },
    ] : [], next: null } })),
  );
  let finish!: () => void;
  vi.mocked(streamlineFetcher).mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  renderWithProviders(<ConversationChromeProvider>
    <Link to="/overview">Overview</Link><Link to="/chat">Chat</Link>
    <Routes>
      <Route path="/chat" element={<HostChatEntry />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="/overview" element={<p>Overview screen</p>} />
    </Routes>
  </ConversationChromeProvider>, { auth: true, route: "/chat/host-chat" });
  const editor = await screen.findByPlaceholderText("Type text here...");
  await userEvent.type(editor, "Remember this moment");
  await userEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await waitFor(() => expect(streamlineFetcher).toHaveBeenCalledOnce());
  const request = vi.mocked(streamlineFetcher).mock.calls[0][1].arg;
  await userEvent.click(screen.getByRole("link", { name: "Overview", exact: true }));
  expect(request.signal.aborted).toBe(true);
  saved = true;
  await act(async () => { request.onChunk("Late stale reply"); finish(); });
  expect(screen.queryByText("Late stale reply")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: "Chat", exact: true }));
  expect(await screen.findByText("Saved server reply")).toBeVisible();
  expect(screen.getAllByText("Remember this moment")).toHaveLength(1);
  expect(screen.queryByText("Late stale reply")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Stop", exact: true })).not.toBeInTheDocument();
});


it("keeps the first message recoverable when the server omits the Host Chat ID", async () => {
  server.use(http.post("http://localhost:3000/api/ai/conversation/new", () => HttpResponse.json({ success: true, data: { response: "Incomplete response" } })));
  function Location() { return <output data-testid="path">{useLocation().pathname}</output>; }
  renderWithProviders(<ConversationChromeProvider><Location /><Routes><Route path="/chat/:id" element={<ChatPage />} /></Routes></ConversationChromeProvider>, { auth: true, route: "/chat/new" });
  await userEvent.type(await screen.findByPlaceholderText("Type text here..."), "My first thought");
  await userEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await screen.findByRole("button", { name: /Retry/i });
  expect(screen.getByTestId("path")).toHaveTextContent("/chat/new");
  expect(screen.getAllByText("My first thought")).toHaveLength(1);
});
