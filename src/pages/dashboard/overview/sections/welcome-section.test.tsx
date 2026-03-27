import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test";
import { getGreetingPunctuation, default as WelcomeSection } from "./welcome-section";

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
