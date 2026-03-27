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

  it("shows Connect apps as disabled (not a link)", () => {
    renderWithProviders(<WelcomeSection />, { route: "/overview", auth: true });
    expect(screen.getByText("Connect apps")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /connect apps/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Connect apps").closest("[aria-disabled]")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
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
