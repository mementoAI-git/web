import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { default as WelcomeSection } from "./welcome-section";
import {
  getGreetingPunctuation,
  shouldUseBrightWelcomeIcon,
} from "./welcome-section-helpers";

describe("WelcomeSection", () => {
  it("renders View insights button", () => {
    renderWithProviders(<WelcomeSection />, { route: "/overview", auth: true });
    expect(screen.getByRole("button", { name: /view insights/i })).toBeInTheDocument();
  });

  it("renders the section without crashing", () => {
    const { container } = renderWithProviders(<WelcomeSection />, { route: "/overview", auth: true });
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
