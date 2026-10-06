import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InlineVoiceSession } from "./inline-voice-session";

const subscription = vi.hoisted(() => ({ loading: false, allowed: true }));
vi.mock("@/contexts/subscription", () => ({ useSubscription: () => ({ isLoading: subscription.loading, canAccess: () => subscription.allowed }) }));
vi.mock("@/features/pricing/upgrade-prompt", () => ({ UpgradePrompt: () => <div>Upgrade for voice</div> }));
vi.mock("./Voiceinput", () => ({ default: ({ inline, autoStart, memoryId }: { inline: boolean; autoStart: boolean; memoryId: string }) => <div data-testid="voice-session" data-inline={inline} data-start={autoStart} data-memory={memoryId} /> }));
beforeEach(() => { subscription.loading = false; subscription.allowed = true; });

describe("InlineVoiceSession", () => {
  it("starts inline with the supplied conversation context", () => {
    render(<InlineVoiceSession memoryId="thread-1" onEnd={vi.fn()} />);
    expect(screen.getByTestId("voice-session")).toHaveAttribute("data-inline", "true");
    expect(screen.getByTestId("voice-session")).toHaveAttribute("data-start", "true");
    expect(screen.getByTestId("voice-session")).toHaveAttribute("data-memory", "thread-1");
  });
  it("does not start audio before subscription checks complete", () => {
    subscription.loading = true;
    render(<InlineVoiceSession onEnd={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByTestId("voice-session")).not.toBeInTheDocument();
  });
  it("shows the existing upgrade prompt without starting audio for an ineligible account", () => {
    subscription.allowed = false;
    render(<InlineVoiceSession onEnd={vi.fn()} />);
    expect(screen.getByText("Upgrade for voice")).toBeInTheDocument();
    expect(screen.queryByTestId("voice-session")).not.toBeInTheDocument();
  });
});
