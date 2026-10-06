import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useModal } from "@/hooks/use-modal";
import { renderWithProviders } from "@/test";
import { default as WelcomeSection } from "./welcome-section";
import {
  getGreetingPunctuation,
  shouldUseBrightWelcomeIcon,
} from "./welcome-section-helpers";

vi.mock("@/components/Chatinput/inline-voice-session", () => ({
  InlineVoiceSession: ({ onEnd }: { onEnd: () => void }) => <section aria-label="Inline voice"><button onClick={onEnd}>End call</button></section>,
}));

describe("WelcomeSection", () => {
  it("starts voice inside the banner and restores actions when the call ends", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<WelcomeSection />, { route: "/overview", auth: true });
    await user.click(screen.getByRole("button", { name: "Voice conversation" }));
    const voice = await screen.findByRole("region", { name: "Inline voice" });
    expect(container.contains(voice)).toBe(true);
    expect(screen.queryByText("What’s on your mind today?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add story" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "End call" }));
    expect(screen.getByRole("button", { name: "Voice conversation" })).toBeInTheDocument();
    expect(screen.getByText("What’s on your mind today?")).toBeInTheDocument();
  });

  it("replaces the secondary actions with a voice-mode entry link", () => {
    renderWithProviders(<WelcomeSection />, { route: "/overview", auth: true });
    expect(
      screen.getByRole("button", { name: "Voice conversation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^add story$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /quick add/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^chat$/i }),
    ).not.toBeInTheDocument();
  });

  it("opens story creation from the banner", async () => {
    function ModalState() {
      const { state } = useModal();
      return <output data-testid="modal-state">{state[0]?.name}</output>;
    }
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <WelcomeSection />
        <ModalState />
      </>,
      { route: "/overview", auth: true },
    );
    await user.click(screen.getByRole("button", { name: /^add story$/i }));
    expect(screen.getByTestId("modal-state")).toHaveTextContent(
      "create-memory",
    );
    expect(screen.queryByText("Enrichment score")).not.toBeInTheDocument();
  });

  it("renders the section without crashing", () => {
    const { container } = renderWithProviders(<WelcomeSection />, {
      route: "/overview",
      auth: true,
    });
    expect(container.firstChild).toBeTruthy();
  });

  it("does not render the telemetry cards", () => {
    renderWithProviders(<WelcomeSection />, { route: "/overview", auth: true });

    expect(screen.queryByText("All Memories")).not.toBeInTheDocument();
    expect(screen.queryByText("Beneficiaries")).not.toBeInTheDocument();
    expect(screen.queryByText("Time Capsules")).not.toBeInTheDocument();
    expect(screen.queryByText("Streak Count")).not.toBeInTheDocument();
  });
});

describe("shouldUseBrightWelcomeIcon", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses bright icon from 6:00 local through 16:59", () => {
    vi.setSystemTime(new Date("2026-03-27T06:00:00"));
    expect(shouldUseBrightWelcomeIcon()).toBe(true);
    vi.setSystemTime(new Date("2026-03-27T12:00:00"));
    expect(shouldUseBrightWelcomeIcon()).toBe(true);
    vi.setSystemTime(new Date("2026-03-27T16:59:00"));
    expect(shouldUseBrightWelcomeIcon()).toBe(true);
  });

  it("uses moonface from 17:00 through 5:59", () => {
    vi.setSystemTime(new Date("2026-03-27T17:00:00"));
    expect(shouldUseBrightWelcomeIcon()).toBe(false);
    vi.setSystemTime(new Date("2026-03-27T23:00:00"));
    expect(shouldUseBrightWelcomeIcon()).toBe(false);
    vi.setSystemTime(new Date("2026-03-28T05:59:00"));
    expect(shouldUseBrightWelcomeIcon()).toBe(false);
  });
});

describe("getGreetingPunctuation", () => {
  it("returns '?' for question-style greetings", () => {
    expect(getGreetingPunctuation("Back at it,")).toBe("?");
    expect(getGreetingPunctuation("Can't sleep,")).toBe("?");
    expect(getGreetingPunctuation("Burning the midnight oil,")).toBe("?");
    expect(getGreetingPunctuation("Keeping a late night,")).toBe("?");
    expect(getGreetingPunctuation("Late night session,")).toBe("?");
    expect(getGreetingPunctuation("Still going,")).toBe("?");
  });

  it("returns '.' for statement-style greetings", () => {
    expect(getGreetingPunctuation("Good morning,")).toBe(".");
    expect(getGreetingPunctuation("Rise and shine,")).toBe(".");
    expect(getGreetingPunctuation("Good evening,")).toBe(".");
    expect(getGreetingPunctuation("Night owl mode,")).toBe(".");
  });
});
