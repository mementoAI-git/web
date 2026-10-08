import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider, useConversationChrome } from "@/contexts/conversation-chrome";
import Conversation from "./index";

const send = vi.hoisted(() => vi.fn());
const speak = vi.fn();
vi.mock("swr/mutation", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));
vi.mock("@/components/memory/sidebar-details", () => ({ default: () => null }));
vi.mock("@/features/enrichment", () => ({ useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }) }));
vi.mock("@/components/Chatinput", () => ({ ConversationChatinput: ({ onSend }: { onSend: (payload: { text: string; attachments: [] }) => void }) => <button onClick={() => onSend({ text: "My memory", attachments: [] })}>Send test message</button> }));

function AudioControl() {
  const { chrome } = useConversationChrome();
  return <button aria-pressed={chrome?.spokenReplies?.enabled ?? false} onClick={chrome?.spokenReplies?.onToggle}>Read aloud</button>;
}
beforeEach(() => {
  send.mockReset();
  send.mockResolvedValue({ data: { response: "A completed AI reply." } });
  speak.mockClear();
  vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn() });
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), writable: true });
});
afterEach(() => vi.unstubAllGlobals());

it("reads the completed AI response when the conversation volume toggle is enabled", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ConversationChromeProvider><AudioControl /><Conversation id="new" /></ConversationChromeProvider>, { route: "/chat/new", auth: true });
  await user.click(screen.getByRole("button", { name: "Read aloud" }));
  expect(screen.getByRole("button", { name: "Read aloud" })).toHaveAttribute("aria-pressed", "true");
  await user.click(screen.getByRole("button", { name: "Send test message" }));
  await waitFor(() => expect(speak).toHaveBeenCalledOnce());
  expect(speak.mock.calls[0][0].text).toBe("A completed AI reply.");
});

it("keeps text responses silent with the volume toggle off", async () => {
  const user = userEvent.setup();
  renderWithProviders(<ConversationChromeProvider><AudioControl /><Conversation id="new" /></ConversationChromeProvider>, { route: "/chat/new", auth: true });
  await user.click(screen.getByRole("button", { name: "Send test message" }));
  expect(await screen.findByText("A completed AI reply.")).toBeInTheDocument();
  expect(speak).not.toHaveBeenCalled();
});
