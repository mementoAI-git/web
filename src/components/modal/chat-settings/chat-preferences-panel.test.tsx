import { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConversationChromeProvider, useConversationChrome } from "@/contexts/conversation-chrome";
import { ChatPreferencesPanel } from "./chat-preferences-panel";

vi.mock("./background-music", () => ({ default: () => <div data-testid="bgm" /> }));
vi.mock("./voices", () => ({ default: () => <div data-testid="voices" /> }));
vi.mock("./upgrade-plan", () => ({ default: () => <div data-testid="upgrade" /> }));
vi.mock("./enrichment-summary", () => ({ EnrichmentSummary: ({ onOpenFiles }: { onOpenFiles?: (value: unknown) => void }) => <section><h2>My Enrichment score</h2><h3>Deep dive insights</h3><button onClick={() => onOpenFiles?.({ tab: "links" })}>Open links</button></section> }));

describe("ChatPreferencesPanel", () => {
  it("fills available width and height for compact sidebar usage", () => {
    const { container } = render(
      <ChatPreferencesPanel density="compact" className="min-h-0 flex-1 pb-4" />,
    );
    const root = container.firstElementChild;
    expect(root?.className).toContain("w-full");
    expect(root?.className).toContain("h-full");
  });

  it("forwards the conversation files callback", async () => {
    const onOpenConversationFiles = vi.fn();
    render(<ChatPreferencesPanel onOpenConversationFiles={onOpenConversationFiles} />);
    await userEvent.click(screen.getByRole("button", { name: "Open links" }));
    expect(onOpenConversationFiles).toHaveBeenCalledWith({ tab: "links" });
  });

  it("renders settings sections in the Figma order", () => {
    render(<ChatPreferencesPanel density="compact" />);
    const enrichment = screen.getByRole("heading", { name: /my enrichment score/i });
    const insights = screen.getByRole("heading", { name: /deep dive insights/i });
    const voices = screen.getByTestId("voices");
    const ambience = screen.getByTestId("bgm");
    expect(enrichment.compareDocumentPosition(insights) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(insights.compareDocumentPosition(voices) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(voices.compareDocumentPosition(ambience) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId("upgrade")).not.toBeInTheDocument();
  });

  it("offers voice narration as a toggle in a conversation", async () => {
    const onToggle = vi.fn();
    const SetChrome = () => {
      const { setChrome } = useConversationChrome();
      useEffect(() => setChrome({ memory: null, spokenReplies: { enabled: false, supported: true, onToggle } }), [setChrome]);
      return null;
    };
    render(<ConversationChromeProvider><SetChrome /><ChatPreferencesPanel /></ConversationChromeProvider>);
    await userEvent.click(await screen.findByRole("switch", { name: "Voice narration" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("groups narration and voices under AI Voice, with lines either side", async () => {
    const SetChrome = () => {
      const { setChrome } = useConversationChrome();
      useEffect(() => setChrome({ memory: null, spokenReplies: { enabled: false, supported: true, onToggle: () => {} } }), [setChrome]);
      return null;
    };
    const { container } = render(<ConversationChromeProvider><SetChrome /><ChatPreferencesPanel /></ConversationChromeProvider>);
    const narration = await screen.findByRole("heading", { level: 3, name: "Voice narration" });
    const section = screen.getByRole("heading", { level: 2, name: "AI Voice" }).parentElement as HTMLElement;
    expect(section).toContainElement(narration);
    expect(section).toContainElement(screen.getByTestId("voices"));
    expect(container.querySelectorAll('[data-slot="separator"]')).toHaveLength(2);
    expect(section.previousElementSibling).toHaveAttribute("data-slot", "separator");
    expect(section.nextElementSibling).toHaveAttribute("data-slot", "separator");
  });

  it("puts the voice settings in a card, with the section header outside it", () => {
    render(<ChatPreferencesPanel />);
    const card = screen.getByTestId("ai-voice-card");
    expect(card).toHaveClass("rounded-[12px]", "bg-fill-neutral-weaker", "p-3");
    expect(card).toContainElement(screen.getByTestId("voices"));
    expect(card).not.toContainElement(
      screen.getByRole("heading", { name: "AI Voice" }),
    );
  });

  it("leaves narration out where there is no conversation", () => {
    render(<ChatPreferencesPanel />);
    expect(screen.queryByRole("switch", { name: "Voice narration" })).not.toBeInTheDocument();
  });
});
