import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InlineVoiceSession } from "./inline-voice-session";

const subscription = vi.hoisted(() => ({
  loading: false,
  pro: true,
  secondsLeft: undefined as number | undefined,
}));
vi.mock("@/contexts/subscription", () => ({
  useSubscription: () => ({
    isLoading: subscription.loading,
    isProOrAbove: subscription.pro,
    summary: { tier: subscription.pro ? "pro" : "free", status: "active", usage: { voice_seconds_left: subscription.secondsLeft } },
  }),
}));
vi.mock("@/features/pricing/pricing-overlay", () => ({
  PricingOverlay: ({ title }: { title: string }) => <div data-testid="pricing">{title}</div>,
}));
vi.mock("./Voiceinput", () => ({ default: ({ inline, autoStart, memoryId }: { inline: boolean; autoStart: boolean; memoryId: string }) => <div data-testid="voice-session" data-inline={inline} data-start={autoStart} data-memory={memoryId} /> }));
beforeEach(() => {
  subscription.loading = false;
  subscription.pro = true;
  subscription.secondsLeft = undefined;
});

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
  it("lets a free member with minutes left continue from a modal", () => {
    subscription.pro = false;
    subscription.secondsLeft = 45 * 60;
    render(<InlineVoiceSession onEnd={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("You have 45 of your 90 free minutes left this month.");
    expect(screen.queryByTestId("voice-session")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByTestId("voice-session")).toBeInTheDocument();
  });
  it("opens the plans when a free member chooses to upgrade", () => {
    subscription.pro = false;
    subscription.secondsLeft = 45 * 60;
    render(<InlineVoiceSession onEnd={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }));
    expect(screen.getByTestId("pricing")).toHaveTextContent("Talk without a limit");
  });
  it("goes straight to the upgrade flow when the month's free minutes are used", () => {
    subscription.pro = false;
    subscription.secondsLeft = 0;
    render(<InlineVoiceSession onEnd={vi.fn()} />);
    expect(screen.getByTestId("pricing")).toHaveTextContent("You’ve used this month’s free voice minutes");
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("voice-session")).not.toBeInTheDocument();
  });
});
