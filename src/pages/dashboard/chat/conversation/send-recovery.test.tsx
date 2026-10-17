import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders, server } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import Conversation from "./index";
const send = vi.hoisted(() => vi.fn());
vi.mock("swr/mutation", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-spoken-replies", () => ({ useSpokenReplies: () => ({ stop: vi.fn(), speak: vi.fn() }) }));
vi.mock("@/components/memory/sidebar-details", () => ({ default: () => null }));
vi.mock("@/features/enrichment", () => ({ useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }) }));
vi.mock("@/components/Chatinput", () => ({ ConversationChatinput: ({ onSend }: { onSend: (payload: unknown) => void }) => <button onClick={() => onSend({ text: "", attachments: [{ _id: "file-1", name: "photo" }] })}>Send attachment</button> }));
vi.mock("./history", () => ({ default: ({ messages, onRetryFailedMessage, children }: { messages: { text?: string; role?: string; sendFailed?: boolean }[]; onRetryFailedMessage: () => void; children: React.ReactNode }) => <div>{messages.filter((m) => m.role === "user").map((m, i) => <div key={i} data-testid="user-message">{m.text}{m.sendFailed && <button onClick={onRetryFailedMessage}>Retry message</button>}</div>)}{children}</div> }));
beforeEach(() => { send.mockReset(); Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), configurable: true }); server.use(http.get("http://localhost:3000/api/memories/send-chat", () => HttpResponse.json({ data: { _id: "send-chat", title: "Chat", tags: [], attachments: [] } }))); });
const view = (id = "send-chat") => <ConversationChromeProvider><Conversation id={id} /></ConversationChromeProvider>;
it("sends attachments without text and keeps retry available after repeated failures", async () => {
  send.mockRejectedValue(new Error("Offline"));
  renderWithProviders(view(), { auth: true });
  await userEvent.click(await screen.findByRole("button", { name: "Send attachment" }));
  await userEvent.click(await screen.findByRole("button", { name: "Retry message" }));
  await screen.findByRole("button", { name: "Retry message" });
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0][0]).toMatchObject({ text: "", attachments: ["file-1"] });
  expect(screen.getAllByTestId("user-message")).toHaveLength(1);
});
it("blocks simultaneous sends and aborts the stream on unmount", async () => {
  let resolve!: () => void;
  send.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
  const { unmount } = renderWithProviders(view(), { auth: true });
  await userEvent.dblClick(await screen.findByRole("button", { name: "Send attachment" }));
  expect(send).toHaveBeenCalledOnce();
  const request = send.mock.calls[0][0];
  unmount();
  expect(request.signal.aborted).toBe(true);
  await act(async () => { request.onChunk("Late reply"); resolve(); });
});
it("includes attachments when creating the first Host Chat", async () => {
  send.mockResolvedValue({ data: { response: "A reply", memory_id: "created" } });
  renderWithProviders(view("new"), { auth: true });
  await userEvent.click(screen.getByRole("button", { name: "Send attachment" }));
  await waitFor(() => expect(send).toHaveBeenCalledWith({ text: "", attachments: ["file-1"] }));
});

it("keeps partial assistant text when a stream disconnects", async () => {
  send.mockImplementation(async (payload) => {
    payload.onChunk("A partially received response");
    throw new Error("Stream disconnected");
  });
  renderWithProviders(view(), { auth: true });
  await userEvent.click(await screen.findByRole("button", { name: "Send attachment" }));
  await screen.findByRole("button", { name: "Retry message" });
  await waitFor(() => expect(screen.getByText("A partially received response")).toBeInTheDocument());
});
