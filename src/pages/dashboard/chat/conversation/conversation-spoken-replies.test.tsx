import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider, useConversationChrome } from "@/contexts/conversation-chrome";
import Conversation from "./index";

const send = vi.hoisted(() => vi.fn());
const speak = vi.hoisted(() => vi.fn());
vi.mock("@/features/speech/spoken-audio", async importOriginal => ({
  ...await importOriginal<typeof import("@/features/speech/spoken-audio")>(), requestSpokenAudio: speak,
}));
vi.mock("swr/mutation", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));
vi.mock("@/components/memory/sidebar-details", () => ({ default: () => null }));
vi.mock("@/features/enrichment", () => ({ useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }) }));
vi.mock("@/components/Chatinput", () => ({ ConversationChatinput: ({ onSend }: { onSend: (payload: { text: string; attachments: [] }) => void }) => <button onClick={() => onSend({ text: "My memory", attachments: [] })}>Send test message</button> }));

function AudioControl() {
  const { chrome } = useConversationChrome();
  return <button data-memory={chrome?.memory?._id} aria-pressed={chrome?.spokenReplies?.enabled ?? false} onClick={chrome?.spokenReplies?.onToggle}>Read aloud</button>;
}
beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { response: "A completed AI reply.", memory_id: "host-chat" } });
  speak.mockReset();
  speak.mockResolvedValue({ audioBase64: "YXVkaW8=", mimeType: "audio/wav", voiceName: "Fenrir" });
  vi.stubGlobal("Audio", class { play = vi.fn().mockResolvedValue(undefined); pause = vi.fn(); removeAttribute = vi.fn(); });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:spoken");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), writable: true });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("reads the completed AI response when the conversation volume toggle is enabled", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ConversationChromeProvider><AudioControl /><Conversation id="new" /></ConversationChromeProvider>, { route: "/chat/new", auth: true });
  await user.click(screen.getByRole("button", { name: "Read aloud" }));
  expect(screen.getByRole("button", { name: "Read aloud" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Send test message" }));
  await waitFor(() => expect(speak).toHaveBeenCalledOnce());
  expect(speak.mock.calls[0][0]).toBe("A completed AI reply.");
});

it("keeps text responses silent with the volume toggle off", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ConversationChromeProvider><AudioControl /><Conversation id="new" /></ConversationChromeProvider>, { route: "/chat/new", auth: true });
  await user.click(screen.getByRole("button", { name: "Send test message" }));
  // Markdown can replace its paragraph during a conversation rerender.
  // Query and assert together so we check the currently mounted reply.
  await waitFor(() => {
    expect(screen.getByText("A completed AI reply.")).toBeInTheDocument();
  });
  expect(speak).not.toHaveBeenCalled();
});

it("starts narration from the first streamed sentence before the response completes", async () => {
  server.use(http.get("http://localhost:3000/api/memories/speech-chat", () => HttpResponse.json({data: {_id: "speech-chat", title: "Chat", tags: [], attachments: []}})));
  let finish!: () => void;
  let emit!: (text: string) => void;
  send.mockImplementation((payload) => {
    if (typeof payload?.onChunk !== "function") return Promise.resolve({data: {docs: [], hasNextPage: false}});
    emit = payload.onChunk;
    return new Promise<void>((resolve) => {finish = resolve;});
  });
  const user = userEvent.setup();
  const {unmount} = renderWithProviders(<ConversationChromeProvider><AudioControl /><Conversation id="speech-chat" /></ConversationChromeProvider>, {route: "/chat/speech-chat", auth: true});
  await waitFor(() => expect(screen.getByRole("button", {name: "Read aloud"})).toHaveAttribute("data-memory", "speech-chat"));
  await user.click(screen.getByRole("button", {name: "Read aloud"}));
  await user.click(await screen.findByRole("button", {name: "Send test message"}));
  await waitFor(() => expect(emit).toBeTypeOf("function"));
  await act(async () => emit("The first sentence is ready."));
  expect(speak).not.toHaveBeenCalled();
  await act(async () => emit(" "));
  await act(async () => emit("An unfinished tail"));
  await waitFor(() => expect(speak).toHaveBeenCalledOnce());
  expect(speak.mock.calls[0][0]).toBe("The first sentence is ready.");
  await act(async () => finish());
  await waitFor(() => expect(speak).toHaveBeenCalledTimes(2));
  expect(speak.mock.calls[1][0]).toBe("An unfinished tail");
  unmount();
});
