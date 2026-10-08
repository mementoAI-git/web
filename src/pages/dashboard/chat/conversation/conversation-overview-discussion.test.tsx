import { screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "@/test";
import { ConversationChromeProvider } from "@/contexts/conversation-chrome";
import Conversation from "./index";
const send = vi.hoisted(() => vi.fn());
vi.mock("swr/mutation", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-fetcher", () => ({ default: () => ({ trigger: send, isMutating: false }) }));
vi.mock("@/hooks/use-intersection-observer", () => ({ default: () => false }));
vi.mock("@/components/memory/sidebar-details", () => ({ default: () => null }));
vi.mock("@/features/enrichment", () => ({ useEnrichmentStats: () => ({ stats: null, deltaToday: 0 }) }));
Object.defineProperty(HTMLElement.prototype, "scrollTo", { value: vi.fn(), writable: true });
function LocationState() { const location = useLocation(); return <output data-testid="state">{JSON.stringify(location.state)}</output>; }
beforeEach(() => send.mockReset());
it("starts a discussion from the full overview draft once, and consumes the navigation state", async () => {
  const text = "An entire reflection.\n\nAnother paragraph.";
  renderWithProviders(<ConversationChromeProvider><Conversation id="new" /><LocationState /></ConversationChromeProvider>, {
    auth: true, routerProps: { initialEntries: [{ pathname: "/chat/new", state: { overviewDiscussion: text, keep: true } }] },
  });
  await waitFor(() => expect(send).toHaveBeenCalledOnce());
  expect(send).toHaveBeenCalledWith({ text });
  expect(screen.getByTestId("state")).toHaveTextContent('{"keep":true}');
  expect(await screen.findByText("An entire reflection.", { exact: false })).toBeInTheDocument();
});
