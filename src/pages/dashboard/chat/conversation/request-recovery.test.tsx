import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders, server } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import Conversation from "./index";
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), writable: true, configurable: true });
});
vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));
vi.mock("@/features/enrichment", () => ({ useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }) }));
vi.mock("@/components/memory/sidebar-details", () => ({ default: () => null }));
const historyState = vi.hoisted(() => ({ setMessages: null as null | ((update: (messages: { text?: string }[]) => { text?: string }[]) => void) }));
vi.mock("./history", () => ({ default: ({ messages, setMessages }: { messages: { text?: string }[]; setMessages: typeof historyState.setMessages }) => {
  historyState.setMessages = setMessages;
  return <div>Loaded message history{messages.map(message => <span key={message.text}>{message.text}</span>)}</div>;
} }));

it("does not expose an empty composer when conversation details fail and recovers on retry", async () => {
  let unavailable = true;
  server.use(http.get("http://localhost:3000/api/memories/recovery-chat", () => unavailable
    ? HttpResponse.json({ message: "Internal server error" }, { status: 500 })
    : HttpResponse.json({ data: { _id: "recovery-chat", title: "Recovered conversation", tags: [], attachments: [] } })));
  const user = userEvent.setup();
  renderWithProviders(<SWRConfig value={{ shouldRetryOnError: false }}><ConversationChromeProvider><Conversation id="recovery-chat" /></ConversationChromeProvider></SWRConfig>, { auth: true, route: "/chat/recovery-chat" });
  const retry = await screen.findByRole("button", { name: "Retry loading conversation" });
  expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
  expect(screen.queryByText("Loaded message history")).not.toBeInTheDocument();
  expect(document.querySelector('[contenteditable="true"]')).toBeNull();
  unavailable = false;
  await user.click(retry);
  expect(await screen.findByText("Loaded message history")).toBeVisible();
});
